import type { APIRoute } from "astro";
import { json } from "@/lib/http";
import { getCategoriesFromD1, getProductsFromD1, getRuntimeEnv, getSettingFromD1 } from "@/lib/orders";

export const prerender = false;

const STOREFRONT_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=180, stale-while-revalidate=600",
};

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = getRuntimeEnv(locals);
  const [categories, products, isOpenValue] = await Promise.all([
    getCategoriesFromD1(runtimeEnv),
    getProductsFromD1(runtimeEnv),
    getSettingFromD1("is_open", runtimeEnv),
  ]);

  return json(
    {
      categories,
      products,
      isOpen: isOpenValue !== "0",
    },
    200,
    STOREFRONT_HEADERS,
  );
};
