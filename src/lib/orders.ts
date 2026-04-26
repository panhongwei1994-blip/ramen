import type Stripe from "stripe";
import { getProductLocale, type CatalogAddOn } from "@/lib/catalog";

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

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ["paid_waiting_accept", "accepted", "cooking", "delivering"];
export const HISTORY_ORDER_STATUSES: OrderStatus[] = ["completed", "cancelled", "refunded"];

export type RuntimeEnv = {
  DB?: {
    prepare(query: string): {
      bind(...values: unknown[]): {
        first<T = Record<string, unknown>>(): Promise<T | null>;
        all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
        run(): Promise<unknown>;
      };
      first<T = Record<string, unknown>>(): Promise<T | null>;
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
      run(): Promise<unknown>;
    };
  };
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
  paymentMethod?: "card" | "cash";
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
  paymentMethod: "card" | "cash";
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string;
  createdAt: string;
  paidAt: string;
  updatedAt: string;
  items: OrderItemRecord[];
  timeline: OrderLifecycleEvent[];
};

export type OrderAlertRecord = Pick<
  OrderRecord,
  "id" | "orderNo" | "paymentStatus" | "paymentMethod" | "orderStatus" | "createdAt"
>;

export type ProductRecord = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  isAvailable: boolean;
  inventoryCount: number | null;
  sortOrder: number;
  metadataJson: string;
  createdAt: string;
  updatedAt: string;
};

export type CategoryRecord = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
};

export type OrderLogRecord = {
  id: string;
  orderId: string;
  type: string;
  message: string;
  metaJson: string;
  createdAt: string;
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

type OrderRow = {
  id: string;
  order_no: string;
  lang: string;
  currency: "usd";
  fulfillment: FulfillmentMethod;
  customer_name: string;
  phone: string;
  address: string;
  remark: string;
  items_amount: number;
  delivery_fee: number;
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  payment_method: "card" | "cash";
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string;
  created_at: string;
  paid_at: string;
  updated_at: string;
  timeline_json: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  image_url: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  add_ons_json: string;
  note: string;
};

type PaymentRow = {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  provider_session_id: string;
  provider_payment_intent_id: string;
  amount: number;
  currency: "usd";
  status: PaymentStatus;
  raw_payload: string;
  created_at: string;
  updated_at: string;
};

type WebhookEventRow = {
  id: string;
  provider: PaymentProvider;
  event_id: string;
  event_type: string;
  processed: number;
  raw_payload: string;
  error_message: string;
  created_at: string;
  updated_at: string;
};

type ProductRow = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  is_available: number;
  inventory_count: number | null;
  sort_order: number;
  metadata_json: string;
  created_at: string;
  updated_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

type OrderLogRow = {
  id: string;
  order_id: string;
  type: string;
  message: string;
  meta_json: string;
  created_at: string;
};

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid_waiting_accept", "cancelled"],
  paid_waiting_accept: ["accepted", "cancelled", "refunded"],
  accepted: ["cooking", "cancelled"],
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

function getDbBinding(runtimeEnv?: RuntimeEnv) {
  return runtimeEnv?.DB;
}

export function getRuntimeEnv(locals?: unknown) {
  return (locals as { runtime?: { env?: RuntimeEnv } })?.runtime?.env;
}

export function hasPersistentOrderStore(runtimeEnv?: RuntimeEnv) {
  return Boolean(getDbBinding(runtimeEnv) || getOrdersBinding(runtimeEnv));
}

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const CATALOG_CACHE_TTL_MS = 60_000;
const SETTINGS_CACHE_TTL_MS = 30_000;
const ORDER_ALERTS_CACHE_TTL_MS = 5_000;

let productsCache: CacheEntry<ProductRecord[]> | null = null;
let categoriesCache: CacheEntry<CategoryRecord[]> | null = null;
const settingsCache = new Map<string, CacheEntry<string | null>>();
let orderAlertsCache: CacheEntry<OrderAlertRecord[]> | null = null;

function getCachedValue<T>(entry: CacheEntry<T> | null) {
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) return null;
  return entry.value;
}

