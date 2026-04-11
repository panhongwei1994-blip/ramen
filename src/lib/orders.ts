import type Stripe from "stripe";
import { getSeedProduct, getProductLocale, type CatalogAddOn } from "@/lib/catalog";

export type OrderStatus =
  | "pending_payment"
  | "paid_waiting_accept"
  | "accepted"
  | "cooking"
  | "delivering"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";
export type FulfillmentMethod = "delivery" | "pickup";
export type PaymentProvider = "stripe";

export type RuntimeEnv = {
  ORDERS?: {
    get(key: string, type?: "json" | "text"): Promise<unknown>;
    put(key: string, value: string): Promise<void>;
    list?(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{
      keys: Array<{ name: string }>;
      list_complete: boolean;
      cursor?: string;
    }>;
  };
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  PUBLIC_SITE_URL?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

export type OrderItemInput = {
  productId: string;
  quantity: number;
  addOnIds?: string[];
  note?: string;
};

export type CreateOrderInput = {
  lang?: string;
  customerName?: string;
  phone?: string;
  address?: string;
  remark?: string;
  fulfillment: FulfillmentMethod;
  items: OrderItemInput[];
};

export type OrderItemRecord = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  addOns: CatalogAddOn[];
  note: string;
};

export type OrderLifecycleEvent = {
  id: string;
  type:
    | "order.created"
    | "order.status_changed"
    | "payment.session_created"
    | "payment.completed"
    | "payment.failed"
    | "payment.refunded";
  message: string;
  createdAt: string;
  meta?: Record<string, string>;
};

export type OrderRecord = {
  id: string;
  orderNo: string;
  lang: string;
  currency: "usd";
  fulfillment: FulfillmentMethod;
  customerName: string;
  phone: string;
  address: string;
  remark: string;
  itemsAmount: number;
  deliveryFee: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string;
  createdAt: string;
  paidAt: string;
  updatedAt: string;
  items: OrderItemRecord[];
  timeline: OrderLifecycleEvent[];
};

export type PaymentRecord = {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  providerSessionId: string;
  providerPaymentIntentId: string;
  amount: number;
  currency: "usd";
  status: PaymentStatus;
  rawPayload: string;
  createdAt: string;
  updatedAt: string;
};

export type WebhookEventRecord = {
  id: string;
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  processed: boolean;
  rawPayload: string;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
};

type DevStore = {
  ordersById: Map<string, OrderRecord>;
  ordersByNo: Map<string, string>;
  paymentsById: Map<string, PaymentRecord>;
  paymentsByOrderId: Map<string, string>;
  paymentsBySessionId: Map<string, string>;
  paymentsByIntentId: Map<string, string>;
  webhookEvents: Map<string, WebhookEventRecord>;
};

const devStore: DevStore = {
  ordersById: new Map(),
  ordersByNo: new Map(),
  paymentsById: new Map(),
  paymentsByOrderId: new Map(),
  paymentsBySessionId: new Map(),
  paymentsByIntentId: new Map(),
  webhookEvents: new Map(),
};

const ORDER_PREFIX = "order:";
const ORDER_NO_PREFIX = "order-no:";
const PAYMENT_PREFIX = "payment:";
const PAYMENT_ORDER_PREFIX = "payment-order:";
const PAYMENT_SESSION_PREFIX = "payment-session:";
const PAYMENT_INTENT_PREFIX = "payment-intent:";
const WEBHOOK_PREFIX = "webhook:";

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid_waiting_accept", "cancelled"],
  paid_waiting_accept: ["accepted", "cancelled", "refunded"],
  accepted: ["cooking"],
  cooking: ["delivering"],
  delivering: ["completed"],
  completed: [],
  cancelled: [],
  refunded: [],
};

function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeString(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value?: string) {
  const normalized = normalizeString(value);
  return normalized;
}

function cleanPaymentIntentId(value: Stripe.Checkout.Session["payment_intent"] | string) {
  return typeof value === "string" ? value : "";
}

function orderKey(orderId: string) {
  return `${ORDER_PREFIX}${orderId}`;
}

function orderNoKey(orderNo: string) {
  return `${ORDER_NO_PREFIX}${orderNo}`;
}

function paymentKey(paymentId: string) {
  return `${PAYMENT_PREFIX}${paymentId}`;
}

function paymentOrderKey(orderId: string) {
  return `${PAYMENT_ORDER_PREFIX}${orderId}`;
}

