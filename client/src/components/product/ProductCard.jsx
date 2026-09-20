import { Link } from "react-router-dom";
import Rating from "../common/Rating";
import { formatPrice } from "../../utils/format";

export default function ProductCard({ product }) {
  const image = product.images?.[0]?.url;
  const soldOut = product.countInStock === 0;

  return (
    <Link
      to={`/products/${product._id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-4/3 bg-gray-100">
        {image && (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
        {soldOut && (
          <span className="absolute left-2 top-2 rounded bg-gray-900/80 px-2 py-0.5 text-xs font-medium text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.brand && (
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {product.brand}
          </p>
        )}
        <h3 className="font-medium group-hover:text-indigo-600">
          {product.name}
        </h3>
        <Rating value={product.rating} count={product.numReviews} />
        <p className="mt-auto pt-2 text-lg font-semibold">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
