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

The MVP now uses Cloudflare D1 as the primary order store, with the existing `ORDERS` KV binding kept as a compatibility fallback during the migration.

- `products`: seeded from [`src/data/site.ts`](/Users/pan/Documents/GitHub/sora-ramen/src/data/site.ts) via [`src/lib/catalog.ts`](/Users/pan/Documents/GitHub/sora-ramen/src/lib/catalog.ts)
- `orders`
- `order_items`
- `payments`
- `webhook_events`

The SQL schema lives in [`migrations/0001_create_order_tables.sql`](/Users/pan/Documents/GitHub/sora-ramen/migrations/0001_create_order_tables.sql).
If neither `DB` nor `ORDERS` is configured, the app falls back to in-memory storage for local development only.

## Required environment variables

Copy [`.env.example`](/Users/pan/Documents/GitHub/sora-ramen/.env.example) and set:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_SITE_URL=http://localhost:4322
```

For Cloudflare, set the Stripe values as Worker secrets and bind a D1 database as `DB`. Keeping `ORDERS` bound is still supported for compatibility and rollback safety.

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

1. Create a D1 database for orders:

   ```bash
   wrangler d1 create ramen-orders
   ```

2. Add the binding to [`wrangler.jsonc`](/Users/pan/Documents/GitHub/sora-ramen/wrangler.jsonc):

   ```jsonc
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "ramen-orders",
       "database_id": "your-d1-database-id"
     }
   ]
   ```

3. Apply the schema:

   ```bash
   wrangler d1 migrations apply ramen-orders --remote
   ```

4. Optionally keep the existing KV binding during migration:

   ```jsonc
   "kv_namespaces": [
     { "binding": "ORDERS", "id": "your-orders-kv-id" }
   ]
   ```

5. Add secrets:

   ```bash
   wrangler secret put STRIPE_SECRET_KEY
   wrangler secret put STRIPE_PUBLISHABLE_KEY
   wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

6. Set `PUBLIC_SITE_URL` to the deployed origin.

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
- D1 gives the order flow structured persistence, but the current migration still keeps KV compatibility code until the cutover is fully complete.
- The webhook idempotency layer is practical for MVP use, but it still relies on application logic rather than a full unique-constraint reconciliation workflow.
- Product data is seeded from source code rather than a merchant CMS.
