import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct } from "../api/products";
import { getErrorMessage } from "../api/axios";
import { formatPrice } from "../utils/format";
import useCart from "../hooks/useCart";
import QuantityInput from "../components/cart/QuantityInput";
import Rating from "../components/common/Rating";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import ReviewSection from "../components/product/ReviewSection";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setProduct(null);
    setActiveImage(0);
    setQty(1);
    setAdded(false);

    getProduct(id)
      .then((p) => !cancelled && setProduct(p))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Silent refresh after a review changes the average rating (no spinner)
  const refreshProduct = () =>
    getProduct(id)
      .then(setProduct)
      .catch(() => {});

  if (loading) return <Loader />;

  if (error || !product) {
    return (
      <div className="space-y-4">
        <ErrorMessage>{error || "Product not found"}</ErrorMessage>
        <Link to="/products" className="text-indigo-600 hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  const images = product.images || [];

  const handleAddToCart = () => {
    addItem(product, qty);
    setAdded(true);
  };
  const stock = product.countInStock;

  return (
    <div>
      <Link to="/products" className="text-sm text-indigo-600 hover:underline">
        &larr; Back to products
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {/* Images */}
        <div>
          <div className="aspect-4/3 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
            {images[activeImage] && (
              <img
                src={images[activeImage].url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.url}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={`h-16 w-16 overflow-hidden rounded border-2 ${
                    i === activeImage
                      ? "border-indigo-600"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && (
            <p className="text-sm uppercase tracking-wide text-gray-500">
              {product.brand}
            </p>
          )}
          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
          <Rating
            value={product.rating}
            count={product.numReviews}
            className="mt-2"
          />

          <p className="mt-4 text-3xl font-semibold">
            {formatPrice(product.price)}
          </p>

          <p className="mt-3 text-sm">
            {stock === 0 ? (
              <span className="font-medium text-red-600">Out of stock</span>
            ) : stock <= 5 ? (
              <span className="font-medium text-amber-600">
                Only {stock} left
              </span>
            ) : (
              <span className="font-medium text-green-600">In stock</span>
            )}
            <span className="text-gray-400"> · </span>
            <Link
              to={`/products?category=${encodeURIComponent(product.category)}`}
              className="text-gray-600 hover:underline"
            >
              {product.category}
            </Link>
          </p>

          <p className="mt-5 whitespace-pre-line text-gray-700">
            {product.description}
          </p>

          {stock > 0 && (
            <div className="mt-6 flex items-center gap-4">
              <QuantityInput value={qty} max={stock} onChange={setQty} />
              <button
                onClick={handleAddToCart}
                className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Add to cart
              </button>
            </div>
          )}
          {added && (
            <p className="mt-3 text-sm text-green-700" role="status">
              Added to cart.{" "}
              <Link to="/cart" className="font-medium underline">
                View cart
              </Link>
            </p>
          )}
        </div>
      </div>

      <ReviewSection productId={product._id} onChanged={refreshProduct} />
    </div>
  );
}
