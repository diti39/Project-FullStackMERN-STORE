import { Link } from "react-router-dom";
import useCart from "../hooks/useCart";
import QuantityInput from "../components/cart/QuantityInput";
import CartSummary from "../components/cart/CartSummary";
import { formatPrice } from "../utils/format";

export default function Cart() {
  const { items, prices, updateQty, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-gray-600">
          Find something you like and add it to your cart.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Shopping cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <ul className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <li
              key={item.product}
              className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4"
            >
              <Link
                to={`/products/${item.product}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded bg-gray-100"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </Link>

              <div className="flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <Link
                    to={`/products/${item.product}`}
                    className="font-medium hover:text-indigo-600"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-gray-600">
                    {formatPrice(item.price)} each
                  </p>
                  {item.qty >= item.countInStock && (
                    <p className="text-xs text-amber-600">
                      Maximum available quantity
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-5">
                  <QuantityInput
                    value={item.qty}
                    max={item.countInStock}
                    onChange={(qty) => updateQty(item.product, qty)}
                  />
                  <p className="w-20 text-right font-semibold">
                    {formatPrice(item.price * item.qty)}
                  </p>
                  <button
                    onClick={() => removeItem(item.product)}
                    className="text-sm text-red-600 hover:underline"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside>
          <CartSummary prices={prices}>
            <Link
              to="/checkout"
              className="block w-full rounded-md bg-indigo-600 py-2.5 text-center text-sm font-medium text-white hover:bg-indigo-700"
            >
              Proceed to checkout
            </Link>
            <p className="text-xs text-gray-500">
              Final prices and availability are confirmed when you place the
              order.
            </p>
          </CartSummary>
        </aside>
      </div>
    </div>
  );
}
