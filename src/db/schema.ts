/**
 * ============================================================================
 * 25 Woodgreen Place — Coworking Platform · Drizzle Data Model (SKETCH)
 * ----------------------------------------------------------------------------
 * Stack: Drizzle ORM + Postgres (Raborn Digital stack).
 * Status: STEP 3 sketch — full platform scope. Phase-1 (MVP) tables are marked
 *         [MVP]; later-phase tables are marked [P2]/[P3] but modeled now so the
 *         schema doesn't need surgery later.
 *
 * SOURCE OF TRUTH
 *   The build-your-own pricing calculator (woodgreen-pricing-calculator.html)
 *   defines the pricing engine. Named/productized bundles were KILLED — a
 *   license is a FREE-FORM composition of offices + add-ons, and the discount
 *   engine does the "bundling" automatically. So there is intentionally NO
 *   `bundles` table.
 *
 * ENGINE RULES → SCHEMA MAPPING  (all tunable, not hardcoded)
 *   • list price   = unfurnished × LIST_MULT (1.10), rounded to $25      → pricing_config
 *   • furnished    = × FURNISHED_MULT (1.20)                             → pricing_config
 *   • round to     = $25 increment                                       → pricing_config
 *   • term discount= 12mo 0% · 24mo 3% · 36mo 6%                         → term_options
 *   • multi-office = 1%/office, cap 10% (offices only, not add-ons)      → discount_config
 *   • add-ons      = flat rate, excluded from multi-office count,
 *                    but still receive the package discount              → add_ons.counts_toward_multi=false
 *   • conf hours   = tiered by office price (>=750→16, >=600→12,
 *                    >=475→8, else 6); overage $25/hr std, $35/hr board  → conf_hour_tiers
 *
 * MONEY: stored as INTEGER CENTS everywhere (no floats). Percentages stored
 *        as numeric(5,4) fractions (e.g. 0.0300 = 3%).
 * ============================================================================
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  numeric,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ===========================================================================
 * ENUMS
 * =========================================================================*/

export const buildingEnum = pgEnum("building", ["1993", "2001"]);

export const officeStatusEnum = pgEnum("office_status", [
  "available",
  "reserved", // soft-held during an open quote
  "occupied",
  "offline", // not leasable (construction / owner use)
]);

export const addOnCategoryEnum = pgEnum("add_on_category", [
  "conference",
  "storage",
  "server",
  "specialty",
]);

export const licenseStatusEnum = pgEnum("license_status", [
  "lead", // CRM interest, no quote yet
  "quote", // priced, not signed (offices soft-reserved)
  "active", // signed & in term
  "renewing",
  "ended",
  "lost", // quote that didn't convert
]);

export const lineItemKindEnum = pgEnum("line_item_kind", ["office", "add_on"]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "void",
  "uncollectible",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "ach",
  "card",
  "check",
  "wire",
  "other",
]);

export const userRoleEnum = pgEnum("user_role", [
  "owner", // Tyler / landlord side
  "manager",
  "tenant_admin", // primary contact on a license
  "tenant_member",
]);

/* ===========================================================================
 * SECTION 1 — INVENTORY  [MVP]
 * Buildings → floors → offices. Add-ons are building-scoped specialty rooms.
 * =========================================================================*/

export const floors = pgTable(
  "floors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Stable human slug used for routing + as the app-facing floor id ("1993-main").
    slug: varchar("slug", { length: 32 }).notNull(),
    building: buildingEnum("building").notNull(),
    level: integer("level").notNull(), // 1 = main, 2 = second
    label: text("label").notNull(), // "1993 Building · Main Floor"
    short: text("short"), // "1993 · Main"
    isPremium: boolean("is_premium").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    slugUq: uniqueIndex("floors_slug_uq").on(t.slug),
    buildingLevelUq: uniqueIndex("floors_building_level_uq").on(t.building, t.level),
  }),
);

