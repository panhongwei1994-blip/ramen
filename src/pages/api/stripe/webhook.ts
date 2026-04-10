import type { APIRoute } from "astro";
import Stripe from "stripe";
import { getRuntimeEnv, updateOrder } from "@/lib/orders";

export const prerender = false;

function cleanString(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

export const POST: APIRoute = async ({ request, locals }) => {
  const runtimeEnv = getRuntimeEnv(locals);
  const stripeKey = cleanString(runtimeEnv?.STRIPE_SECRET_KEY ?? import.meta.env.STRIPE_SECRET_KEY);
  const webhookSecret = cleanString(runtimeEnv?.STRIPE_WEBHOOK_SECRET ?? import.meta.env.STRIPE_WEBHOOK_SECRET);
  const signature = request.headers.get("stripe-signature");

  if (!stripeKey || !webhookSecret || !signature) {
    return new Response("Missing Stripe webhook configuration", { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Invalid Stripe signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderCode = session.metadata?.orderCode;

    if (orderCode) {
      await updateOrder(
        orderCode,
        (current) => ({
          ...current,
          status: "paid",
          paymentStatus: "paid",
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : current.stripePaymentIntentId,
          stripeCustomerEmail: session.customer_details?.email ?? current.stripeCustomerEmail,
          customerName: session.customer_details?.name ?? current.customerName,
          customerPhone: session.customer_details?.phone ?? current.customerPhone,
          address:
            session.customer_details?.address
              ? [
                  session.customer_details.address.line1,
                  session.customer_details.address.line2,
                  session.customer_details.address.city,
                  session.customer_details.address.state,
                  session.customer_details.address.postal_code,
                  session.customer_details.address.country,
                ]
                  .filter(Boolean)
                  .join(", ")
              : current.address,
        }),
        runtimeEnv,
      );
    }
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderCode = session.metadata?.orderCode;

    if (orderCode) {
      await updateOrder(
        orderCode,
        (current) => ({
          ...current,
          status: "payment_failed",
          paymentStatus: "failed",
          stripeSessionId: session.id,
        }),
        runtimeEnv,
      );
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
