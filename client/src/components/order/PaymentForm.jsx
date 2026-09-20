import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { createPaymentIntent, syncPayment } from "../../api/payments";
import { getErrorMessage } from "../../api/axios";
import ErrorMessage from "../common/ErrorMessage";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
// Created once, outside any component, so Stripe.js isn't reloaded on every render
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// The card fields themselves are rendered by Stripe inside an iframe.
// Card numbers never touch our server, which keeps us out of PCI-compliance trouble.
function CardForm({ orderId, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return; // Stripe.js hasn't loaded yet
    setError("");
    setSubmitting(true);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}`,
      },
      redirect: "if_required", // cards finish in place (3D Secure opens a popup), no page redirect
    });

    if (stripeError) {
      setError(stripeError.message); // e.g. "Your card was declined."
      setSubmitting(false);
      return;
    }

    // Ask OUR server to verify with Stripe. The webhook does the same job independently.
    try {
      await syncPayment(orderId);
    } catch {
      /* not fatal: the webhook will still mark the order as paid */
    }
    setSubmitting(false);
    onPaid();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <ErrorMessage>{error}</ErrorMessage>
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-md bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
}

export default function PaymentForm({ orderId, onPaid }) {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    createPaymentIntent(orderId)
      .then((res) => !cancelled && setClientSecret(res.clientSecret))
      .catch((err) => !cancelled && setError(getErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!stripePromise) {
    return (
      <ErrorMessage>
        Stripe isn't configured: set VITE_STRIPE_PUBLISHABLE_KEY in client/.env
        and restart Vite.
      </ErrorMessage>
    );
  }
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!clientSecret)
    return <p className="text-sm text-gray-500">Preparing secure payment...</p>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CardForm orderId={orderId} onPaid={onPaid} />
    </Elements>
  );
}