export const offices = pgTable(
  "offices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Stable human slug used for routing ("1993-main-o1").
    slug: varchar("slug", { length: 48 }).notNull(),
    floorId: uuid("floor_id")
      .notNull()
      .references(() => floors.id),
    code: varchar("code", { length: 16 }).notNull(), // "O1", "P3", "B1", "A"
    name: text("name"), // optional friendly name / "windows", "connecting"
    sqft: integer("sqft").notNull(),
    // Base monthly UNFURNISHED rate in cents, BEFORE LIST_MULT/rounding.
    // The calculator's o[2] value (e.g. 850 → 85000 cents).
    baseUnfurnishedRateCents: integer("base_unfurnished_rate_cents").notNull(),
    isFurnishable: boolean("is_furnishable").notNull().default(true),
    hasWindows: boolean("has_windows").notNull().default(false),
    status: officeStatusEnum("status").notNull().default("available"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    slugUq: uniqueIndex("offices_slug_uq").on(t.slug),
    floorCodeUq: uniqueIndex("offices_floor_code_uq").on(t.floorId, t.code),
    statusIdx: index("offices_status_idx").on(t.status),
  }),
);

export const addOns = pgTable(
  "add_ons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    building: buildingEnum("building"), // nullable: some add-ons (basement) aren't floor-bound
    code: varchar("code", { length: 32 }).notNull(),
    name: text("name").notNull(), // "Dedicated Conference · 254 SF"
    category: addOnCategoryEnum("category").notNull(),
    sqft: integer("sqft"),
    // Flat monthly rate in cents BEFORE LIST_MULT/rounding (calculator o[2]).
    flatRateCents: integer("flat_rate_cents").notNull(),
    // Add-ons do NOT count toward the multi-office discount tally, but DO
    // receive the stacked package discount. Default false enforces that.
    countsTowardMultiOffice: boolean("counts_toward_multi_office").notNull().default(false),
    status: officeStatusEnum("status").notNull().default("available"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    codeUq: uniqueIndex("add_ons_code_uq").on(t.code),
  }),
);

/* ===========================================================================
 * SECTION 2 — PRICING CONFIG  [MVP]
 * Engine constants live in DB so they're tunable without a redeploy.
 * Single active row in pricing_config; term_options/conf_hour_tiers are sets.
 * =========================================================================*/

export const pricingConfig = pgTable("pricing_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Multiplier baked into every displayed price (negotiation headroom). 1.10.
  listMult: numeric("list_mult", { precision: 5, scale: 4 }).notNull().default("1.1000"),
  // Furnished uplift over unfurnished. 1.20.
  furnishedMult: numeric("furnished_mult", { precision: 5, scale: 4 }).notNull().default("1.2000"),
  // Rounding increment in cents (round25 → 2500).
  roundIncrementCents: integer("round_increment_cents").notNull().default(2500),
  // Multi-office discount: per-office fraction + cap.
  multiOfficePerOffice: numeric("multi_office_per_office", { precision: 5, scale: 4 })
    .notNull()
    .default("0.0100"), // 1%
  multiOfficeCap: numeric("multi_office_cap", { precision: 5, scale: 4 })
    .notNull()
    .default("0.1000"), // 10%
  // Conference overage rates (cents/hr).
  confOverageStdCents: integer("conf_overage_std_cents").notNull().default(2500),
  confOverageBoardroomCents: integer("conf_overage_boardroom_cents").notNull().default(3500),
  isActive: boolean("is_active").notNull().default(true),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).defaultNow().notNull(),
});

export const termOptions = pgTable(
  "term_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    months: integer("months").notNull(), // 12, 24, 36
    // Term discount fraction (12→0, 24→0.03, 36→0.06).
    discount: numeric("discount", { precision: 5, scale: 4 }).notNull(),
    label: text("label").notNull(), // "24 months"
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => ({
    monthsUq: uniqueIndex("term_options_months_uq").on(t.months),
  }),
);

