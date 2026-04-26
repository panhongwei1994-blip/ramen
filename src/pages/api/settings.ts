import type { APIRoute } from "astro";
import { json } from "@/lib/http";
import { getSettingFromD1, getRuntimeEnv } from "@/lib/orders";

export const prerender = false;

const STOREFRONT_HEADERS = {
  "Cache-Control": "public, max-age=15, s-maxage=30, stale-while-revalidate=120",
};

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = getRuntimeEnv(locals);
  const isOpen = await getSettingFromD1("is_open", runtimeEnv);

  return json({ 
    isOpen: isOpen !== "0" 
  }, 200, STOREFRONT_HEADERS);
};
