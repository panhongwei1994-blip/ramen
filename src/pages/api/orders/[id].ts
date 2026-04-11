import type { APIRoute } from "astro";
import { json, jsonError } from "@/lib/http";
import { getOrder, getPaymentByOrderId, getRuntimeEnv } from "@/lib/orders";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const orderLookup = params.id;
  if (!orderLookup) {
    return jsonError("Order id is required.", 400);
  }

  const runtimeEnv = getRuntimeEnv(locals);
  const order = await getOrder(orderLookup, runtimeEnv);
  if (!order) {
    return jsonError("Order not found.", 404);
  }

  const payment = await getPaymentByOrderId(order.id, runtimeEnv);
  return json({
    order,
    orderId: order.id,
    orderNo: order.orderNo,
    orderCode: order.orderNo,
    payment,
  });
};
