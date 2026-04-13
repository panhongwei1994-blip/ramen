import type { APIRoute } from "astro";
import { json, jsonError } from "@/lib/http";
import { getRuntimeEnv, updateProductInD1 } from "@/lib/orders";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  const id = params.id;
  if (!id) {
    return jsonError("Product ID is required.", 400);
  }

  const body = await request.json();
  const { price, isAvailable, inventoryCount } = body;

  const runtimeEnv = getRuntimeEnv(locals);
  await updateProductInD1(id, { price, isAvailable, inventoryCount }, runtimeEnv);

  return json({ success: true });
};
