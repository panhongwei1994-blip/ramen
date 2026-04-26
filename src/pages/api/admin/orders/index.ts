import type { APIRoute } from "astro";
import { json } from "@/lib/http";
import { getRuntimeEnv, listOrderAlerts, listOrders } from "@/lib/orders";

export const prerender = false;

export const GET: APIRoute = async ({ locals, request }) => {
  const runtimeEnv = getRuntimeEnv(locals);
  const url = new URL(request.url);

  if (url.searchParams.get("summary") === "alerts") {
    const orders = await listOrderAlerts(runtimeEnv);
    return json({ orders });
  }

  const orders = await listOrders(runtimeEnv);
  return json({ orders });
};
