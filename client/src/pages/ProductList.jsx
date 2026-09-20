import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "../api/products";
import { getErrorMessage } from "../api/axios";
import Filters from "../components/product/Filters";
import ProductCard from "../components/product/ProductCard";
import Pagination from "../components/common/Pagination";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

const PAGE_SIZE = 6; // small so pagination is visible with the seed data; raise to 12 later

export default function ProductList() {
  // All filter state lives in the URL: shareable links, and the back button just works
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.toString();

  const [data, setData] = useState({
    products: [],
    page: 1,
    pages: 1,
    total: 0,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getProducts({
      ...Object.fromEntries(new URLSearchParams(query)),
      limit: PAGE_SIZE,
    })
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));

    // If the filters change before the response arrives, ignore the stale response
    return () => {
      cancelled = true;
    };
  }, [query]);

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === "" || value == null) next.delete(key);
      else next.set(key, value);
    });
    if (!("page" in changes)) next.delete("page"); // any filter change goes back to page 1
    setSearchParams(next);
  };

  const values = {
    keyword: searchParams.get("keyword") || "",
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "newest",
  };
  const page = Number(searchParams.get("page")) || 1;

  const goToPage = (p) => {
    updateParams({ page: p });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Products</h1>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="md:w-64 md:shrink-0">
          <Filters
            values={values}
            categories={categories}
            onChange={updateParams}
            onClear={() => setSearchParams({})}
          />
        </aside>

        <div className="flex-1">
          <ErrorMessage>{error}</ErrorMessage>

          {loading ? (
            <Loader />
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-600">
                {data.total} {data.total === 1 ? "product" : "products"}
              </p>

              {data.products.length === 0 && !error ? (
                <p className="py-12 text-center text-gray-500">
                  No products match your filters.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.products.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              )}

              <Pagination page={page} pages={data.pages} onChange={goToPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
