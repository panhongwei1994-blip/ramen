import type { APIRoute } from "astro";
import { createOrder, getRuntimeEnv } from "@/lib/orders";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const payload = await request.json();

  if (!payload?.cart?.length) {
    return new Response(JSON.stringify({ error: "Cart is empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const order = await createOrder({
    lang: payload.lang,
    cart: payload.cart,
    checkout: payload.checkout,
    deliveryFee: payload.deliveryFee ?? 0,
    paymentMethod: "cash",
    runtimeEnv: getRuntimeEnv(locals),
  });

  return new Response(JSON.stringify({ orderCode: order.orderCode, order }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
