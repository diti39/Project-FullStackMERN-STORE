import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../api/products";
import { getErrorMessage } from "../api/axios";
import ProductCard from "../components/product/ProductCard";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProducts({ featured: true, limit: 4 })
      .then((res) => !cancelled && setProducts(res.products))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <section className="rounded-xl bg-indigo-600 px-6 py-14 text-center text-white">
        <h1 className="text-4xl font-bold">Welcome to MERN Store</h1>
        <p className="mx-auto mt-3 max-w-xl text-indigo-100">
          Quality products, simple checkout. Browse the catalogue and find
          something you like.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
        >
          Shop all products
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Featured products</h2>
        <ErrorMessage>{error}</ErrorMessage>
        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
