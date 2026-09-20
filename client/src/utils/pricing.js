// DISPLAY ONLY. These mirror the rules in server/controllers/orderController.js so the
// cart can show an estimate. The server recalculates everything when the order is placed.
export const FREE_SHIPPING_OVER = 100;
export const SHIPPING_FEE = 10;
export const TAX_RATE = 0.1;

const round2 = (n) => Math.round(n * 100) / 100;

export function calcPrices(items) {
  const itemsPrice = round2(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  const shippingPrice = items.length === 0 || itemsPrice > FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  const taxPrice = round2(itemsPrice * TAX_RATE);
  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
}