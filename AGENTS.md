# AGENTS.md

## Project Overview

Build a first-version food delivery ordering system for a single merchant.

This is a real client project. The priority is to ship a usable MVP quickly.
Focus on correctness of ordering and payment flow over architecture complexity or visual polish.

## Existing Stack

- Astro
- Cloudflare Workers
- Stripe
- TypeScript

Use the existing stack and existing project conventions wherever possible.
Do not replace the framework or redesign the whole app without a strong reason.

---

## Product Scope

### In Scope

Build an MVP for a single-store food delivery system with this business flow:

1. Customer browses menu
2. Customer adds items to cart
3. Customer submits order
4. Customer pays with Stripe Checkout
5. Backend confirms payment by Stripe webhook
6. Merchant receives the paid order
7. Merchant updates order status through fulfillment
8. Customer can view order progress

### Out of Scope

Do not build any of the following unless explicitly required later:

- multi-merchant marketplace logic
- rider dispatch optimization
- route planning
- maps or live tracking
- coupon engine
- loyalty points
- advanced inventory management
- multi-branch operations
- complicated RBAC or enterprise admin systems
- analytics dashboards beyond simple essentials

---

## Main Objective

Implement a minimal but production-oriented end-to-end order flow.

The system must support:

- menu browsing
- cart and checkout
- server-side order creation
- Stripe Checkout payment
- Stripe webhook confirmation
- merchant order management
- order status updates
- customer order detail view

Reliability matters more than abstraction.
Prefer straightforward code over premature generalization.

---

## Required Business Rules

### Payment Rules

- Never trust item prices, totals, or delivery fees from the client
- Always recalculate totals on the server using product data
- Persist the order before redirecting the customer to Stripe Checkout
- Use Stripe webhook as the source of truth for payment success
- Do not treat redirect to a success page as proof of payment
- Webhook handling must be idempotent
- Store enough Stripe identifiers to reconcile payments later

### Order Rules

- Order status and payment status must be stored separately
- Store a snapshot of purchased items at order creation time
- Prevent invalid state transitions
- Add basic lifecycle logging for important actions

---

## Required Statuses

### Order Status

Use these values unless there is a clear internal-only reason to add another field:

- `pending_payment`
- `paid_waiting_accept`
- `accepted`
- `cooking`
- `delivering`
- `completed`
- `cancelled`
- `refunded`

### Payment Status

Use these values:

- `unpaid`
- `paid`
- `failed`
- `refunded`

---

## Allowed State Transitions

Only allow the following main transitions:

- `pending_payment -> paid_waiting_accept`
- `paid_waiting_accept -> accepted`
- `accepted -> cooking`
- `cooking -> delivering`
- `delivering -> completed`

Also allow these business exceptions when appropriate:

- `pending_payment -> cancelled`
- `paid_waiting_accept -> cancelled`
- `paid_waiting_accept -> refunded`

Only allow `accepted -> cancelled` if implemented business rules explicitly permit cancellation after acceptance.

Reject invalid transitions with clear errors.

---

## Core Data Model

Create and use a minimal schema with the following entities.

### products

Fields:

- id
- name
- description
- image_url
- price
- is_available
- created_at
- updated_at

### orders

Fields:

- id
- order_no
- customer_name
- phone
- address
- remark
- items_amount
- delivery_fee
- total_amount
- payment_status
- order_status
- stripe_checkout_session_id
- stripe_payment_intent_id
- created_at
- paid_at
- updated_at

### order_items

Fields:

- id
- order_id
- product_id
- product_name
- unit_price
- quantity
- subtotal

### payments

Fields:

- id
- order_id
- provider
- provider_session_id
- provider_payment_intent_id
- amount
- currency
- status
- raw_payload
- created_at
- updated_at

### webhook_events

Fields:

- id
- provider
- event_id
- event_type
- processed
- created_at

You may add practical fields if needed, but do not bloat the schema.

---

## Required API Surface

Implement clear server routes for the following.

### Customer API

- `GET /api/products`
- `POST /api/orders`
- `GET /api/orders/:id`

### Admin API

- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `POST /api/admin/orders/:id/accept`
- `POST /api/admin/orders/:id/status`
- `POST /api/admin/orders/:id/cancel`

### Payment API

- `POST /api/payments/create-checkout-session`
- `POST /api/stripe/webhook`

If the current Astro project structure suggests a better route organization, keep it consistent while preserving the same capabilities.

---

## Customer-Facing Pages

Implement these MVP pages:

- menu page
- cart page
- checkout page
- payment success page
- order detail page

Requirements:

- mobile-friendly
- simple and clear
- customer can see current order status
- avoid overly complex design work

---

## Merchant Admin Pages

Implement these MVP admin views:

- orders list page
- order detail page

Required actions:

- accept order
- mark cooking
- mark delivering
- mark completed
- cancel order

Admin auth may be simplified if auth is not already set up.
Do not spend large effort on auth unless required by the existing codebase.

---

## Stripe Integration Requirements

Implement Stripe using server-side APIs.

Requirements:

- create Stripe Checkout Session on the server
- link the Checkout Session to the internal order
- persist Stripe identifiers
- process `checkout.session.completed` correctly
- support safe duplicate webhook delivery handling
- verify webhook signature properly
- do not use client-side payment confirmation as the order trigger

---

## Implementation Priorities

Work in this order of importance:

1. data model
2. order creation flow
3. Stripe Checkout session creation
4. Stripe webhook processing
5. merchant order management
6. customer order status page
7. UI cleanup
8. documentation

If time or context is limited, prioritize the working backend flow first.

---

## Code Quality Expectations

- Use TypeScript everywhere possible
- Keep functions small and explicit
- Prefer readable code over clever code
- Avoid giant files
- Use consistent naming
- Preserve existing code conventions unless clearly harmful
- Add validation and error handling for critical flows
- Add comments only when they help future maintainers understand non-obvious logic
- Do not leave TODOs in core ordering or payment paths

---

## Testing Expectations

If tests already exist:

- run and update them as needed

If tests do not exist:

- add minimal focused tests only for critical business logic such as:
  - price calculation
  - order state transition validation
  - webhook idempotency logic

Do not build an oversized test suite for the MVP.

---

## File and Change Strategy

Before editing:

- inspect the current repository structure
- identify the existing routing pattern
- identify current Stripe integration points
- identify current environment variable usage

When implementing:

- make the smallest set of changes needed for a working MVP
- reuse existing helpers where reasonable
- avoid speculative abstractions
- avoid introducing heavy dependencies without strong need

---

## Explicit Do Nots

Do not:

- replace Astro
- replace Cloudflare Workers
- replace Stripe
- redesign the entire project structure without need
- invent extra product requirements
- build marketplace features
- skip order persistence before payment
- skip webhook idempotency
- rely on frontend redirect as payment confirmation
- trust client-side totals
- over-engineer admin auth for MVP

---

## Deliverables

Produce all of the following:

1. project folder structure updates
2. database schema
3. core types
4. API route implementations
5. Stripe integration
6. webhook handler
7. customer pages
8. admin pages
9. seed product data
10. example environment file
11. README setup instructions
12. brief explanation of technical decisions

---

## Final Output Format

At the end of the work, provide:

1. What was built
2. Files changed
3. Environment variables required
4. Setup steps
5. Known limitations
6. Suggested next steps for phase 2

Keep the summary concise and practical.