// Tiered conference-hour bank by computed monthly office price (in cents).
// e.g. priceCents >= 75000 → 16h. Evaluated highest threshold first.
export const confHourTiers = pgTable("conf_hour_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  minPriceCents: integer("min_price_cents").notNull(), // inclusive threshold
  hoursPerMonth: integer("hours_per_month").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

/* ===========================================================================
 * SECTION 3 — CRM & TENANCY  [MVP for orgs/contacts; lifecycle MVP]
 * An organization is the tenant company; contacts are people; a license is the
 * single object that travels lead → quote → active → ended.
 * =========================================================================*/

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    legalEntityName: text("legal_entity_name"), // for the license agreement
    industry: text("industry"),
    website: text("website"),
    // Stripe Customer for billing (set on provisioning). Phase 0 foundational field.
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    nameIdx: index("organizations_name_idx").on(t.name),
  }),
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index("contacts_email_idx").on(t.email),
    orgIdx: index("contacts_org_idx").on(t.organizationId),
  }),
);

/**
 * LICENSE — the central agreement object. A license is a FREE-FORM bundle:
 * its composition lives entirely in license_line_items. Pricing is snapshotted
 * onto the license at quote time so historical quotes don't drift when config
 * changes. Recompute = re-run the engine and write a new snapshot.
 */
export const licenses = pgTable(
  "licenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id),
    primaryContactId: uuid("primary_contact_id").references(() => contacts.id),
    status: licenseStatusEnum("status").notNull().default("lead"),

    // --- terms snapshot ---
    termOptionId: uuid("term_option_id").references(() => termOptions.id),
    termMonths: integer("term_months"), // denormalized snapshot
    furnished: boolean("furnished").notNull().default(false),

    // --- discount snapshot (fractions) ---
    multiOfficeDiscount: numeric("multi_office_discount", { precision: 5, scale: 4 }),
    termDiscount: numeric("term_discount", { precision: 5, scale: 4 }),
    // Free-form additional concession (the calculator's "Additional % Off").
    concessionDiscount: numeric("concession_discount", { precision: 5, scale: 4 })
      .notNull()
      .default("0.0000"),
    totalDiscount: numeric("total_discount", { precision: 5, scale: 4 }), // sum, snapshot

    // --- money snapshot (cents) ---
    grossMonthlyCents: integer("gross_monthly_cents"), // list, pre-discount
    netMonthlyCents: integer("net_monthly_cents"), // what they pay / mo
    contractValueCents: integer("contract_value_cents"), // net × termMonths
    includedConfHours: integer("included_conf_hours"), // summed bank

    // --- dates ---
    quotedAt: timestamp("quoted_at", { withTimezone: true }),
    startDate: date("start_date"),
    endDate: date("end_date"),
    signedAt: timestamp("signed_at", { withTimezone: true }),

    pricingConfigId: uuid("pricing_config_id").references(() => pricingConfig.id),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("licenses_status_idx").on(t.status),
    orgIdx: index("licenses_org_idx").on(t.organizationId),
  }),
);

/**
 * LICENSE LINE ITEM — one office or one add-on on a license. Rate is
 * snapshotted (post LIST_MULT / furnishing / rounding) so the quote is stable.
 * kind discriminates which FK is populated (officeId xor addOnId).
 */
export const licenseLineItems = pgTable(
  "license_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    licenseId: uuid("license_id")
      .notNull()
      .references(() => licenses.id, { onDelete: "cascade" }),
    kind: lineItemKindEnum("kind").notNull(),
    officeId: uuid("office_id").references(() => offices.id),
    addOnId: uuid("add_on_id").references(() => addOns.id),

    // Snapshot of the per-unit monthly list price (cents) at quote time, after
    // LIST_MULT, furnishing uplift, and $25 rounding.
    listRateCents: integer("list_rate_cents").notNull(),
    // Whether this line counted toward the multi-office tally (offices: true).
    countedTowardMulti: boolean("counted_toward_multi").notNull().default(false),
    // Conference hours this line contributed to the bank (offices only).
    confHoursContributed: integer("conf_hours_contributed").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    licenseIdx: index("lli_license_idx").on(t.licenseId),
    officeIdx: index("lli_office_idx").on(t.officeId),
    addOnIdx: index("lli_add_on_idx").on(t.addOnId),
  }),
);

