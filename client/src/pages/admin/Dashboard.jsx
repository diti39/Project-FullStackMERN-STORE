import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats } from "../../api/admin";
import { getErrorMessage } from "../../api/axios";
import { formatDate, formatPrice } from "../../utils/format";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import StatusBadge from "../../components/order/StatusBadge";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {note && <p className="mt-1 text-xs text-gray-400">{note}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getStats()
      .then((s) => !cancelled && setStats(s))
      .catch((err) => !cancelled && setError(getErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!stats) return <Loader />;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatPrice(stats.revenue)}
          note="Paid orders only"
        />
        <StatCard label="Orders" value={stats.orders} />
        <StatCard label="Products" value={stats.products} />
        <StatCard label="Users" value={stats.users} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Orders by status</h2>
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((s) => (
            <Link
              key={s}
              to={`/admin/orders?status=${s}`}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50"
            >
              <StatusBadge status={s} />
              <span className="font-semibold">
                {stats.ordersByStatus[s] || 0}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Low stock</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
              {stats.lowStock.map((p) => (
                <li
                  key={p._id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <Link
                    to={`/admin/products/${p._id}/edit`}
                    className="hover:text-indigo-600"
                  >
                    {p.name}
                  </Link>
                  <span
                    className={
                      p.countInStock === 0
                        ? "font-medium text-red-600"
                        : "font-medium text-amber-600"
                    }
                  >
                    {p.countInStock === 0
                      ? "Out of stock"
                      : `${p.countInStock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Recent orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
              {stats.recentOrders.map((o) => (
                <li
                  key={o._id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <Link
                      to={`/orders/${o._id}`}
                      className="font-medium hover:text-indigo-600"
                    >
                      #{o._id.slice(-8).toUpperCase()}
                    </Link>
                    <p className="text-gray-500">
                      {o.user?.name || "Deleted user"} ·{" "}
                      {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <span className="font-medium">
                      {formatPrice(o.totalPrice)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
