import type { APIRoute } from "astro";
import { json, jsonError } from "@/lib/http";
import { getOrder, getPaymentByOrderId, getRuntimeEnv } from "@/lib/orders";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const lookup = params.id;
  if (!lookup) {
    return jsonError("Order id is required.", 400);
  }

  const runtimeEnv = getRuntimeEnv(locals);
  const order = await getOrder(lookup, runtimeEnv);
  if (!order) {
    return jsonError("Order not found.", 404);
  }

  const payment = await getPaymentByOrderId(order.id, runtimeEnv);
  return json({
    order,
    payment,
  });
};
