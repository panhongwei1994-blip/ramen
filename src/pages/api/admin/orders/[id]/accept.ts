import type { APIRoute } from "astro";
import { json, jsonError } from "@/lib/http";
import { getRuntimeEnv, transitionOrderStatus } from "@/lib/orders";

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  const lookup = params.id;
  if (!lookup) {
    return jsonError("Order id is required.", 400);
  }

  try {
    const runtimeEnv = getRuntimeEnv(locals);
    const order = await transitionOrderStatus({
      orderLookup: lookup,
      nextStatus: "accepted",
      message: "Merchant accepted the order.",
      runtimeEnv,
    });

    return json({ order });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to accept order.", 400);
  }
};