function paymentSessionKey(sessionId: string) {
  return `${PAYMENT_SESSION_PREFIX}${sessionId}`;
}

function paymentIntentKey(paymentIntentId: string) {
  return `${PAYMENT_INTENT_PREFIX}${paymentIntentId}`;
}

function webhookKey(provider: PaymentProvider, eventId: string) {
  return `${WEBHOOK_PREFIX}${provider}:${eventId}`;
}

function getOrdersBinding(runtimeEnv?: RuntimeEnv) {
  return runtimeEnv?.ORDERS;
}

export function getRuntimeEnv(locals?: unknown) {
  return (locals as { runtime?: { env?: RuntimeEnv } })?.runtime?.env;
}

async function readJson<T>(key: string, runtimeEnv?: RuntimeEnv) {
  const binding = getOrdersBinding(runtimeEnv);
  if (binding) {
    const result = await binding.get(key, "json");
    return (result as T | null) ?? null;
  }

  if (key.startsWith(ORDER_PREFIX)) return (devStore.ordersById.get(key.slice(ORDER_PREFIX.length)) as T | undefined) ?? null;
  if (key.startsWith(PAYMENT_PREFIX)) {
    return (devStore.paymentsById.get(key.slice(PAYMENT_PREFIX.length)) as T | undefined) ?? null;
  }
  if (key.startsWith(WEBHOOK_PREFIX)) {
    return (devStore.webhookEvents.get(key.slice(WEBHOOK_PREFIX.length)) as T | undefined) ?? null;
  }

  return null;
}

async function readText(key: string, runtimeEnv?: RuntimeEnv) {
  const binding = getOrdersBinding(runtimeEnv);
  if (binding) {
    const result = await binding.get(key, "text");
    return typeof result === "string" ? result : "";
  }

  if (key.startsWith(ORDER_NO_PREFIX)) return devStore.ordersByNo.get(key.slice(ORDER_NO_PREFIX.length)) ?? "";
  if (key.startsWith(PAYMENT_ORDER_PREFIX)) return devStore.paymentsByOrderId.get(key.slice(PAYMENT_ORDER_PREFIX.length)) ?? "";
  if (key.startsWith(PAYMENT_SESSION_PREFIX)) return devStore.paymentsBySessionId.get(key.slice(PAYMENT_SESSION_PREFIX.length)) ?? "";
  if (key.startsWith(PAYMENT_INTENT_PREFIX)) return devStore.paymentsByIntentId.get(key.slice(PAYMENT_INTENT_PREFIX.length)) ?? "";

  return "";
}

async function writeJson<T>(key: string, value: T, runtimeEnv?: RuntimeEnv) {
  const binding = getOrdersBinding(runtimeEnv);
  if (binding) {
    await binding.put(key, JSON.stringify(value));
    return;
  }

  if (key.startsWith(ORDER_PREFIX)) {
    devStore.ordersById.set(key.slice(ORDER_PREFIX.length), value as OrderRecord);
    return;
  }
  if (key.startsWith(PAYMENT_PREFIX)) {
    devStore.paymentsById.set(key.slice(PAYMENT_PREFIX.length), value as PaymentRecord);
    return;
  }
  if (key.startsWith(WEBHOOK_PREFIX)) {
    devStore.webhookEvents.set(key.slice(WEBHOOK_PREFIX.length), value as WebhookEventRecord);
  }
}

async function writeText(key: string, value: string, runtimeEnv?: RuntimeEnv) {
  const binding = getOrdersBinding(runtimeEnv);
  if (binding) {
    await binding.put(key, value);
    return;
  }

  if (key.startsWith(ORDER_NO_PREFIX)) {
    devStore.ordersByNo.set(key.slice(ORDER_NO_PREFIX.length), value);
    return;
  }
  if (key.startsWith(PAYMENT_ORDER_PREFIX)) {
    devStore.paymentsByOrderId.set(key.slice(PAYMENT_ORDER_PREFIX.length), value);
    return;
  }
  if (key.startsWith(PAYMENT_SESSION_PREFIX)) {
    devStore.paymentsBySessionId.set(key.slice(PAYMENT_SESSION_PREFIX.length), value);
    return;
  }
  if (key.startsWith(PAYMENT_INTENT_PREFIX)) {
    devStore.paymentsByIntentId.set(key.slice(PAYMENT_INTENT_PREFIX.length), value);
  }
}

