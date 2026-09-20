import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";
import { createOrder } from "../api/orders";
import { getErrorMessage } from "../api/axios";
import FormInput from "../components/common/FormInput";
import ErrorMessage from "../components/common/ErrorMessage";
import CartSummary from "../components/cart/CartSummary";
import { formatPrice } from "../utils/format";

export default function Checkout() {
  const { user } = useAuth();
  const { items, prices, clearCart } = useCart();
  const navigate = useNavigate();
  const orderPlaced = useRef(false); // stops the "empty cart" redirect firing after a successful order

  const [address, setAddress] = useState({
    fullName: user?.name || "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0 && !orderPlaced.current)
    return <Navigate to="/cart" replace />;

  const handleChange = (e) =>
    setAddress({ ...address, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // Send only ids and quantities. The server looks up the real prices.
      const order = await createOrder({
        orderItems: items.map(({ product, qty }) => ({ product, qty })),
        shippingAddress: address,
        paymentMethod: "stripe",
      });

      orderPlaced.current = true;
      clearCart();
      navigate(`/orders/${order._id}`, {
        replace: true,
        state: { justPlaced: true },
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 lg:col-span-2"
        >
          <h2 className="text-lg font-semibold">Shipping address</h2>

          <ErrorMessage>
            {error}
            {error && (
              <>
                {" "}
                <Link to="/cart" className="font-medium underline">
                  Review your cart
                </Link>
              </>
            )}
          </ErrorMessage>

          <FormInput
            label="Full name"
            id="fullName"
            name="fullName"
            required
            value={address.fullName}
            onChange={handleChange}
            autoComplete="name"
          />
          <FormInput
            label="Address"
            id="address"
            name="address"
            required
            value={address.address}
            onChange={handleChange}
            autoComplete="street-address"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="City"
              id="city"
              name="city"
              required
              value={address.city}
              onChange={handleChange}
              autoComplete="address-level2"
            />
            <FormInput
              label="Postal code"
              id="postalCode"
              name="postalCode"
              required
              value={address.postalCode}
              onChange={handleChange}
              autoComplete="postal-code"
            />
          </div>
          <FormInput
            label="Country"
            id="country"
            name="country"
            required
            value={address.country}
            onChange={handleChange}
            autoComplete="country-name"
          />

          <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
            You'll enter your card details on the next page, right after the
            order is placed.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting
              ? "Placing order..."
              : `Place order (${formatPrice(prices.totalPrice)})`}
          </button>
        </form>

        <aside className="space-y-4">
          <CartSummary prices={prices} />
          <ul className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 text-sm">
            {items.map((i) => (
              <li key={i.product} className="flex justify-between gap-2">
                <span className="text-gray-700">
                  {i.name} × {i.qty}
                </span>
                <span>{formatPrice(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
