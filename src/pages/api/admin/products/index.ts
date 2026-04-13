import type { APIRoute } from "astro";
import { json, jsonError } from "@/lib/http";
import { getRuntimeEnv, createProductInD1 } from "@/lib/orders";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();
  const { categoryId, name, description, imageUrl, price, inventoryCount } = body;

  if (!categoryId || !name || !price || !imageUrl) {
    return jsonError("Missing required fields (category, name, price, image).", 400);
  }

  const runtimeEnv = getRuntimeEnv(locals);
  const id = await createProductInD1({
    categoryId,
    name,
    description: description || "",
    imageUrl,
    price: parseFloat(price),
    inventoryCount: inventoryCount === "" ? null : parseInt(inventoryCount),
  }, runtimeEnv);

  return json({ success: true, id });
};
