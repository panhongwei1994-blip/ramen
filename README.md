# Sumi Ramen MVP

Astro + Cloudflare Workers + Stripe single-store food delivery MVP.

## What this includes

- menu seed data exposed as a product catalog API
- cart and checkout from the existing homepage UI
- server-side order creation with snapshot items
- Stripe Checkout Session creation after the order is persisted
- Stripe webhook confirmation as payment source of truth
- separate `order_status` and `payment_status`
- merchant order management pages
- customer order detail page

## Data model

The MVP keeps the schema simple and stores records in the `ORDERS` KV binding:

- `products`: seeded from [`src/data/site.ts`](/Users/pan/Documents/GitHub/sora-ramen/src/data/site.ts) via [`src/lib/catalog.ts`](/Users/pan/Documents/GitHub/sora-ramen/src/lib/catalog.ts)
- `orders`
- `order_items` embedded as the order snapshot
- `payments`
- `webhook_events`

If `ORDERS` is not configured, the app falls back to in-memory storage for local development only.

## Required environment variables

Copy [`.env.example`](/Users/pan/Documents/GitHub/sora-ramen/.env.example) and set:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_SITE_URL=http://localhost:4322
```

For Cloudflare, set the Stripe values as Worker secrets and bind a KV namespace as `ORDERS`.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local env values from [`.env.example`](/Users/pan/Documents/GitHub/sora-ramen/.env.example).

3. Start Astro:

   ```bash
   npm run dev
   ```

4. In Stripe, forward webhooks locally:

   ```bash
   stripe listen --forward-to localhost:4322/api/stripe/webhook
   ```

5. Use the homepage cart flow to create an order, pay through Stripe Checkout, then verify:
   - customer detail page: `/orders/<orderNo>`
   - merchant queue: `/admin/orders`

## Cloudflare setup

1. Create a KV namespace for orders.
2. Add the binding to [`wrangler.jsonc`](/Users/pan/Documents/GitHub/sora-ramen/wrangler.jsonc):

   ```jsonc
   "kv_namespaces": [
     { "binding": "ORDERS", "id": "your-orders-kv-id" }
   ]
   ```

3. Add secrets:

   ```bash
   wrangler secret put STRIPE_SECRET_KEY
   wrangler secret put STRIPE_PUBLISHABLE_KEY
   wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

4. Set `PUBLIC_SITE_URL` to the deployed origin.

## Main routes

- `GET /api/products`
- `POST /api/orders`
- `GET /api/orders/:id`
- `POST /api/payments/create-checkout-session`
- `POST /api/stripe/webhook`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `POST /api/admin/orders/:id/accept`
- `POST /api/admin/orders/:id/cancel`
- `POST /api/admin/orders/:id/status`
- customer page: `/orders/:orderNo`
- checkout return page: `/checkout/success?order=:orderNo`
- merchant page: `/admin/orders`

## Known limitations

- Admin pages are intentionally unauthenticated in this MVP.
- KV is used for simplicity, so there are no relational queries or transactional guarantees.
- The webhook idempotency layer is practical for MVP use but not a substitute for a transactional database with unique constraints.
- Product data is seeded from source code rather than a merchant CMS.
