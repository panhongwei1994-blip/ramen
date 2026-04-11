import type { APIRoute } from "astro";
import { json, jsonError } from "@/lib/http";
import { normalizeCreateOrderPayload } from "@/lib/order-input";
import { createOrder, getRuntimeEnv } from "@/lib/orders";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const payload = await request.json();
    const runtimeEnv = getRuntimeEnv(locals);
    const order = await createOrder({
      ...normalizeCreateOrderPayload(payload as Record<string, unknown>),
      runtimeEnv,
    });

    return json({
      order,
      orderId: order.id,
      orderNo: order.orderNo,
      orderCode: order.orderNo,
    }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to create order.", 400);
  }
};
