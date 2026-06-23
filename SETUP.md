# Phase 0 — Foundations Setup (Supabase + Stripe)

This turns the prototype (static data, no DB) into a real, database-backed app.
Steps marked **[you]** require your accounts/credentials and only you can do them.
Steps marked **[code ready]** are already wired in the repo and just need the env
values from the [you] steps.

Do these in order. Use **test mode** for Stripe throughout Phase 0.

---

## 1. Create the Supabase project  **[you]**

1. Go to supabase.com → New project. Pick a name (e.g. `woodgreen`), a strong DB
   password (save it), and a region near Mississippi (`us-east-1`).
2. Wait for it to provision (~2 min).
3. **Project Settings → Database → Connection string → URI.** Copy it. This is
   your `DATABASE_URL` (it already includes the password).
4. **Project Settings → API.** Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)

## 2. Create the Stripe account  **[you]**

1. dashboard.stripe.com → make sure the **Test mode** toggle is ON.
2. **Developers → API keys.** Copy:
   - Secret key → `STRIPE_SECRET_KEY`
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. (Webhook secret comes in step 6.)

## 3. Fill in env vars  **[you]**

Locally: copy `.env.example` to `.env` and paste the values from steps 1–2.

```bash
cd woodgreen-prototype
cp .env.example .env
# edit .env with the Supabase + Stripe values
```

Leave `DATA_SOURCE=static` for now; you'll flip it in step 5.

On **Vercel** (Project → Settings → Environment Variables) add the same keys so the
deployed site can use them later.

## 4. Create the database tables  **[code ready → you run]**

The schema lives in `src/db/schema.ts`. Push it to Supabase:

```bash
npm install          # picks up the new stripe + supabase deps
npm run db:push      # creates all tables in your Supabase Postgres
npm run db:seed      # loads 4 floors · 44 offices · 6 add-ons + engine config
```

(For versioned migrations instead of push: `npm run db:generate` then
`npm run db:migrate`.)

## 5. Point the app at the database  **[code ready]**

In `.env`, set:

```
DATA_SOURCE=db
```

Run `npm run dev` — the homepage now reads inventory from Supabase instead of the
static file. The data layer (`src/lib/data.ts`) already has both branches; this
flag is the only switch. If anything looks off, set it back to `static`.

## 6. Register the Stripe webhook  **[you]**

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint.**
2. URL: `https://<your-vercel-domain>/api/stripe/webhook`
   (for local testing use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`).
3. Subscribe to: `invoice.paid`, `invoice.payment_failed`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `payment_method.attached`, `payment_method.detached`.
4. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` (in `.env` and Vercel).

The endpoint (`src/app/api/stripe/webhook/route.ts`) already verifies signatures;
the per-event handlers are stubbed for Phase 2.

## 7. Lock down the data (RLS)  **[you run]**

Open `src/db/rls.sql`, copy it into the **Supabase SQL editor**, and run it. This
enables row-level security: inventory stays world-readable, but every
tenant-specific table only returns the signed-in user's own organization.

---

## What's ready in the repo (no action needed)

- `src/db/schema.ts` — full schema (now with floor/office `slug`s + `organizations.stripe_customer_id`).
- `src/db/seed.ts` — inventory + engine config seed (slugs populated).
- `src/lib/data.ts` — reads static **or** DB based on `DATA_SOURCE`.
- `src/lib/stripe.ts` — Stripe server client.
- `src/lib/supabase/server.ts` + `client.ts` — Supabase admin + browser clients.
- `src/app/api/stripe/webhook/route.ts` — signature-verifying webhook skeleton.
- `src/db/rls.sql` — RLS starter policies.
- `.env.example` — every variable you need.

## After Phase 0

Once the app is reading from Supabase and Stripe test keys are in place, Phase 1
is the **portal shell + auth** (login, `/portal`, dashboard against a seeded
tenant), then Phase 2 **billing** (Customer Portal for bank/card changes). See
`woodgreen-portal-plan.md`.

> Heads up: I can't create your Supabase/Stripe accounts or run migrations against
> your cloud DB. Do steps 1–3 and 6–7; the code for 4–5 is ready to run. Send me a
> shout (or the errors) if `db:push`/`db:seed` complains and I'll sort it.
