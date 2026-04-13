import type { CreateOrderInput, FulfillmentMethod, OrderItemInput } from "@/lib/orders";

type ClientCartItem = {
  productId?: string;
  quantity?: number;
  addOnIds?: string[];
  note?: string;
  notes?: string;
};

type ClientCheckout = {
  name?: string;
  phone?: string;
  address?: string;
  fulfillment?: FulfillmentMethod;
};

export function normalizeCartItems(items: unknown): OrderItemInput[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const cartItem = item as ClientCartItem;
    return {
      productId: typeof cartItem.productId === "string" ? cartItem.productId.trim() : "",
      quantity: Number(cartItem.quantity ?? 0),
      addOnIds: Array.isArray(cartItem.addOnIds) ? cartItem.addOnIds.filter((id): id is string => typeof id === "string") : [],
      note:
        typeof cartItem.note === "string"
          ? cartItem.note.trim()
          : typeof cartItem.notes === "string"
            ? cartItem.notes.trim()
            : "",
    };
  });
}

export function normalizeCreateOrderPayload(input: {
  lang?: string;
  items?: unknown;
  cart?: unknown;
  customerName?: string;
  phone?: string;
  address?: string;
  remark?: string;
  checkout?: ClientCheckout;
  fulfillment?: FulfillmentMethod;
  paymentMethod?: string;
}): CreateOrderInput {
  const checkout = input.checkout ?? {};
  const fulfillment = (input.fulfillment ?? checkout.fulfillment ?? "delivery") as FulfillmentMethod;

  return {
    lang: typeof input.lang === "string" ? input.lang : undefined,
    customerName:
      typeof input.customerName === "string"
        ? input.customerName.trim()
        : typeof checkout.name === "string"
          ? checkout.name.trim()
          : "",
    phone:
      typeof input.phone === "string"
        ? input.phone.trim()
        : typeof checkout.phone === "string"
          ? checkout.phone.trim()
          : "",
    address:
      typeof input.address === "string"
        ? input.address.trim()
        : typeof checkout.address === "string"
          ? checkout.address.trim()
          : "",
    remark: typeof input.remark === "string" ? input.remark.trim() : "",
    fulfillment,
    paymentMethod: input.paymentMethod === "cash" ? "cash" : "card",
    items: normalizeCartItems(input.items ?? input.cart),
  };
}
