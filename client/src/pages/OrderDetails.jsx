import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getOrder, cancelOrder } from "../api/orders";
import { getErrorMessage } from "../api/axios";
import { formatDate, formatPrice } from "../utils/format";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import CartSummary from "../components/cart/CartSummary";
import StatusBadge from "../components/order/StatusBadge";
import PaymentForm from "../components/order/PaymentForm";

export default function OrderDetails() {
  const { id } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrder(id)
      .then((o) => !cancelled && setOrder(o))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Silent refresh (no spinner), used after a payment goes through
  const reloadOrder = () =>
    getOrder(id)
      .then(setOrder)
      .catch(() => {});

  const handleCancel = async () => {
    if (
      !window.confirm("Cancel this order? The items will be returned to stock.")
    )
      return;
    setCancelError("");
    setCancelling(true);
    try {
      setOrder(await cancelOrder(id));
    } catch (err) {
      setCancelError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Loader />;
  if (error || !order) {
    return (
      <div className="space-y-4">
        <ErrorMessage>{error || "Order not found"}</ErrorMessage>
        <Link to="/products" className="text-indigo-600 hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  const { shippingAddress: a } = order;
  const canPay =
    order.status === "pending" && String(order.user?._id) === String(user?._id);

  return (
    <div>
      <Link
        to="/orders"
        className="mb-4 inline-block text-sm text-indigo-600 hover:underline"
      >
        &larr; My orders
      </Link>

      {state?.justPlaced && (
        <div
          className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800"
          role="status"
        >
          Your order has been placed. Complete the payment below to confirm it.
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">
          Order #{order._id.slice(-8).toUpperCase()}
        </h1>
        <StatusBadge status={order.status} />
        {order.status === "pending" &&
          !order.isPaid &&
          String(order.user?._id) === String(user?._id) && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="ml-auto rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Cancel order"}
            </button>
          )}
      </div>
      {cancelError && (
        <div className="mb-4">
          <ErrorMessage>{cancelError}</ErrorMessage>
        </div>
      )}
      <p className="-mt-4 mb-6 text-sm text-gray-500">
        Placed on {formatDate(order.createdAt)}
      </p>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Items</h2>
            <ul className="divide-y divide-gray-100">
              {order.orderItems.map((item) => (
                <li key={item.product} className="flex items-center gap-4 py-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-gray-100">
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <Link
                    to={`/products/${item.product}`}
                    className="flex-1 hover:text-indigo-600"
                  >
                    {item.name}
                  </Link>
                  <span className="text-sm text-gray-600">
                    {item.qty} × {formatPrice(item.price)}
                  </span>
                  <span className="w-20 text-right font-medium">
                    {formatPrice(item.qty * item.price)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-2 text-lg font-semibold">Shipping address</h2>
            <address className="text-sm not-italic leading-6 text-gray-700">
              {a.fullName}
              <br />
              {a.address}
              <br />
              {a.postalCode} {a.city}
              <br />
              {a.country}
            </address>
          </section>
        </div>

        <aside className="space-y-4">
          <CartSummary prices={order} title="Totals" />
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
            <h2 className="mb-2 text-lg font-semibold">Payment</h2>
            {order.isPaid ? (
              <p className="text-green-700">
                Paid on {formatDate(order.paidAt)}
              </p>
            ) : order.status === "cancelled" ? (
              <p className="text-gray-600">This order was cancelled.</p>
            ) : canPay ? (
              <>
                <PaymentForm orderId={order._id} onPaid={reloadOrder} />
                <p className="mt-3 text-xs text-gray-500">
                  Test mode: use card 4242 4242 4242 4242, any future expiry
                  date and any CVC.
                </p>
              </>
            ) : (
              <p className="text-amber-700">Awaiting payment</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
