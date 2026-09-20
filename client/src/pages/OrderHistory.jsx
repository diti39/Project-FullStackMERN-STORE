import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders, cancelOrder } from "../api/orders";
import { getErrorMessage } from "../api/axios";
import { formatDate, formatPrice } from "../utils/format";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import StatusBadge from "../components/order/StatusBadge";

// Same rule the server enforces: only unpaid, pending orders can be cancelled
const canCancel = (order) => order.status === "pending" && !order.isPaid;

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyOrders()
      .then((res) => !cancelled && setOrders(res))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCancel = async (order) => {
    if (
      !window.confirm("Cancel this order? The items will be returned to stock.")
    )
      return;
    setError("");
    setCancellingId(order._id);
    try {
      const updated = await cancelOrder(order._id);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My orders</h1>
      <ErrorMessage>{error}</ErrorMessage>

      {orders.length === 0 && !error ? (
        <div className="py-12 text-center">
          <p className="text-gray-600">You haven't placed any orders yet.</p>
          <Link
            to="/products"
            className="mt-3 inline-block text-indigo-600 hover:underline"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((order) => {
            const itemCount = order.orderItems.reduce(
              (sum, i) => sum + i.qty,
              0,
            );
            return (
              <li
                key={order._id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="font-semibold">
                      {formatPrice(order.totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {order.orderItems.slice(0, 4).map((item) => (
                    <div
                      key={item.product}
                      className="h-12 w-12 overflow-hidden rounded bg-gray-100"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                  {order.orderItems.length > 4 && (
                    <span className="text-sm text-gray-500">
                      +{order.orderItems.length - 4} more
                    </span>
                  )}
                  <span className="ml-2 text-sm text-gray-600">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                    {!order.isPaid &&
                      order.status !== "cancelled" &&
                      " · awaiting payment"}
                  </span>
                </div>

                <div className="mt-4 flex gap-4 text-sm">
                  <Link
                    to={`/orders/${order._id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    View details
                  </Link>
                  {canCancel(order) && (
                    <button
                      onClick={() => handleCancel(order)}
                      disabled={cancellingId === order._id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {cancellingId === order._id
                        ? "Cancelling..."
                        : "Cancel order"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
