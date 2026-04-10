export type CartItemPayload = {
  id?: string;
  productId?: string;
  name: string;
  image: string;
  quantity: number;
  addOnLabels: string[];
  addOnTotal?: number;
  notes: string;
  unitPrice: number;
  total: number;
};

export type CheckoutPayload = {
  name: string;
  phone: string;
  address?: string;
  fulfillment: "delivery" | "pickup";
  payment: "stripe" | "cash";
};

export type OrderRecord = {
  id: string;
  orderCode: string;
  lang: string;
  status: "pending_payment" | "paid" | "cash_pending" | "payment_failed";
  paymentStatus: "unpaid" | "paid" | "failed";
  fulfillment: "delivery" | "pickup";
  paymentMethod: "stripe" | "cash";
  customerName: string;
  customerPhone: string;
  address: string;
  items: CartItemPayload[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeCustomerEmail?: string;
  createdAt: string;
  updatedAt: string;
};

export type RuntimeEnv = {
  ORDERS?: {
    get(key: string, type?: "json"): Promise<unknown>;
    put(key: string, value: string): Promise<void>;
  };
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  PUBLIC_SITE_URL?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

const devOrderStore = new Map<string, OrderRecord>();

function getOrdersBinding(runtimeEnv?: RuntimeEnv) {
  return runtimeEnv?.ORDERS;
}

export function getRuntimeEnv(locals?: unknown) {
  return (locals as { runtime?: { env?: RuntimeEnv } })?.runtime?.env;
}

export function generateOrderCode(fulfillment: CheckoutPayload["fulfillment"]) {
  const prefix = fulfillment === "pickup" ? "PK" : "DL";
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

function generateOrderId() {
  return `order_${crypto.randomUUID()}`;
}

function calculateSubtotal(items: CartItemPayload[]) {
  return items.reduce((sum, item) => sum + item.total, 0);
}

async function saveOrder(order: OrderRecord, runtimeEnv?: RuntimeEnv) {
  const orders = getOrdersBinding(runtimeEnv);
  if (orders) {
    await orders.put(`order:${order.orderCode}`, JSON.stringify(order));
    return;
  }

  devOrderStore.set(order.orderCode, order);
}

export async function getOrder(orderCode: string, runtimeEnv?: RuntimeEnv) {
  const orders = getOrdersBinding(runtimeEnv);
  if (orders) {
    const result = await orders.get(`order:${orderCode}`, "json");
    return (result as OrderRecord | null) ?? null;
  }

  return devOrderStore.get(orderCode) ?? null;
}

export async function createOrder(input: {
  lang?: string;
  cart: CartItemPayload[];
  checkout: CheckoutPayload;
  deliveryFee: number;
  paymentMethod: "stripe" | "cash";
  orderCode?: string;
  runtimeEnv?: RuntimeEnv;
}) {
  const now = new Date().toISOString();
  const subtotal = calculateSubtotal(input.cart);
  const orderCode = input.orderCode ?? generateOrderCode(input.checkout.fulfillment);

  const order: OrderRecord = {
    id: generateOrderId(),
    orderCode,
    lang: input.lang ?? "en",
    status: input.paymentMethod === "cash" ? "cash_pending" : "pending_payment",
    paymentStatus: "unpaid",
    fulfillment: input.checkout.fulfillment,
    paymentMethod: input.paymentMethod,
    customerName: input.checkout.name.trim(),
    customerPhone: input.checkout.phone.trim(),
    address: input.checkout.address?.trim() ?? "",
    items: input.cart,
    subtotal,
    deliveryFee: input.deliveryFee,
    total: subtotal + input.deliveryFee,
    createdAt: now,
    updatedAt: now,
  };

  await saveOrder(order, input.runtimeEnv);
  return order;
}

export async function updateOrder(
  orderCode: string,
  updater: (current: OrderRecord) => OrderRecord,
  runtimeEnv?: RuntimeEnv,
) {
  const current = await getOrder(orderCode, runtimeEnv);
  if (!current) return null;

  const next = updater(current);
  next.updatedAt = new Date().toISOString();
  await saveOrder(next, runtimeEnv);
  return next;
}
