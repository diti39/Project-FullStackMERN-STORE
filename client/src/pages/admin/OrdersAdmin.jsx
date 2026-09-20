import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAllOrders, updateOrderStatus } from "../../api/orders";
import { getErrorMessage } from "../../api/axios";
import { formatDate, formatPrice } from "../../utils/format";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import Pagination from "../../components/common/Pagination";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const FINAL = ["cancelled", "delivered"]; // the server refuses changes to these

export default function OrdersAdmin() {
  // Status filter lives in the URL so the dashboard's status chips can link here
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "";

  const [data, setData] = useState({ orders: [], pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAllOrders({ page, limit: 10, status: statusFilter || undefined })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError("");
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, statusFilter]);

  const handleFilter = (e) => {
    setPage(1);
    setSearchParams(e.target.value ? { status: e.target.value } : {});
  };

  const handleStatusChange = async (order, newStatus) => {
    if (newStatus === order.status) return;

    if (
      newStatus === "cancelled" &&
      !window.confirm(
        "Cancel this order? Stock will be returned, and a paid order will be refunded automatically. This is final.",
      )
    )
      return;
    if (
      newStatus === "delivered" &&
      !window.confirm("Mark as delivered? This is final.")
    )
      return;

    setError("");
    setUpdatingId(order._id);
    try {
      const updated = await updateOrderStatus(order._id, newStatus);
      // The response has no populated user, so merge only the fields that changed
      setData((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o._id === updated._id
            ? { ...o, status: updated.status, deliveredAt: updated.deliveredAt }
            : o,
        ),
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <label
          htmlFor="status-filter"
          className="text-sm font-medium text-gray-700"
        >
          Status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={handleFilter}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No orders found.
                    </td>
                  </tr>
                )}
                {data.orders.map((o) => (
                  <tr key={o._id}>
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${o._id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        #{o._id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {o.user?.name || "Deleted user"}
                      {o.user?.email && (
                        <div className="text-xs text-gray-500">
                          {o.user.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(o.totalPrice)}
                    </td>
                    <td className="px-4 py-3">{o.isPaid ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o, e.target.value)}
                        disabled={
                          FINAL.includes(o.status) || updatingId === o._id
                        }
                        aria-label={`Status for order ${o._id.slice(-8)}`}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm capitalize disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-gray-500">{data.total} orders</p>
          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
