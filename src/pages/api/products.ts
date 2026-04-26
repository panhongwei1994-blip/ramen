import type { APIRoute } from "astro";
import { json } from "@/lib/http";
import { getProductsFromD1, getRuntimeEnv } from "@/lib/orders";

export const prerender = false;

const STOREFRONT_HEADERS = {
  "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
};

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = getRuntimeEnv(locals);
  const products = await getProductsFromD1(runtimeEnv);
  return json({ products }, 200, STOREFRONT_HEADERS);
};
