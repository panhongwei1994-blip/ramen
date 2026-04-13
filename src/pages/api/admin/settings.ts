import type { APIRoute } from "astro";
import { json, jsonError } from "@/lib/http";
import { getRuntimeEnv, updateSettingInD1 } from "@/lib/orders";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return jsonError("Key and value are required.", 400);
  }

  const runtimeEnv = getRuntimeEnv(locals);
  await updateSettingInD1(key, String(value), runtimeEnv);

  return json({ success: true });
};
