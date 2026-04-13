import type { APIRoute } from "astro";
import { json } from "@/lib/http";
import { getCategoriesFromD1, getRuntimeEnv } from "@/lib/orders";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = getRuntimeEnv(locals);
  const categories = await getCategoriesFromD1(runtimeEnv);
  return json({ categories });
};
