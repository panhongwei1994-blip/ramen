import type { APIRoute } from "astro";
import Stripe from "stripe";
import {
  finishWebhookEvent,
  getRuntimeEnv,
  markOrderPaidFromCheckoutSession,
  markOrderPaymentFailed,
  markOrderRefunded,
  startWebhookEvent,
} from "@/lib/orders";

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

  const webhook = await startWebhookEvent({
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    rawPayload: body,
    runtimeEnv,
  });

  if (webhook.alreadyProcessed) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await markOrderPaidFromCheckoutSession(event.data.object as Stripe.Checkout.Session, body, runtimeEnv);
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await markOrderPaymentFailed({
          sessionId: session.id,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : "",
          rawPayload: body,
          runtimeEnv,
        });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (typeof charge.payment_intent === "string" && charge.refunded) {
          await markOrderRefunded({
            paymentIntentId: charge.payment_intent,
            rawPayload: body,
            runtimeEnv,
          });
        }
        break;
      }
      default:
        break;
    }

    await finishWebhookEvent({
      provider: "stripe",
      eventId: event.id,
      processed: true,
      runtimeEnv,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    await finishWebhookEvent({
      provider: "stripe",
      eventId: event.id,
      processed: false,
      errorMessage: error instanceof Error ? error.message : "Unknown webhook error",
      runtimeEnv,
    });

    return new Response("Webhook processing failed", { status: 500 });
  }
};