/* ===========================================================================
 * SECTION 4 — AUTH & USERS  [P2]
 * Tenant portal + landlord admin. Minimal auth surface; pair with an external
 * provider (e.g. Clerk/Auth.js) — passwordHash kept optional for that reason.
 * =========================================================================*/

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name"),
    role: userRoleEnum("role").notNull().default("tenant_member"),
    // Nullable: when delegating auth to an external provider.
    passwordHash: text("password_hash"),
    // Tenant-side users belong to an org; landlord-side users have null.
    organizationId: uuid("organization_id").references(() => organizations.id),
    contactId: uuid("contact_id").references(() => contacts.id),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    emailUq: uniqueIndex("users_email_uq").on(t.email),
    orgIdx: index("users_org_idx").on(t.organizationId),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tokenUq: uniqueIndex("sessions_token_uq").on(t.token),
    userIdx: index("sessions_user_idx").on(t.userId),
  }),
);

/* ===========================================================================
 * SECTION 5 — INVOICING & PAYMENTS  [P3]
 * Recurring monthly invoices off the active license + conference overage.
 * =========================================================================*/

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    licenseId: uuid("license_id")
      .notNull()
      .references(() => licenses.id),
    organizationId: uuid("organization_id").references(() => organizations.id),
    number: varchar("number", { length: 32 }).notNull(), // human invoice no.
    status: invoiceStatusEnum("status").notNull().default("draft"),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),
    dueDate: date("due_date"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    numberUq: uniqueIndex("invoices_number_uq").on(t.number),
    licenseIdx: index("invoices_license_idx").on(t.licenseId),
    statusIdx: index("invoices_status_idx").on(t.status),
  }),
);

export const invoiceLineItems = pgTable(
  "invoice_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(), // "Office B1 — June 2026", "Conf overage 4h"
    quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
    unitPriceCents: integer("unit_price_cents").notNull(),
    amountCents: integer("amount_cents").notNull(),
    // Optional provenance back to what generated the line.
    licenseLineItemId: uuid("license_line_item_id").references(() => licenseLineItems.id),
  },
  (t) => ({
    invoiceIdx: index("ili_invoice_idx").on(t.invoiceId),
  }),
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id").references(() => invoices.id),
    organizationId: uuid("organization_id").references(() => organizations.id),
    amountCents: integer("amount_cents").notNull(),
    method: paymentMethodEnum("method").notNull(),
    reference: text("reference"), // processor id / check no.
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
    metadata: jsonb("metadata"),
  },
  (t) => ({
    invoiceIdx: index("payments_invoice_idx").on(t.invoiceId),
  }),
);

/* ===========================================================================
 * SECTION 6 — CONFERENCE HOURS  [P3]
 * Each active license gets a monthly bank (summed from its office tiers).
 * Usage rows draw down the bank; overage bills at std/boardroom rate.
 * NOTE: smart-lock / door automation is DEFERRED to phase 2/3 — not modeled.
 * =========================================================================*/

export const confHourBanks = pgTable(
  "conf_hour_banks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    licenseId: uuid("license_id")
      .notNull()
      .references(() => licenses.id, { onDelete: "cascade" }),
    periodMonth: date("period_month").notNull(), // first of month
    allottedHours: integer("allotted_hours").notNull(),
    usedHours: numeric("used_hours", { precision: 6, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    licensePeriodUq: uniqueIndex("chb_license_period_uq").on(t.licenseId, t.periodMonth),
  }),
);

export const confHourUsage = pgTable(
  "conf_hour_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bankId: uuid("bank_id")
      .notNull()
      .references(() => confHourBanks.id, { onDelete: "cascade" }),
    // Which room was booked (a conference add-on).
    addOnId: uuid("add_on_id").references(() => addOns.id),
    bookedByUserId: uuid("booked_by_user_id").references(() => users.id),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    hours: numeric("hours", { precision: 6, scale: 2 }).notNull(),
    // Hours beyond the bank, billed as overage on the next invoice.
    overageHours: numeric("overage_hours", { precision: 6, scale: 2 }).notNull().default("0"),
    isBoardroom: boolean("is_boardroom").notNull().default(false), // $35/hr vs $25/hr
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bankIdx: index("chu_bank_idx").on(t.bankId),
  }),
);

