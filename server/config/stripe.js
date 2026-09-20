import Stripe from 'stripe';

export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
export const stripe = isStripeConfigured ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Cancels a payment that hasn't been completed. If it already succeeded (or was cancelled),
// Stripe returns an error, which we can safely ignore.
export const cancelPaymentIntent = async (paymentIntentId) => {
  if (!stripe || !paymentIntentId) return;
  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
  } catch {
    /* already succeeded or already cancelled */
  }
};

// Returns true if the refund was created. Failures are logged so they can be fixed in the Stripe dashboard.
export const refundPaymentIntent = async (paymentIntentId) => {
  if (!stripe || !paymentIntentId) return false;
  try {
    await stripe.refunds.create({ payment_intent: paymentIntentId });
    return true;
  } catch (err) {
    console.error(`REFUND FAILED for ${paymentIntentId}:`, err.message);
    return false;
  }
};