import type { APIRoute } from "astro";
import { json } from "@/lib/http";
import { ACTIVE_ORDER_STATUSES, getRuntimeEnv, listOrderAlerts, listOrders } from "@/lib/orders";

export const prerender = false;

export const GET: APIRoute = async ({ locals, request }) => {
  const runtimeEnv = getRuntimeEnv(locals);
  const url = new URL(request.url);

  if (url.searchParams.get("summary") === "alerts") {
    const orders = await listOrderAlerts(runtimeEnv, { statuses: ACTIVE_ORDER_STATUSES });
    return json({ orders });
  }

  const scope = url.searchParams.get("scope");
  const orders = scope === "active" ? await listOrders(runtimeEnv, { statuses: ACTIVE_ORDER_STATUSES }) : await listOrders(runtimeEnv);
  return json({ orders });
};
