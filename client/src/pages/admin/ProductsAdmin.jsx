import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts, deleteProduct } from "../../api/products";
import { getErrorMessage } from "../../api/axios";
import { formatPrice } from "../../utils/format";
import useDebounce from "../../hooks/useDebounce";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import Pagination from "../../components/common/Pagination";

const PAGE_SIZE = 10;

export default function ProductsAdmin() {
  const [data, setData] = useState({ products: [], pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [version, setVersion] = useState(0); // bump to reload after a delete
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProducts({
      page,
      limit: PAGE_SIZE,
      keyword: debouncedSearch || undefined,
    })
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
  }, [page, debouncedSearch, version]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDelete = async (product) => {
    if (
      !window.confirm(
        `Delete "${product.name}"? Its reviews will be deleted too. This cannot be undone.`,
      )
    )
      return;
    setDeletingId(product._id);
    try {
      await deleteProduct(product._id);
      // If that was the last row on this page, step back one page
      if (data.products.length === 1 && page > 1) setPage(page - 1);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Search products..."
          aria-label="Search products"
          value={search}
          onChange={handleSearch}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:w-72"
        />
        <Link
          to="/admin/products/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add product
        </Link>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full min-w-160 text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.products.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No products found.
                    </td>
                  </tr>
                )}
                {data.products.map((p) => (
                  <tr key={p._id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
                          {p.images?.[0]?.url && (
                            <img
                              src={p.images[0].url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/products/${p._id}`}
                            className="font-medium hover:text-indigo-600"
                          >
                            {p.name}
                          </Link>
                          {p.isFeatured && (
                            <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.category}</td>
                    <td className="px-4 py-3">{formatPrice(p.price)}</td>
                    <td
                      className={`px-4 py-3 font-medium ${p.countInStock === 0 ? "text-red-600" : p.countInStock <= 5 ? "text-amber-600" : ""}`}
                    >
                      {p.countInStock}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/products/${p._id}/edit`}
                        className="mr-4 text-indigo-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p._id}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingId === p._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-gray-500">{data.total} products</p>
          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
