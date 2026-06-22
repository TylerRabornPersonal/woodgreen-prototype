# 25 Woodgreen Place — Leasing Prototype

Interactive prototype for the coworking platform: browse a 2D building plan, click a
room, configure term / furnishing / add-ons with live engine pricing, and run a mock
checkout. Built on the same Drizzle schema and inventory seed as the real platform.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

No database required — the app reads the **static inventory** (`src/lib/inventory.ts`)
by default, so the click-through works out of the box.

## The flow

1. **`/`** — building plan. Switch floors, hover/click an available room.
2. **`/office/[slug]`** — office detail + configurator. Furnishing, term, add-ons →
   price updates live via the engine.
3. **`/checkout`** — quote summary with discount breakdown, contact form, simulated
   submit → confirmation. No payment is taken.

## Pricing engine

`src/lib/engine.ts` is the calculator logic, 1:1 with
`woodgreen-pricing-calculator.html`:

- list = unfurnished × 1.10, furnished × 1.20, rounded to $25
- multi-office −1%/office (cap 10%), term 12/24/36mo → 0/−3/−6%
- add-ons flat, excluded from multi-office count but get the package discount
- conference-hour bank tiered by office price

## Going live (DB-backed)

The schema and seed are production-ready:

```bash
cp .env.example .env      # set DATABASE_URL, then DATA_SOURCE=db
npm run db:push           # create tables (drizzle-kit)
npm run db:seed           # load 4 floors · 44 offices · 6 add-ons + engine config
```

`src/lib/data.ts` already has the DB query branches stubbed — flip `DATA_SOURCE=db`
and uncomment them. Nothing in the UI changes.

## Placeholders

- **Floor plans** are schematic (rooms along a corridor). Trace real CAD into
  `src/components/FloorPlan.tsx`; the click targets and routing stay the same.
- **Checkout** ends at a reservation request (lead), matching the
  waitlist-during-construction reality. Payment/invoicing tables exist in the schema
  for when that turns on.

## Structure

```
src/
  app/            page.tsx · office/[slug] · checkout · layout · globals.css
  components/     PlanExplorer · FloorPlan · Configurator · CheckoutClient
  lib/            engine.ts · inventory.ts · data.ts
  db/             schema.ts · seed.ts · client.ts
```