async function listOrderKeys(runtimeEnv?: RuntimeEnv) {
  const binding = getOrdersBinding(runtimeEnv);
  if (binding?.list) {
    const keys: string[] = [];
    let cursor: string | undefined;

    do {
      const page = await binding.list({ prefix: ORDER_PREFIX, cursor, limit: 1000 });
      keys.push(...page.keys.map((item) => item.name));
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    return keys;
  }

  return Array.from(devStore.ordersById.keys()).map((id) => orderKey(id));
}

function createLifecycleEvent(
  type: OrderLifecycleEvent["type"],
  message: string,
  meta?: Record<string, string>,
): OrderLifecycleEvent {
  return {
    id: randomId("evt"),
    type,
    message,
    createdAt: nowIso(),
    meta,
  };
}

function buildOrderNo() {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  return `RM-${stamp}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function calculateDeliveryFee(fulfillment: FulfillmentMethod) {
  return fulfillment === "pickup" ? 0 : 4.9;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function assertValidTransition(current: OrderStatus, next: OrderStatus) {
  if (current === next) return;
  if (ORDER_TRANSITIONS[current].includes(next)) return;
  throw new Error(`Invalid order status transition: ${current} -> ${next}`);
}

function normalizeItems(items: OrderItemInput[]) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order items are required.");
  }

  return items.map((item) => {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Each order item must have a valid quantity.");
    }

    return {
      productId: normalizeString(item.productId),
      quantity,
      addOnIds: Array.isArray(item.addOnIds) ? [...new Set(item.addOnIds.map((id) => normalizeString(id)).filter(Boolean))] : [],
      note: normalizeOptionalString(item.note),
    };
  });
}

function recalculateOrderItems(orderId: string, items: OrderItemInput[], lang?: string) {
  const locale = getProductLocale(lang);
  const normalizedItems = normalizeItems(items);

  const orderItems: OrderItemRecord[] = normalizedItems.map((item) => {
    const product = getSeedProduct(item.productId, locale);
    if (!product || !product.isAvailable) {
      throw new Error(`Product unavailable: ${item.productId}`);
    }

    const addOns = item.addOnIds.map((addOnId) => {
      const matched = product.addOns.find((candidate) => candidate.id === addOnId);
      if (!matched) {
        throw new Error(`Invalid add-on ${addOnId} for ${product.name}`);
      }
      return matched;
    });

    const unitPrice = roundMoney(product.price + addOns.reduce((sum, addOn) => sum + addOn.price, 0));
    const subtotal = roundMoney(unitPrice * item.quantity);

    return {
      id: randomId("item"),
      orderId,
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      unitPrice,
      quantity: item.quantity,
      subtotal,
      addOns,
      note: item.note,
    };
  });

  return orderItems;
}

async function saveOrder(order: OrderRecord, runtimeEnv?: RuntimeEnv) {
  await writeJson(orderKey(order.id), order, runtimeEnv);
  await writeText(orderNoKey(order.orderNo), order.id, runtimeEnv);
}

async function savePayment(payment: PaymentRecord, runtimeEnv?: RuntimeEnv) {
  await writeJson(paymentKey(payment.id), payment, runtimeEnv);
  await writeText(paymentOrderKey(payment.orderId), payment.id, runtimeEnv);

  if (payment.providerSessionId) {
    await writeText(paymentSessionKey(payment.providerSessionId), payment.id, runtimeEnv);
  }
  if (payment.providerPaymentIntentId) {
    await writeText(paymentIntentKey(payment.providerPaymentIntentId), payment.id, runtimeEnv);
  }
}

async function saveWebhookEvent(event: WebhookEventRecord, runtimeEnv?: RuntimeEnv) {
  await writeJson(webhookKey(event.provider, event.eventId), event, runtimeEnv);
}

export async function getOrderById(orderId: string, runtimeEnv?: RuntimeEnv) {
  return await readJson<OrderRecord>(orderKey(orderId), runtimeEnv);
}

export async function getOrderByOrderNo(orderNo: string, runtimeEnv?: RuntimeEnv) {
  const orderId = await readText(orderNoKey(orderNo), runtimeEnv);
  if (!orderId) return null;
  return await getOrderById(orderId, runtimeEnv);
}

export async function getOrder(orderLookup: string, runtimeEnv?: RuntimeEnv) {
  return (await getOrderById(orderLookup, runtimeEnv)) ?? (await getOrderByOrderNo(orderLookup, runtimeEnv));
}

export async function listOrders(runtimeEnv?: RuntimeEnv) {
  const keys = await listOrderKeys(runtimeEnv);
  const orders = await Promise.all(keys.map(async (key) => await readJson<OrderRecord>(key, runtimeEnv)));
  return orders
    .filter((order): order is OrderRecord => Boolean(order))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getPaymentByOrderId(orderId: string, runtimeEnv?: RuntimeEnv) {
  const paymentId = await readText(paymentOrderKey(orderId), runtimeEnv);
  return paymentId ? await readJson<PaymentRecord>(paymentKey(paymentId), runtimeEnv) : null;
}

async function getPaymentBySessionId(sessionId: string, runtimeEnv?: RuntimeEnv) {
  const paymentId = await readText(paymentSessionKey(sessionId), runtimeEnv);
  return paymentId ? await readJson<PaymentRecord>(paymentKey(paymentId), runtimeEnv) : null;
}

async function getPaymentByIntentId(paymentIntentId: string, runtimeEnv?: RuntimeEnv) {
  const paymentId = await readText(paymentIntentKey(paymentIntentId), runtimeEnv);
  return paymentId ? await readJson<PaymentRecord>(paymentKey(paymentId), runtimeEnv) : null;
}

function updateOrderLifecycle(order: OrderRecord, event: OrderLifecycleEvent) {
  return {
    ...order,
    timeline: [...order.timeline, event],
    updatedAt: event.createdAt,
  };
}

export async function createOrder(input: CreateOrderInput & { runtimeEnv?: RuntimeEnv }) {
  if (!normalizeOptionalString(input.customerName)) {
    throw new Error("Customer name is required.");
  }
  if (!normalizeOptionalString(input.phone)) {
    throw new Error("Customer phone is required.");
  }
  if (input.fulfillment === "delivery" && !normalizeOptionalString(input.address)) {
    throw new Error("Delivery address is required.");
  }

  const orderId = randomId("order");
  const createdAt = nowIso();
  const items = recalculateOrderItems(orderId, input.items, input.lang);
  const itemsAmount = roundMoney(items.reduce((sum, item) => sum + item.subtotal, 0));
  const deliveryFee = calculateDeliveryFee(input.fulfillment);
  const totalAmount = roundMoney(itemsAmount + deliveryFee);
  const orderNo = buildOrderNo();
  const lifecycle = createLifecycleEvent("order.created", "Order created and persisted before payment.");

  const order: OrderRecord = {
    id: orderId,
    orderNo,
    lang: getProductLocale(input.lang),
    currency: "usd",
    fulfillment: input.fulfillment,
    customerName: normalizeOptionalString(input.customerName),
    phone: normalizeOptionalString(input.phone),
    address: input.fulfillment === "delivery" ? normalizeOptionalString(input.address) : "",
    remark: normalizeOptionalString(input.remark),
    itemsAmount,
    deliveryFee,
    totalAmount,
    paymentStatus: "unpaid",
    orderStatus: "pending_payment",
    stripeCheckoutSessionId: "",
    stripePaymentIntentId: "",
    createdAt,
    paidAt: "",
    updatedAt: createdAt,
    items,
    timeline: [lifecycle],
  };

  await saveOrder(order, input.runtimeEnv);
  return order;
}

export async function updateOrder(
  orderLookup: string,
  updater: (current: OrderRecord) => OrderRecord,
  runtimeEnv?: RuntimeEnv,
) {
  const current = await getOrder(orderLookup, runtimeEnv);
  if (!current) return null;

  const next = updater(current);
  next.updatedAt = nowIso();
  await saveOrder(next, runtimeEnv);
  return next;
}

export async function transitionOrderStatus(input: {
  orderLookup: string;
  nextStatus: OrderStatus;
  runtimeEnv?: RuntimeEnv;
  message?: string;
}) {
  const order = await getOrder(input.orderLookup, input.runtimeEnv);
  if (!order) {
    throw new Error("Order not found.");
  }

  assertValidTransition(order.orderStatus, input.nextStatus);

  const message =
    input.message ??
    `Order status changed from ${order.orderStatus} to ${input.nextStatus}.`;
  const event = createLifecycleEvent("order.status_changed", message, {
    from: order.orderStatus,
    to: input.nextStatus,
  });

  const nextOrder = updateOrderLifecycle(
    {
      ...order,
      orderStatus: input.nextStatus,
      paymentStatus: input.nextStatus === "refunded" ? "refunded" : order.paymentStatus,
    },
    event,
  );

  await saveOrder(nextOrder, input.runtimeEnv);
  return nextOrder;
}

function buildAddressFromSession(session: Stripe.Checkout.Session) {
  const shipping = session.customer_details?.address;
  if (!shipping) return "";

  return [
    shipping.line1,
    shipping.line2,
    shipping.city,
    shipping.state,
    shipping.postal_code,
    shipping.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function attachStripeCheckoutSession(input: {
  orderId: string;
  sessionId: string;
  paymentIntentId?: string;
  rawPayload?: string;
  runtimeEnv?: RuntimeEnv;
}) {
  const order = await getOrderById(input.orderId, input.runtimeEnv);
  if (!order) {
    throw new Error("Order not found.");
  }

  const existingPayment = await getPaymentByOrderId(order.id, input.runtimeEnv);
  const timestamp = nowIso();
  const sessionId = normalizeString(input.sessionId);
  const paymentIntentId = normalizeString(input.paymentIntentId);

  const nextOrder = updateOrderLifecycle(
    {
      ...order,
      stripeCheckoutSessionId: sessionId,
      stripePaymentIntentId: paymentIntentId || order.stripePaymentIntentId,
    },
    createLifecycleEvent("payment.session_created", "Stripe Checkout session created.", {
      sessionId,
    }),
  );

  await saveOrder(nextOrder, input.runtimeEnv);

  const payment: PaymentRecord = existingPayment
    ? {
        ...existingPayment,
        providerSessionId: sessionId,
        providerPaymentIntentId: paymentIntentId || existingPayment.providerPaymentIntentId,
        rawPayload: input.rawPayload ?? existingPayment.rawPayload,
        updatedAt: timestamp,
      }
    : {
        id: randomId("payment"),
        orderId: order.id,
        provider: "stripe",
        providerSessionId: sessionId,
        providerPaymentIntentId: paymentIntentId,
        amount: order.totalAmount,
        currency: order.currency,
        status: order.paymentStatus,
        rawPayload: input.rawPayload ?? "",
        createdAt: timestamp,
        updatedAt: timestamp,
      };

  await savePayment(payment, input.runtimeEnv);
  return nextOrder;
}

export async function startWebhookEvent(input: {
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  rawPayload: string;
  runtimeEnv?: RuntimeEnv;
}) {
  const existing = await readJson<WebhookEventRecord>(webhookKey(input.provider, input.eventId), input.runtimeEnv);
  if (existing?.processed) {
    return { alreadyProcessed: true, event: existing };
  }

  const timestamp = nowIso();
  const event: WebhookEventRecord = existing ?? {
    id: randomId("webhook"),
    provider: input.provider,
    eventId: input.eventId,
    eventType: input.eventType,
    processed: false,
    rawPayload: input.rawPayload,
    errorMessage: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  event.eventType = input.eventType;
  event.rawPayload = input.rawPayload;
  event.updatedAt = timestamp;
  await saveWebhookEvent(event, input.runtimeEnv);
  return { alreadyProcessed: false, event };
}

export async function finishWebhookEvent(input: {
  provider: PaymentProvider;
  eventId: string;
  processed: boolean;
  errorMessage?: string;
  runtimeEnv?: RuntimeEnv;
}) {
  const existing = await readJson<WebhookEventRecord>(webhookKey(input.provider, input.eventId), input.runtimeEnv);
  if (!existing) return null;

  const next = {
    ...existing,
    processed: input.processed,
    errorMessage: normalizeOptionalString(input.errorMessage),
    updatedAt: nowIso(),
  };

  await saveWebhookEvent(next, input.runtimeEnv);
  return next;
}

function buildPaidOrder(order: OrderRecord, session: Stripe.Checkout.Session) {
  const paidAt = nowIso();
  const nextStatus = order.orderStatus === "pending_payment" ? "paid_waiting_accept" : order.orderStatus;
  const nextOrder = {
    ...order,
    customerName: normalizeOptionalString(session.customer_details?.name ?? undefined) || order.customerName,
    phone: normalizeOptionalString(session.customer_details?.phone ?? undefined) || order.phone,
    address: buildAddressFromSession(session) || order.address,
    paymentStatus: "paid" as const,
    orderStatus: nextStatus,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: cleanPaymentIntentId(session.payment_intent) || order.stripePaymentIntentId,
    paidAt: order.paidAt || paidAt,
  };

  return updateOrderLifecycle(
    nextOrder,
    createLifecycleEvent("payment.completed", "Stripe payment confirmed by webhook.", {
      sessionId: session.id,
      paymentIntentId: cleanPaymentIntentId(session.payment_intent),
    }),
  );
}

async function savePaymentStatusForOrder(
  order: OrderRecord,
  status: PaymentStatus,
  rawPayload: string,
  runtimeEnv?: RuntimeEnv,
) {
  const existingPayment = await getPaymentByOrderId(order.id, runtimeEnv);
  const timestamp = nowIso();

  const payment: PaymentRecord = existingPayment
    ? {
        ...existingPayment,
        status,
        rawPayload: rawPayload || existingPayment.rawPayload,
        updatedAt: timestamp,
      }
    : {
        id: randomId("payment"),
        orderId: order.id,
        provider: "stripe",
        providerSessionId: order.stripeCheckoutSessionId,
        providerPaymentIntentId: order.stripePaymentIntentId,
        amount: order.totalAmount,
        currency: order.currency,
        status,
        rawPayload,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

  await savePayment(payment, runtimeEnv);
  return payment;
}

export async function markOrderPaidFromCheckoutSession(
  session: Stripe.Checkout.Session,
  rawPayload: string,
  runtimeEnv?: RuntimeEnv,
) {
  const lookup =
    normalizeString(session.metadata?.orderId) ||
    normalizeString(session.client_reference_id ?? undefined);
  if (!lookup) {
    throw new Error("Checkout session missing order reference.");
  }

  const order = await getOrder(lookup, runtimeEnv);
  if (!order) {
    throw new Error("Order not found for checkout session.");
  }
  if (order.paymentStatus === "paid" && order.orderStatus !== "pending_payment") {
    return order;
  }

  const nextOrder = buildPaidOrder(order, session);
  await saveOrder(nextOrder, runtimeEnv);
  await savePaymentStatusForOrder(nextOrder, "paid", rawPayload, runtimeEnv);
  return nextOrder;
}

export async function markOrderPaymentFailed(input: {
  sessionId: string;
  paymentIntentId?: string;
  rawPayload: string;
  runtimeEnv?: RuntimeEnv;
}) {
  const bySession = input.sessionId ? await getPaymentBySessionId(input.sessionId, input.runtimeEnv) : null;
  const byIntent = input.paymentIntentId
    ? await getPaymentByIntentId(input.paymentIntentId, input.runtimeEnv)
    : null;
  const payment = bySession ?? byIntent;
  if (!payment) {
    return null;
  }

  const order = await getOrderById(payment.orderId, input.runtimeEnv);
  if (!order) {
    return null;
  }

  const nextOrder = updateOrderLifecycle(
    {
      ...order,
      paymentStatus: "failed",
      stripeCheckoutSessionId: input.sessionId || order.stripeCheckoutSessionId,
      stripePaymentIntentId: input.paymentIntentId || order.stripePaymentIntentId,
    },
    createLifecycleEvent("payment.failed", "Stripe reported a payment failure.", {
      sessionId: input.sessionId,
      paymentIntentId: input.paymentIntentId ?? "",
    }),
  );

  await saveOrder(nextOrder, input.runtimeEnv);
  await savePaymentStatusForOrder(nextOrder, "failed", input.rawPayload, input.runtimeEnv);
  return nextOrder;
}

export async function markOrderRefunded(input: {
  paymentIntentId: string;
  rawPayload: string;
  runtimeEnv?: RuntimeEnv;
}) {
  const payment = await getPaymentByIntentId(input.paymentIntentId, input.runtimeEnv);
  if (!payment) {
    return null;
  }

  const order = await getOrderById(payment.orderId, input.runtimeEnv);
  if (!order) {
    return null;
  }
  if (order.orderStatus !== "refunded") {
    assertValidTransition(order.orderStatus, "refunded");
  }

  const nextOrder = updateOrderLifecycle(
    {
      ...order,
      paymentStatus: "refunded",
      orderStatus: "refunded",
    },
    createLifecycleEvent("payment.refunded", "Stripe refund confirmed by webhook.", {
      paymentIntentId: input.paymentIntentId,
    }),
  );

  await saveOrder(nextOrder, input.runtimeEnv);
  await savePaymentStatusForOrder(nextOrder, "refunded", input.rawPayload, input.runtimeEnv);
  return nextOrder;
}
