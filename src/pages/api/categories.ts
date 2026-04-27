import type { APIRoute } from "astro";
import { json } from "@/lib/http";
import { getCategoriesFromD1, getRuntimeEnv } from "@/lib/orders";

export const prerender = false;

const STOREFRONT_HEADERS = {
  "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=1800",
};

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = getRuntimeEnv(locals);
  const categories = await getCategoriesFromD1(runtimeEnv);
  return json({ categories }, 200, STOREFRONT_HEADERS);
};
