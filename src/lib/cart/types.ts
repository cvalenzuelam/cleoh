export type CartItem = {
  key: string; // productId + size
  productId: string;
  slug: string;
  name: string;
  size: string;
  price: number;
  image: string | null;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
};

export const CART_STORAGE_KEY = "cleoh-cart-v1";

export function cartItemKey(productId: string, size: string) {
  return `${productId}::${size}`;
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function formatCartMoney(amount: number) {
  return `${new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount)} MXN`;
}
