import type { APIRoute } from "astro";
import { json, jsonError } from "@/lib/http";
import { getOrder, getRuntimeEnv, attachStripeCheckoutSession } from "@/lib/orders";
import { createStripeCheckoutSessionForOrder } from "@/lib/stripe-checkout";

export const prerender = false;

function cleanString(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtimeEnv = getRuntimeEnv(locals);
    const stripeKey = cleanString(runtimeEnv?.STRIPE_SECRET_KEY ?? import.meta.env.STRIPE_SECRET_KEY);
    if (!stripeKey) {
      return jsonError("Stripe key missing. Add STRIPE_SECRET_KEY and redeploy.", 500);
    }

    const payload = (await request.json()) as { orderId?: string; orderNo?: string };
    const lookup = cleanString(payload.orderId) || cleanString(payload.orderNo);
    if (!lookup) {
      return jsonError("Order id is required.", 400);
    }

    const order = await getOrder(lookup, runtimeEnv);
    if (!order) {
      return jsonError("Order not found.", 404);
    }
    if (order.paymentStatus === "paid") {
      return jsonError("Order is already paid.", 409);
    }

    const session = await createStripeCheckoutSessionForOrder({
      order,
      request,
      stripeKey,
      siteUrl: cleanString(runtimeEnv?.PUBLIC_SITE_URL ?? import.meta.env.PUBLIC_SITE_URL),
    });

    await attachStripeCheckoutSession({
      orderId: order.id,
      sessionId: session.id,
      paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : "",
      rawPayload: JSON.stringify(session),
      runtimeEnv,
    });

    return json({
      orderId: order.id,
      orderNo: order.orderNo,
      orderCode: order.orderNo,
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to create Stripe checkout session.", 400);
  }
};
