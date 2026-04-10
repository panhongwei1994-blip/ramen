import type { APIRoute } from "astro";
import { getOrder, getRuntimeEnv } from "@/lib/orders";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const orderCode = url.searchParams.get("order");
  if (!orderCode) {
    return new Response(JSON.stringify({ error: "Missing order code" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const order = await getOrder(orderCode, getRuntimeEnv(locals));
  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(order), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
