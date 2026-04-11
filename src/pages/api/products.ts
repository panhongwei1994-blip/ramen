import type { APIRoute } from "astro";
import { listSeedProducts } from "@/lib/catalog";
import { json } from "@/lib/http";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const lang = url.searchParams.get("lang") ?? undefined;
  return json({ products: listSeedProducts(lang) });
};
