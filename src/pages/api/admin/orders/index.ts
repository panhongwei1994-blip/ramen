import type { APIRoute } from "astro";
import { json } from "@/lib/http";
import { getRuntimeEnv, listOrders } from "@/lib/orders";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = getRuntimeEnv(locals);
  const orders = await listOrders(runtimeEnv);
  return json({ orders });
};
