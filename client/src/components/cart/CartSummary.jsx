import { formatPrice } from "../../utils/format";
import { FREE_SHIPPING_OVER } from "../../utils/pricing";

// Shows a price breakdown. Works for the cart estimate and for a saved order.
export default function CartSummary({
  prices,
  title = "Order summary",
  children,
}) {
  const Row = ({ label, value, bold }) => (
    <div
      className={`flex justify-between text-sm ${bold ? "border-t border-gray-200 pt-3 text-base font-semibold" : ""}`}
    >
      <span className={bold ? "" : "text-gray-600"}>{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Row label="Items" value={formatPrice(prices.itemsPrice)} />
      <Row
        label="Shipping"
        value={
          prices.shippingPrice === 0
            ? "Free"
            : formatPrice(prices.shippingPrice)
        }
      />
      <Row label="Tax" value={formatPrice(prices.taxPrice)} />
      <Row label="Total" value={formatPrice(prices.totalPrice)} bold />
      {prices.shippingPrice > 0 && (
        <p className="text-xs text-gray-500">
          Free shipping on orders over {formatPrice(FREE_SHIPPING_OVER)}.
        </p>
      )}
      {children}
    </div>
  );
}
