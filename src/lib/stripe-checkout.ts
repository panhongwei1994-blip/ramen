import Stripe from "stripe";
import type { OrderRecord } from "@/lib/orders";

function cleanString(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

function getPublicOrigin(request: Request, configuredSiteUrl?: string) {
  const explicit = cleanString(configuredSiteUrl);
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      // Fall back to request-derived origin when configuration is malformed.
    }
  }

  const forwardedProto = cleanString(request.headers.get("x-forwarded-proto") ?? undefined);
  const forwardedHost = cleanString(request.headers.get("x-forwarded-host") ?? undefined);

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

function toPublicImageUrl(path: string, origin: string) {
  const cleanedPath = cleanString(path);
  if (!cleanedPath) return undefined;

  try {
    return new URL(cleanedPath, origin).toString();
  } catch {
    return undefined;
  }
}

export async function createStripeCheckoutSessionForOrder(input: {
  order: OrderRecord;
  request: Request;
  stripeKey: string;
  siteUrl?: string;
}) {
  const origin = getPublicOrigin(input.request, input.siteUrl);
  const stripe = new Stripe(input.stripeKey);
  const lineItems = input.order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: input.order.currency,
      unit_amount: Math.round(item.unitPrice * 100),
      product_data: {
        name: item.productName,
        description: [item.addOns.map((addOn) => addOn.label).join(" · "), item.note].filter(Boolean).join(" | ") || undefined,
        images: toPublicImageUrl(item.imageUrl, origin) ? [toPublicImageUrl(item.imageUrl, origin) as string] : undefined,
      },
    },
  }));

  if (input.order.deliveryFee > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: input.order.currency,
        unit_amount: Math.round(input.order.deliveryFee * 100),
        product_data: {
          name: "Delivery Fee",
          description: undefined,
          images: undefined,
        },
      },
    });
  }

  return await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${origin}/checkout/success?order=${encodeURIComponent(input.order.orderNo)}`,
    cancel_url: `${origin}/orders/${encodeURIComponent(input.order.orderNo)}?checkout=cancelled`,
    client_reference_id: input.order.id,
    billing_address_collection: "auto",
    phone_number_collection: { enabled: true },
    shipping_address_collection:
      input.order.fulfillment === "delivery"
        ? {
            allowed_countries: ["US"],
          }
        : undefined,
    metadata: {
      orderId: input.order.id,
      orderNo: input.order.orderNo,
      fulfillment: input.order.fulfillment,
    },
    payment_intent_data: {
      metadata: {
        orderId: input.order.id,
        orderNo: input.order.orderNo,
      },
    },
  });
}