function setCachedValue<T>(value: T, ttlMs: number): CacheEntry<T> {
  return {
    value,
    expiresAt: Date.now() + ttlMs,
  };
}

function invalidateCatalogCache() {
  productsCache = null;
  categoriesCache = null;
  settingsCache.clear();
}

function invalidateOrderReadCache() {
  orderAlertsCache = null;
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function rowToOrderItem(row: OrderItemRow): OrderItemRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    imageUrl: row.image_url,
    unitPrice: Number(row.unit_price),
    quantity: Number(row.quantity),
    subtotal: Number(row.subtotal),
    addOns: parseJson<CatalogAddOn[]>(row.add_ons_json, []),
    note: row.note,
  };
}

function rowToPayment(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    provider: row.provider,
    providerSessionId: row.provider_session_id,
    providerPaymentIntentId: row.provider_payment_intent_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    rawPayload: row.raw_payload,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToWebhookEvent(row: WebhookEventRow): WebhookEventRecord {
  return {
    id: row.id,
    provider: row.provider,
    eventId: row.event_id,
    eventType: row.event_type,
    processed: Boolean(row.processed),
    rawPayload: row.raw_payload,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getOrderItemsFromD1(orderId: string, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return [];

  const result = await db
    .prepare(
      `SELECT id, order_id, product_id, product_name, image_url, unit_price, quantity, subtotal, add_ons_json, note
       FROM order_items
       WHERE order_id = ?
       ORDER BY rowid ASC`,
    )
    .bind(orderId)
    .all<OrderItemRow>();

  return result.results.map(rowToOrderItem);
}

async function getOrderItemsByOrderIdsFromD1(orderIds: string[], runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db || orderIds.length === 0) return new Map<string, OrderItemRecord[]>();

  const placeholders = orderIds.map(() => "?").join(", ");
  const result = await db
    .prepare(
      `SELECT id, order_id, product_id, product_name, image_url, unit_price, quantity, subtotal, add_ons_json, note
       FROM order_items
       WHERE order_id IN (${placeholders})
       ORDER BY rowid ASC`,
    )
    .bind(...orderIds)
    .all<OrderItemRow>();

  const grouped = new Map<string, OrderItemRecord[]>();
  for (const row of result.results) {
    const items = grouped.get(row.order_id) ?? [];
    items.push(rowToOrderItem(row));
    grouped.set(row.order_id, items);
  }

  return grouped;
}

async function rowToOrder(row: OrderRow, runtimeEnv?: RuntimeEnv): Promise<OrderRecord> {
  return {
    id: row.id,
    orderNo: row.order_no,
    lang: row.lang,
    currency: row.currency,
    fulfillment: row.fulfillment,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    remark: row.remark,
    itemsAmount: Number(row.items_amount),
    deliveryFee: Number(row.delivery_fee),
    totalAmount: Number(row.total_amount),
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    paymentMethod: row.payment_method || "card",
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    updatedAt: row.updated_at,
    items: await getOrderItemsFromD1(row.id, runtimeEnv),
    timeline: parseJson<OrderLifecycleEvent[]>(row.timeline_json, []),
  };
}

async function getOrderByIdFromD1(orderId: string, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return null;

  const row = await db
    .prepare(
      `SELECT id, order_no, lang, currency, fulfillment, customer_name, phone, address, remark,
              items_amount, delivery_fee, total_amount, payment_status, order_status, payment_method,
              stripe_checkout_session_id, stripe_payment_intent_id, created_at, paid_at, updated_at, timeline_json
       FROM orders
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(orderId)
    .first<OrderRow>();

  return row ? await rowToOrder(row, runtimeEnv) : null;
}

async function getOrderByOrderNoFromD1(orderNo: string, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return null;

  const row = await db
    .prepare(
      `SELECT id, order_no, lang, currency, fulfillment, customer_name, phone, address, remark,
              items_amount, delivery_fee, total_amount, payment_status, order_status, payment_method,
              stripe_checkout_session_id, stripe_payment_intent_id, created_at, paid_at, updated_at, timeline_json
       FROM orders
       WHERE order_no = ?
       LIMIT 1`,
    )
    .bind(orderNo)
    .first<OrderRow>();

  return row ? await rowToOrder(row, runtimeEnv) : null;
}

async function listOrdersFromD1(runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return [];

  const result = await db
    .prepare(
      `SELECT id, order_no, lang, currency, fulfillment, customer_name, phone, address, remark,
              items_amount, delivery_fee, total_amount, payment_status, order_status, payment_method,
              stripe_checkout_session_id, stripe_payment_intent_id, created_at, paid_at, updated_at, timeline_json
       FROM orders
       ORDER BY created_at DESC`,
    )
    .all<OrderRow>();

  const itemsByOrderId = await getOrderItemsByOrderIdsFromD1(
    result.results.map((row) => row.id),
    runtimeEnv,
  );

  return result.results.map((row) => ({
    id: row.id,
    orderNo: row.order_no,
    lang: row.lang,
    currency: row.currency,
    fulfillment: row.fulfillment,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    remark: row.remark,
    itemsAmount: Number(row.items_amount),
    deliveryFee: Number(row.delivery_fee),
    totalAmount: Number(row.total_amount),
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    paymentMethod: row.payment_method || "card",
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    updatedAt: row.updated_at,
    items: itemsByOrderId.get(row.id) ?? [],
    timeline: parseJson<OrderLifecycleEvent[]>(row.timeline_json, []),
  }));
}

type ListOrderOptions = {
  statuses?: OrderStatus[];
};

async function listOrdersFromD1ByStatus(statuses: OrderStatus[], runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db || statuses.length === 0) return [];

  const placeholders = statuses.map(() => "?").join(", ");
  const result = await db
    .prepare(
      `SELECT id, order_no, lang, currency, fulfillment, customer_name, phone, address, remark,
              items_amount, delivery_fee, total_amount, payment_status, order_status, payment_method,
              stripe_checkout_session_id, stripe_payment_intent_id, created_at, paid_at, updated_at, timeline_json
       FROM orders
       WHERE order_status IN (${placeholders})
       ORDER BY created_at DESC`,
    )
    .bind(...statuses)
    .all<OrderRow>();

  const itemsByOrderId = await getOrderItemsByOrderIdsFromD1(
    result.results.map((row) => row.id),
    runtimeEnv,
  );

  return result.results.map((row) => ({
    id: row.id,
    orderNo: row.order_no,
    lang: row.lang,
    currency: row.currency,
    fulfillment: row.fulfillment,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    remark: row.remark,
    itemsAmount: Number(row.items_amount),
    deliveryFee: Number(row.delivery_fee),
    totalAmount: Number(row.total_amount),
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    paymentMethod: row.payment_method || "card",
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    updatedAt: row.updated_at,
    items: itemsByOrderId.get(row.id) ?? [],
    timeline: parseJson<OrderLifecycleEvent[]>(row.timeline_json, []),
  }));
}

async function listOrderAlertsFromD1(runtimeEnv?: RuntimeEnv, options: ListOrderOptions = {}) {
  const cached = getCachedValue(orderAlertsCache);
  if (!options.statuses?.length && cached) return cached;

  const db = getDbBinding(runtimeEnv);
  if (!db) return [];

  const statuses = options.statuses ?? [];
  const whereClause = statuses.length ? `WHERE order_status IN (${statuses.map(() => "?").join(", ")})` : "";
  const result = await db
    .prepare(
      `SELECT id, order_no, payment_status, payment_method, order_status, created_at
       FROM orders
       ${whereClause}
       ORDER BY created_at DESC`,
    )
    .bind(...statuses)
    .all<Pick<OrderRow, "id" | "order_no" | "payment_status" | "payment_method" | "order_status" | "created_at">>();

  const alerts = result.results.map((row) => ({
    id: row.id,
    orderNo: row.order_no,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method || "card",
    orderStatus: row.order_status,
    createdAt: row.created_at,
  }));

  if (!statuses.length) {
    orderAlertsCache = setCachedValue(alerts, ORDER_ALERTS_CACHE_TTL_MS);
  }
  return alerts;
}

async function saveOrderToD1(order: OrderRecord, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return;

  await db
    .prepare(
      `INSERT INTO orders (
          id, order_no, lang, currency, fulfillment, customer_name, phone, address, remark,
          items_amount, delivery_fee, total_amount, payment_status, order_status, payment_method,
          stripe_checkout_session_id, stripe_payment_intent_id, created_at, paid_at, updated_at, timeline_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          order_no = excluded.order_no,
          lang = excluded.lang,
          currency = excluded.currency,
          fulfillment = excluded.fulfillment,
          customer_name = excluded.customer_name,
          phone = excluded.phone,
          address = excluded.address,
          remark = excluded.remark,
          items_amount = excluded.items_amount,
          delivery_fee = excluded.delivery_fee,
          total_amount = excluded.total_amount,
          payment_status = excluded.payment_status,
          order_status = excluded.order_status,
          payment_method = excluded.payment_method,
          stripe_checkout_session_id = excluded.stripe_checkout_session_id,
          stripe_payment_intent_id = excluded.stripe_payment_intent_id,
          created_at = excluded.created_at,
          paid_at = excluded.paid_at,
          updated_at = excluded.updated_at,
          timeline_json = excluded.timeline_json`,
    )
    .bind(
      order.id,
      order.orderNo,
      order.lang,
      order.currency,
      order.fulfillment,
      order.customerName,
      order.phone,
      order.address,
      order.remark,
      order.itemsAmount,
      order.deliveryFee,
      order.totalAmount,
      order.paymentStatus,
      order.orderStatus,
      order.paymentMethod,
      order.stripeCheckoutSessionId,
      order.stripePaymentIntentId,
      order.createdAt,
      order.paidAt,
      order.updatedAt,
      JSON.stringify(order.timeline),
    )
    .run();

  invalidateOrderReadCache();

  await db.prepare(`DELETE FROM order_items WHERE order_id = ?`).bind(order.id).run();

  for (const item of order.items) {
    await db
      .prepare(
        `INSERT INTO order_items (
            id, order_id, product_id, product_name, image_url, unit_price, quantity, subtotal, add_ons_json, note
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            order_id = excluded.order_id,
            product_id = excluded.product_id,
            product_name = excluded.product_name,
            image_url = excluded.image_url,
            unit_price = excluded.unit_price,
            quantity = excluded.quantity,
            subtotal = excluded.subtotal,
            add_ons_json = excluded.add_ons_json,
            note = excluded.note`,
      )
      .bind(
        item.id,
        item.orderId,
        item.productId,
        item.productName,
        item.imageUrl,
        item.unitPrice,
        item.quantity,
        item.subtotal,
        JSON.stringify(item.addOns),
        item.note,
      )
      .run();
  }
}

async function getPaymentByOrderIdFromD1(orderId: string, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return null;

  const row = await db
    .prepare(
      `SELECT id, order_id, provider, provider_session_id, provider_payment_intent_id, amount, currency, status, raw_payload, created_at, updated_at
       FROM payments
       WHERE order_id = ?
       LIMIT 1`,
    )
    .bind(orderId)
    .first<PaymentRow>();

  return row ? rowToPayment(row) : null;
}

async function getPaymentBySessionIdFromD1(sessionId: string, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return null;

  const row = await db
    .prepare(
      `SELECT id, order_id, provider, provider_session_id, provider_payment_intent_id, amount, currency, status, raw_payload, created_at, updated_at
       FROM payments
       WHERE provider_session_id = ?
       LIMIT 1`,
    )
    .bind(sessionId)
    .first<PaymentRow>();

  return row ? rowToPayment(row) : null;
}

async function getPaymentByIntentIdFromD1(paymentIntentId: string, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return null;

  const row = await db
    .prepare(
      `SELECT id, order_id, provider, provider_session_id, provider_payment_intent_id, amount, currency, status, raw_payload, created_at, updated_at
       FROM payments
       WHERE provider_payment_intent_id = ?
       LIMIT 1`,
    )
    .bind(paymentIntentId)
    .first<PaymentRow>();

  return row ? rowToPayment(row) : null;
}

async function savePaymentToD1(payment: PaymentRecord, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return;

  await db
    .prepare(
      `INSERT INTO payments (
          id, order_id, provider, provider_session_id, provider_payment_intent_id, amount, currency, status, raw_payload, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          order_id = excluded.order_id,
          provider = excluded.provider,
          provider_session_id = excluded.provider_session_id,
          provider_payment_intent_id = excluded.provider_payment_intent_id,
          amount = excluded.amount,
          currency = excluded.currency,
          status = excluded.status,
          raw_payload = excluded.raw_payload,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at`,
    )
    .bind(
      payment.id,
      payment.orderId,
      payment.provider,
      payment.providerSessionId,
      payment.providerPaymentIntentId,
      payment.amount,
      payment.currency,
      payment.status,
      payment.rawPayload,
      payment.createdAt,
      payment.updatedAt,
    )
    .run();
}

async function getWebhookEventFromD1(provider: PaymentProvider, eventId: string, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return null;

  const row = await db
    .prepare(
      `SELECT id, provider, event_id, event_type, processed, raw_payload, error_message, created_at, updated_at
       FROM webhook_events
       WHERE provider = ? AND event_id = ?
       LIMIT 1`,
    )
    .bind(provider, eventId)
    .first<WebhookEventRow>();

  return row ? rowToWebhookEvent(row) : null;
}

async function saveWebhookEventToD1(event: WebhookEventRecord, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return;

  await db
    .prepare(
      `INSERT INTO webhook_events (
          id, provider, event_id, event_type, processed, raw_payload, error_message, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(event_id) DO UPDATE SET
          provider = excluded.provider,
          event_type = excluded.event_type,
          processed = excluded.processed,
          raw_payload = excluded.raw_payload,
          error_message = excluded.error_message,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at`,
    )
    .bind(
      event.id,
      event.provider,
      event.eventId,
      event.eventType,
      event.processed ? 1 : 0,
      event.rawPayload,
      event.errorMessage,
      event.createdAt,
      event.updatedAt,
    )
    .run();
}

async function saveOrderLogToD1(log: OrderLogRecord, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return;

  await db
    .prepare(
      `INSERT INTO order_logs (id, order_id, type, message, meta_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(log.id, log.orderId, log.type, log.message, log.metaJson, log.createdAt)
    .run();
}

export async function getProductsFromD1(runtimeEnv?: RuntimeEnv) {
  const cached = getCachedValue(productsCache);
  if (cached) return cached;

  const db = getDbBinding(runtimeEnv);
  if (!db) return [];

  const { results } = await db.prepare(`SELECT * FROM products ORDER BY sort_order ASC`).all<ProductRow>();
  const products = results.map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    price: row.price,
    isAvailable: row.is_available === 1,
    inventoryCount: row.inventory_count,
    sortOrder: row.sort_order,
    metadataJson: row.metadata_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  productsCache = setCachedValue(products, CATALOG_CACHE_TTL_MS);
  return products;
}

export async function getProductFromD1(productId: string, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return null;

  const row = await db.prepare(`SELECT * FROM products WHERE id = ?`).bind(productId).first<ProductRow>();
  if (!row) return null;

  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    price: row.price,
    isAvailable: row.is_available === 1,
    inventoryCount: row.inventory_count,
    sortOrder: row.sort_order,
    metadataJson: row.metadata_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCategoriesFromD1(runtimeEnv?: RuntimeEnv) {
  const cached = getCachedValue(categoriesCache);
  if (cached) return cached;

  const db = getDbBinding(runtimeEnv);
  if (!db) return [];

  const { results } = await db.prepare(`SELECT * FROM categories ORDER BY sort_order ASC`).all<CategoryRow>();
  const categories = results.map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }));

  categoriesCache = setCachedValue(categories, CATALOG_CACHE_TTL_MS);
  return categories;
}

export async function getOrderLogsFromD1(orderId: string, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return [];

  const { results } = await db
    .prepare(`SELECT * FROM order_logs WHERE order_id = ? ORDER BY created_at ASC`)
    .bind(orderId)
    .all<OrderLogRow>();

  return results.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    type: row.type,
    message: row.message,
    metaJson: row.meta_json,
    createdAt: row.created_at,
  }));
}

export async function updateSettingInD1(key: string, value: string, runtimeEnv?: RuntimeEnv) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return;

  await db
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind(key, value, nowIso())
    .run();

  invalidateCatalogCache();
}

export async function updateProductInD1(
  productId: string,
  input: {
    price?: number;
    isAvailable?: boolean;
    inventoryCount?: number | null;
  },
  runtimeEnv?: RuntimeEnv,
) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return;

  const updates: string[] = [];
  const params: any[] = [];

  if (input.price !== undefined) {
    updates.push("price = ?");
    params.push(input.price);
  }
  if (input.isAvailable !== undefined) {
    updates.push("is_available = ?");
    params.push(input.isAvailable ? 1 : 0);
  }
  if (input.inventoryCount !== undefined) {
    updates.push("inventory_count = ?");
    params.push(input.inventoryCount);
  }

  if (updates.length === 0) return;

  updates.push("updated_at = ?");
  params.push(nowIso());
  params.push(productId);

  await db
    .prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();

  invalidateCatalogCache();
}

export async function createProductInD1(
  input: {
    categoryId: string;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    inventoryCount?: number | null;
  },
  runtimeEnv?: RuntimeEnv,
) {
  const db = getDbBinding(runtimeEnv);
  if (!db) return;

  const id = randomId("prod");
  const timestamp = nowIso();
  
  // Get max sort_order to append at the end
  const maxRow = await db.prepare(`SELECT MAX(sort_order) as max_sort FROM products`).first<{ max_sort: number }>();
  const sortOrder = (maxRow?.max_sort ?? 0) + 1;

  await db
    .prepare(
      `INSERT INTO products (id, category_id, name, description, image_url, price, is_available, inventory_count, sort_order, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.categoryId,
      input.name,
      input.description,
      input.imageUrl,
      input.price,
      input.inventoryCount ?? null,
      sortOrder,
      JSON.stringify({ addOns: [], tags: [] }),
      timestamp,
      timestamp,
    )
    .run();

  invalidateCatalogCache();
  return id;
}

export async function getSettingFromD1(key: string, runtimeEnv?: RuntimeEnv) {
  const cached = settingsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const db = getDbBinding(runtimeEnv);
  if (!db) return null;

  const row = await db.prepare(`SELECT value FROM settings WHERE key = ?`).bind(key).first<{ value: string }>();
  const value = row ? row.value : null;
  settingsCache.set(key, setCachedValue(value, SETTINGS_CACHE_TTL_MS));
  return value;
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

async function recalculateOrderItems(
  orderId: string,
  items: OrderItemInput[],
  lang?: string,
  runtimeEnv?: RuntimeEnv,
) {
  const normalizedItems = normalizeItems(items);
  const locale = getProductLocale(lang);

  const orderItems: OrderItemRecord[] = [];

  for (const item of normalizedItems) {
    const product = await getProductFromD1(item.productId, runtimeEnv);
    if (!product || !product.isAvailable) {
      throw new Error(`Product unavailable: ${item.productId}`);
    }

    const metadata = JSON.parse(product.metadataJson);
    const catalogAddOns = (metadata.addOns || []) as CatalogAddOn[];

    const addOns = item.addOnIds.map((addOnId) => {
      const matched = catalogAddOns.find((candidate) => candidate.id === addOnId);
      if (!matched) {
        throw new Error(`Invalid add-on ${addOnId} for ${product.name}`);
      }
      return {
        id: matched.id,
        label: (matched.label as any)[locale] || (matched.label as any).en || matched.label,
        price: matched.price,
      };
    });

    const unitPrice = roundMoney(product.price + addOns.reduce((sum, addOn) => sum + addOn.price, 0));
    const subtotal = roundMoney(unitPrice * item.quantity);

    orderItems.push({
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
    });
  }

  return orderItems;
}

async function saveOrder(order: OrderRecord, runtimeEnv?: RuntimeEnv) {
  if (getDbBinding(runtimeEnv)) {
    await saveOrderToD1(order, runtimeEnv);

    // Save logs to D1 as well
    const lastEvent = order.timeline[order.timeline.length - 1];
    if (lastEvent) {
      await saveOrderLogToD1(
        {
          id: randomId("log"),
          orderId: order.id,
          type: lastEvent.type,
          message: lastEvent.message,
          metaJson: JSON.stringify(lastEvent.meta || {}),
          createdAt: lastEvent.createdAt,
        },
        runtimeEnv,
      );
    }
    return; // Exit if D1 is successful
  }

  // Fallback to KV if D1 is not available
  await writeJson(orderKey(order.id), order, runtimeEnv);
  await writeText(orderNoKey(order.orderNo), order.id, runtimeEnv);
}

async function savePayment(payment: PaymentRecord, runtimeEnv?: RuntimeEnv) {
  if (getDbBinding(runtimeEnv)) {
    await savePaymentToD1(payment, runtimeEnv);
    return; // Exit if D1 is successful
  }

  // Fallback to KV if D1 is not available
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
  if (getDbBinding(runtimeEnv)) {
    await saveWebhookEventToD1(event, runtimeEnv);
    return; // Exit if D1 is successful
  }

  await writeJson(webhookKey(event.provider, event.eventId), event, runtimeEnv);
}

export async function getOrderById(orderId: string, runtimeEnv?: RuntimeEnv) {
  const fromD1 = await getOrderByIdFromD1(orderId, runtimeEnv);
  if (fromD1) return fromD1;
  if (getDbBinding(runtimeEnv)) return null;
  return await readJson<OrderRecord>(orderKey(orderId), runtimeEnv);
}

export async function getOrderByOrderNo(orderNo: string, runtimeEnv?: RuntimeEnv) {
  const fromD1 = await getOrderByOrderNoFromD1(orderNo, runtimeEnv);
  if (fromD1) return fromD1;
  if (getDbBinding(runtimeEnv)) return null;

  const orderId = await readText(orderNoKey(orderNo), runtimeEnv);
  if (!orderId) return null;
  return await getOrderById(orderId, runtimeEnv);
}

export async function getOrder(orderLookup: string, runtimeEnv?: RuntimeEnv) {
  return (await getOrderById(orderLookup, runtimeEnv)) ?? (await getOrderByOrderNo(orderLookup, runtimeEnv));
}

export async function listOrders(runtimeEnv?: RuntimeEnv, options: ListOrderOptions = {}) {
  const statuses = options.statuses ?? [];
  const d1Orders = statuses.length ? await listOrdersFromD1ByStatus(statuses, runtimeEnv) : await listOrdersFromD1(runtimeEnv);
  
  // CRITICAL: If we have D1 orders, we ONLY return them. 
  // We stop traversing KV entirely to stay within daily read limits (100k per day).
  if (d1Orders.length > 0 || getDbBinding(runtimeEnv)) {
    return d1Orders;
  }

  // Fallback to KV only if D1 is not present (legacy mode)
  const keys = await listOrderKeys(runtimeEnv);
  const kvOrders = await Promise.all(keys.map(async (key) => await readJson<OrderRecord>(key, runtimeEnv)));

  const filteredOrders = kvOrders
    .filter((o): o is OrderRecord => !!o)
    .filter((order) => !statuses.length || statuses.includes(order.orderStatus));

  return filteredOrders.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function listOrderAlerts(runtimeEnv?: RuntimeEnv, options: ListOrderOptions = {}) {
  const d1Orders = await listOrderAlertsFromD1(runtimeEnv, options);
  if (d1Orders.length > 0 || getDbBinding(runtimeEnv)) {
    return d1Orders;
  }

  const orders = await listOrders(runtimeEnv, options);
  return orders.map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
  }));
}

export async function getPaymentByOrderId(orderId: string, runtimeEnv?: RuntimeEnv) {
  const fromD1 = await getPaymentByOrderIdFromD1(orderId, runtimeEnv);
  if (fromD1) return fromD1;
  if (getDbBinding(runtimeEnv)) return null;

  const paymentId = await readText(paymentOrderKey(orderId), runtimeEnv);
  return paymentId ? await readJson<PaymentRecord>(paymentKey(paymentId), runtimeEnv) : null;
}

async function getPaymentBySessionId(sessionId: string, runtimeEnv?: RuntimeEnv) {
  const fromD1 = await getPaymentBySessionIdFromD1(sessionId, runtimeEnv);
  if (fromD1) return fromD1;
  if (getDbBinding(runtimeEnv)) return null;

  const paymentId = await readText(paymentSessionKey(sessionId), runtimeEnv);
  return paymentId ? await readJson<PaymentRecord>(paymentKey(paymentId), runtimeEnv) : null;
}

async function getPaymentByIntentId(paymentIntentId: string, runtimeEnv?: RuntimeEnv) {
  const fromD1 = await getPaymentByIntentIdFromD1(paymentIntentId, runtimeEnv);
  if (fromD1) return fromD1;
  if (getDbBinding(runtimeEnv)) return null;

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
  const orderId = randomId("order");
  const createdAt = nowIso();
  const items = await recalculateOrderItems(orderId, input.items, input.lang, input.runtimeEnv);
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
    orderStatus: input.paymentMethod === "cash" ? "paid_waiting_accept" : "pending_payment",
    paymentMethod: input.paymentMethod || "card",
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
  const shippingDetails = (session as Stripe.Checkout.Session & {
    shipping_details?: { address?: Stripe.Address | null } | null;
  }).shipping_details;
  const shipping = shippingDetails?.address ?? session.customer_details?.address;
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
  const existingFromD1 = await getWebhookEventFromD1(input.provider, input.eventId, input.runtimeEnv);
  const existing =
    existingFromD1 ??
    (getDbBinding(input.runtimeEnv)
      ? null
      : await readJson<WebhookEventRecord>(webhookKey(input.provider, input.eventId), input.runtimeEnv));
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
  const existingFromD1 = await getWebhookEventFromD1(input.provider, input.eventId, input.runtimeEnv);
  const existing =
    existingFromD1 ??
    (getDbBinding(input.runtimeEnv)
      ? null
      : await readJson<WebhookEventRecord>(webhookKey(input.provider, input.eventId), input.runtimeEnv));
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
  const nextStatus = order.orderStatus === "pending_payment" ? "accepted" : order.orderStatus;
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
    createLifecycleEvent(
      "payment.completed",
      order.orderStatus === "pending_payment"
        ? "Stripe payment confirmed and order auto-accepted."
        : "Stripe payment confirmed by webhook.",
      {
        sessionId: session.id,
        paymentIntentId: cleanPaymentIntentId(session.payment_intent),
      },
    ),
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
