import type { APIRoute } from "astro";
import { json } from "@/lib/http";
import { getSettingFromD1, getRuntimeEnv } from "@/lib/orders";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = getRuntimeEnv(locals);
  const isOpen = await getSettingFromD1("is_open", runtimeEnv);

  return json({ 
    isOpen: isOpen !== "0" 
  });
};
