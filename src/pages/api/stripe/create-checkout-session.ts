import type { APIRoute } from "astro";
import Stripe from "stripe";
import { createOrder, getRuntimeEnv } from "@/lib/orders";

export const prerender = false;

function cleanString(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

type CheckoutPayload = {
  lang?: string;
  cart: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    image: string;
    addOnLabels: string[];
    notes: string;
  }>;
  checkout: {
    name: string;
    phone: string;
    address?: string;
    fulfillment: "delivery" | "pickup";
    payment: "stripe" | "cash";
  };
  deliveryFee: number;
};

export const POST: APIRoute = async ({ request, locals }) => {
  const runtimeEnv = getRuntimeEnv(locals);
  const stripeKey = cleanString(runtimeEnv?.STRIPE_SECRET_KEY ?? import.meta.env.STRIPE_SECRET_KEY);
  const siteUrl = cleanString(runtimeEnv?.PUBLIC_SITE_URL ?? import.meta.env.PUBLIC_SITE_URL);
  const publishableKey = cleanString(
    runtimeEnv?.STRIPE_PUBLISHABLE_KEY ?? import.meta.env.STRIPE_PUBLISHABLE_KEY,
  );

  if (!stripeKey) {
    return new Response(JSON.stringify({
      error:
        "Stripe key missing. Add STRIPE_SECRET_KEY in your Cloudflare Workers variables, then redeploy.",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!publishableKey) {
    return new Response(JSON.stringify({
      error:
        "Stripe publishable key missing. Add STRIPE_PUBLISHABLE_KEY in your Cloudflare Workers variables, then redeploy.",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = (await request.json()) as CheckoutPayload;
  if (!payload?.cart?.length) {
    return new Response(JSON.stringify({ error: "Cart is empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey);
  const origin = siteUrl || new URL(request.url).origin;
  const order = await createOrder({
    lang: payload.lang,
    cart: payload.cart,
    checkout: payload.checkout,
    deliveryFee: payload.deliveryFee,
    paymentMethod: "stripe",
    runtimeEnv,
  });

  const lineItems = payload.cart.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
        images: item.image ? [`${origin}${item.image}`] : undefined,
        description: [item.addOnLabels.join(" · "), item.notes].filter(Boolean).join(" | ") || undefined,
      },
      unit_amount: Math.round(item.unitPrice * 100),
    },
  }));

  if (payload.deliveryFee > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        product_data: {
          name: "Delivery Fee",
          images: undefined,
          description: undefined,
        },
        unit_amount: Math.round(payload.deliveryFee * 100),
      },
    });
  }

  const sessionParams = {
    ui_mode: "embedded_page",
    mode: "payment",
    line_items: lineItems,
    customer_email: undefined,
    redirect_on_completion: "never",
    billing_address_collection: "auto",
    phone_number_collection: {
      enabled: true,
    },
    shipping_address_collection: payload.checkout.fulfillment === "delivery"
      ? {
          allowed_countries: ["US"],
        }
      : undefined,
    metadata: {
      orderId: order.id,
      orderCode: order.orderCode,
      customerName: payload.checkout.name,
      customerPhone: payload.checkout.phone,
      fulfillment: payload.checkout.fulfillment,
      address: payload.checkout.address || "",
    },
  } as Record<string, unknown>;

  const session = await stripe.checkout.sessions.create(sessionParams as never);

  const clientSecret = cleanString(session.client_secret ?? "");
  if (!clientSecret) {
    return new Response(JSON.stringify({
      error: "Stripe did not return a checkout client secret. Try redeploying the Worker and retrying payment.",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    clientSecret,
    publishableKey,
    orderCode: order.orderCode,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
