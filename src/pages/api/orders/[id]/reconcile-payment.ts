import type { APIRoute } from "astro";
import Stripe from "stripe";
import { json, jsonError } from "@/lib/http";
import {
  getOrder,
  getRuntimeEnv,
  markOrderPaidFromCheckoutSession,
} from "@/lib/orders";

export const prerender = false;

function cleanString(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

export const POST: APIRoute = async ({ params, locals }) => {
  const orderLookup = params.id;
  if (!orderLookup) {
    return jsonError("Order id is required.", 400);
  }

  const runtimeEnv = getRuntimeEnv(locals);
  const stripeKey = cleanString(runtimeEnv?.STRIPE_SECRET_KEY ?? import.meta.env.STRIPE_SECRET_KEY);
  if (!stripeKey) {
    return jsonError("Stripe key missing.", 500);
  }

  const order = await getOrder(orderLookup, runtimeEnv);
  if (!order) {
    return jsonError("Order not found.", 404);
  }

  if (order.paymentStatus === "paid") {
    return json({ order, reconciled: false, reason: "already_paid" });
  }

  if (!order.stripeCheckoutSessionId) {
    return json({ order, reconciled: false, reason: "missing_checkout_session" });
  }

  const stripe = new Stripe(stripeKey);
  const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);

  if (session.payment_status !== "paid") {
    return json({
      order,
      reconciled: false,
      reason: session.payment_status ?? "unpaid",
    });
  }

  const updatedOrder = await markOrderPaidFromCheckoutSession(session, JSON.stringify(session), runtimeEnv);
  return json({ order: updatedOrder, reconciled: true });
};
