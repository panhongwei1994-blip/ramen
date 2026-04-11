import type { APIRoute } from "astro";
import { json, jsonError } from "@/lib/http";
import { getRuntimeEnv, transitionOrderStatus, type OrderStatus } from "@/lib/orders";

export const prerender = false;

const ALLOWED_STATUSES: OrderStatus[] = [
  "paid_waiting_accept",
  "accepted",
  "cooking",
  "delivering",
  "completed",
  "cancelled",
  "refunded",
];

export const POST: APIRoute = async ({ params, request, locals }) => {
  const lookup = params.id;
  if (!lookup) {
    return jsonError("Order id is required.", 400);
  }

  try {
    const payload = (await request.json()) as { status?: OrderStatus; message?: string };
    if (!payload.status || !ALLOWED_STATUSES.includes(payload.status)) {
      return jsonError("A valid target status is required.", 400);
    }

    const runtimeEnv = getRuntimeEnv(locals);
    const order = await transitionOrderStatus({
      orderLookup: lookup,
      nextStatus: payload.status,
      message: payload.message,
      runtimeEnv,
    });

    return json({ order });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to update order status.", 400);
  }
};
