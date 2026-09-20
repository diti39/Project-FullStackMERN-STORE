import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import { stripe, isStripeConfigured, refundPaymentIntent } from '../config/stripe.js';

const toCents = (dollars) => Math.round(dollars * 100);

// Marks an order as paid from a *succeeded* PaymentIntent that came straight from Stripe.
// Called by both the webhook and the sync endpoint, so it must be safe to run twice.
async function markOrderPaid(intent) {
  const orderId = intent.metadata?.orderId; // set by us, server-side, when the intent was created
  if (!orderId) return null;

  const order = await Order.findById(orderId);
  if (!order) return null;
  if (order.isPaid) return order; // already handled (webhook and sync both ran)

  // The amount Stripe actually collected must match what the order costs
  if (intent.amount_received !== toCents(order.totalPrice)) {
    console.error(`Amount mismatch on order ${orderId}: got ${intent.amount_received}, expected ${toCents(order.totalPrice)}`);
    return null;
  }

  // Customer paid, but the order was cancelled in the meantime: give the money back
  if (order.status === 'cancelled') {
    await refundPaymentIntent(intent.id);
    return order;
  }

  // Atomic: if two callers race, only one of them flips isPaid
  await Order.findOneAndUpdate(
    { _id: orderId, isPaid: false, status: { $ne: 'cancelled' } },
    {
      isPaid: true,
      paidAt: new Date(),
      paymentResult: {
        id: intent.id,
        status: intent.status,
        email: intent.receipt_email || undefined,
      },
    }
  );
  // Move pending orders on to processing (leave later statuses alone)
  await Order.updateOne({ _id: orderId, status: 'pending' }, { status: 'processing' });

  return Order.findById(orderId);
}

// POST /api/payments/create-intent   Body: { orderId }
export const createPaymentIntent = asyncHandler(async (req, res) => {
  if (!isStripeConfigured) {
    res.status(500);
    throw new Error('Payments are not configured on the server (missing STRIPE_SECRET_KEY)');
  }

  // Only the owner can pay, and the amount comes from the saved order, never from the client
  const order = await Order.findOne({ _id: req.body.orderId, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.isPaid) {
    res.status(400);
    throw new Error('This order is already paid');
  }
  if (order.status !== 'pending') {
    res.status(400);
    throw new Error('This order can no longer be paid');
  }

  const amount = toCents(order.totalPrice);

  // The idempotency key makes repeated calls (page reloads, double clicks, React StrictMode)
  // return the SAME PaymentIntent instead of creating a new one each time.
  const intent = await stripe.paymentIntents.create(
    {
      amount,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { orderId: String(order._id), userId: String(req.user._id) },
    },
    { idempotencyKey: `order-${order._id}-${amount}` }
  );

  await Order.updateOne({ _id: order._id }, { paymentIntentId: intent.id });

  res.json({ clientSecret: intent.client_secret });
});

// POST /api/payments/sync   Body: { orderId }
// After the browser confirms a payment, ask Stripe directly whether it succeeded.
// The client's word is never trusted: we fetch the PaymentIntent from Stripe ourselves.
export const syncPayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.isPaid && order.paymentIntentId && isStripeConfigured) {
    const intent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
    if (intent.status === 'succeeded' && intent.metadata?.orderId === String(order._id)) {
      await markOrderPaid(intent);
    }
  }

  const fresh = await Order.findById(order._id).populate('user', 'name email');
  res.json(fresh);
});

// POST /api/payments/webhook   (registered in app.js with a RAW body parser)
// Stripe calls this itself, even if the customer closes the tab right after paying.
export const handleWebhook = async (req, res) => {
  if (!isStripeConfigured || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send('Stripe webhook is not configured');
  }

  let event;
  try {
    // Verifies the signature, so nobody can fake a "payment succeeded" request
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send('Invalid signature');
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      await markOrderPaid(event.data.object);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).send('Handler error'); // non-2xx makes Stripe retry later
  }

  res.json({ received: true });
};