/* ===========================================================================
 * RELATIONS  (Drizzle relational query layer)
 * =========================================================================*/

export const floorsRelations = relations(floors, ({ many }) => ({
  offices: many(offices),
}));

export const officesRelations = relations(offices, ({ one, many }) => ({
  floor: one(floors, { fields: [offices.floorId], references: [floors.id] }),
  lineItems: many(licenseLineItems),
}));

export const addOnsRelations = relations(addOns, ({ many }) => ({
  lineItems: many(licenseLineItems),
  confUsage: many(confHourUsage),
}));

export const termOptionsRelations = relations(termOptions, ({ many }) => ({
  licenses: many(licenses),
}));

export const pricingConfigRelations = relations(pricingConfig, ({ many }) => ({
  licenses: many(licenses),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  contacts: many(contacts),
  licenses: many(licenses),
  users: many(users),
  invoices: many(invoices),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contacts.organizationId],
    references: [organizations.id],
  }),
  primaryOnLicenses: many(licenses),
}));

export const licensesRelations = relations(licenses, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [licenses.organizationId],
    references: [organizations.id],
  }),
  primaryContact: one(contacts, {
    fields: [licenses.primaryContactId],
    references: [contacts.id],
  }),
  termOption: one(termOptions, {
    fields: [licenses.termOptionId],
    references: [termOptions.id],
  }),
  pricingConfig: one(pricingConfig, {
    fields: [licenses.pricingConfigId],
    references: [pricingConfig.id],
  }),
  lineItems: many(licenseLineItems),
  invoices: many(invoices),
  confHourBanks: many(confHourBanks),
}));

export const licenseLineItemsRelations = relations(licenseLineItems, ({ one }) => ({
  license: one(licenses, {
    fields: [licenseLineItems.licenseId],
    references: [licenses.id],
  }),
  office: one(offices, {
    fields: [licenseLineItems.officeId],
    references: [offices.id],
  }),
  addOn: one(addOns, {
    fields: [licenseLineItems.addOnId],
    references: [addOns.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  contact: one(contacts, { fields: [users.contactId], references: [contacts.id] }),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  license: one(licenses, { fields: [invoices.licenseId], references: [licenses.id] }),
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  lineItems: many(invoiceLineItems),
  payments: many(payments),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
  licenseLineItem: one(licenseLineItems, {
    fields: [invoiceLineItems.licenseLineItemId],
    references: [licenseLineItems.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
  organization: one(organizations, {
    fields: [payments.organizationId],
    references: [organizations.id],
  }),
}));

export const confHourBanksRelations = relations(confHourBanks, ({ one, many }) => ({
  license: one(licenses, {
    fields: [confHourBanks.licenseId],
    references: [licenses.id],
  }),
  usage: many(confHourUsage),
}));

export const confHourUsageRelations = relations(confHourUsage, ({ one }) => ({
  bank: one(confHourBanks, {
    fields: [confHourUsage.bankId],
    references: [confHourBanks.id],
  }),
  addOn: one(addOns, { fields: [confHourUsage.addOnId], references: [addOns.id] }),
  bookedBy: one(users, {
    fields: [confHourUsage.bookedByUserId],
    references: [users.id],
  }),
}));

/* ===========================================================================
 * SCHEMA MAP (relationships at a glance)
 * ---------------------------------------------------------------------------
 *   floors 1──* offices ─┐
 *                        ├──* license_line_items *──1 licenses
 *   add_ons ─────────────┘                              │
 *                                                        ├──1 organizations *──* contacts
 *   pricing_config 1──* licenses                         ├──1 term_options
 *   term_options / conf_hour_tiers  (engine config)      ├──* invoices ──* invoice_line_items
 *                                                        │              └──* payments
 *   users *──1 organizations, 1──* sessions              └──* conf_hour_banks ──* conf_hour_usage
 *
 *   Pricing flow: offices+add_ons selected → engine (pricing_config + term_options
 *   + conf_hour_tiers) → snapshot onto licenses + license_line_items → recurring
 *   invoices + conf-hour banks once active.
 * ===========================================================================
 */
