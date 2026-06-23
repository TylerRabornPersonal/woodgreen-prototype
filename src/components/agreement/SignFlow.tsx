"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AgreementDocument from "./AgreementDocument";
import type { ScheduleA } from "@/lib/agreement/content";
import { saveSession, type SessionLicense, type TenantSession } from "@/lib/portal/session";
import type { Office, AddOn } from "@/lib/inventory";
import { quote, officeListPrice, addOnListPrice, type Term } from "@/lib/engine";
import { defaultOverrides, loadOverrides, toEngineConfig, rateFor } from "@/lib/pricing/store";

export type PackagePart = Omit<
  ScheduleA,
  "legalName" | "entityType" | "primaryContact" | "primaryEmail" | "isEntity"
>;

const ENTITY_TYPES = ["LLC", "Corporation", "Partnership", "Sole Proprietor", "Individual"];
const isEntityType = (t: string) => ["LLC", "Corporation", "Partnership"].includes(t);
const money = (cents: number) => "$" + Math.round(cents / 100).toLocaleString();
const brandFromNumber = (d: string) => (d.startsWith("4") ? "Visa" : d.startsWith("5") ? "Mastercard" : d.startsWith("3") ? "Amex" : "Card");

const STEPS = ["Your details", "Review", "Sign", "Payment"];

export default function SignFlow({
  offices: rawOffices,
  chosenAddOns,
  furnished,
  term,
  meta,
  prefill,
}: {
  offices: Office[];
  chosenAddOns: AddOn[];
  furnished: boolean;
  term: Term;
  meta: { licenseNumber: string; commencement: string; expiration: string };
  prefill: { company: string; name: string; email: string };
}) {
  // operator pricing overrides
  const [ov, setOv] = useState(defaultOverrides());
  useEffect(() => setOv(loadOverrides()), []);
  const cfg = useMemo(() => toEngineConfig(ov), [ov]);
  const offices = useMemo(() => rawOffices.map((o) => ({ ...o, rate: rateFor(ov, o.slug, o.rate) })), [rawOffices, ov]);

  const { pkg, portalLicense } = useMemo(() => {
    const q = quote({ officeBaseRates: offices.map((o) => o.rate), addOnRates: chosenAddOns.map((a) => a.rate), furnished, term }, cfg);
    const totalFeeCents = Math.round(q.netMonthly * 100);
    const baseFeeCents = furnished
      ? Math.round(quote({ officeBaseRates: offices.map((o) => o.rate), addOnRates: chosenAddOns.map((a) => a.rate), furnished: false, term }, cfg).netMonthly * 100)
      : totalFeeCents;
    const pkgV: PackagePart = {
      licenseNumber: meta.licenseNumber,
      premises: offices.map((o) => o.code).join(", "),
      sqft: offices.reduce((s, o) => s + o.sqft, 0),
      termMonths: term,
      commencement: meta.commencement,
      expiration: meta.expiration,
      baseFeeCents,
      furnitureFeeCents: Math.max(0, totalFeeCents - baseFeeCents),
      totalFeeCents,
      furnished,
      confHours: q.confHours,
      overageStdCents: cfg.overageStd * 100,
      overageBoardroomCents: cfg.overageBoardroom * 100,
      depositCents: totalFeeCents,
    };
    const licenseV: SessionLicense = {
      number: meta.licenseNumber,
      status: "Active",
      furnished,
      termMonths: term,
      startDate: meta.commencement,
      endDate: meta.expiration,
      offices: offices.map((o) => ({ code: o.code, name: o.name, sqft: o.sqft, rate: o.rate })),
      addOns: chosenAddOns.map((a) => ({ name: a.name, sqft: a.sqft, rate: a.rate })),
      grossMonthlyCents: Math.round(q.grossMonthly * 100),
      netMonthlyCents: totalFeeCents,
      annualCents: Math.round(q.annual * 100),
      contractValueCents: Math.round(q.contractValue * 100),
      multiDiscount: q.multiDiscount,
      termDiscount: q.termDiscount,
      totalDiscount: q.totalDiscount,
      depositCents: totalFeeCents,
      lineItems: [
        ...offices.map((o) => ({ label: `Office ${o.code}`, sub: `${o.sqft} SF · ${furnished ? "furnished" : "unfurnished"}`, cents: Math.round(officeListPrice(o.rate, furnished, cfg) * 100) })),
        ...chosenAddOns.map((a) => ({ label: a.name, sub: `${a.sqft} SF · add-on`, cents: Math.round(addOnListPrice(a.rate, cfg) * 100) })),
      ],
    };
    return { pkg: pkgV, portalLicense: licenseV };
  }, [offices, chosenAddOns, furnished, term, cfg, meta]);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    legalName: prefill.company,
    entityType: "LLC",
    primaryContact: prefill.name,
    primaryEmail: prefill.email,
    phone: "",
    billing: "",
  });
  const [signName, setSignName] = useState("");
  const [consent, setConsent] = useState(false);
  const [guarantor, setGuarantor] = useState("");
  const [guarantyConsent, setGuarantyConsent] = useState(false);
  const [payKind, setPayKind] = useState<"card" | "bank">("card");
  const [payNum, setPayNum] = useState("");
  const [payExtra, setPayExtra] = useState("");

  const isEntity = isEntityType(form.entityType);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const dueToday = pkg.depositCents + pkg.totalFeeCents;

  const data: ScheduleA = useMemo(
    () => ({ ...pkg, legalName: form.legalName, entityType: form.entityType, primaryContact: form.primaryContact, primaryEmail: form.primaryEmail, isEntity }),
    [pkg, form, isEntity],
  );

  const detailsValid = form.legalName.trim() && form.primaryContact.trim() && form.primaryEmail.trim();
  const signValid =
    signName.trim().toLowerCase() === form.primaryContact.trim().toLowerCase() &&
    consent &&
    (!isEntity || (guarantor.trim() && guarantyConsent));
  const payValid = payNum.replace(/\D/g, "").length >= 4;

  const finish = () => {
    const digits = payNum.replace(/\D/g, "");
    const last4 = digits.slice(-4);
    const session: TenantSession = {
      tenant: {
        orgName: form.legalName,
        legalName: form.legalName,
        primaryContact: { name: form.primaryContact, email: form.primaryEmail },
        memberSince: monthName,
        suiteLabel: `Offices ${pkg.premises}`,
      },
      license: portalLicense,
      confBank: { allotted: pkg.confHours, periodLabel: monthName },
      invoices: [
        { id: "in_setup", number: `${pkg.licenseNumber}-01`, periodLabel: "First month + deposit", amountCents: dueToday, status: "paid", dateLabel: `Paid ${today}` },
        { id: "in_cur", number: `${pkg.licenseNumber}-02`, periodLabel: monthName, amountCents: pkg.totalFeeCents, status: "due", dateLabel: "Due 1st" },
      ],
      paymentMethods: [
        { id: "pm_1", kind: payKind, label: payKind === "card" ? brandFromNumber(digits) : "Bank · Checking", last4, isDefault: true },
      ],
      bookings: [],
      signed: { name: signName, date: today },
    };
    saveSession(session);
    setStep(5);
  };

  if (step === 5) {
    return (
      <div className="card panel confirm-screen">
        <div className="check">✓</div>
        <h2>You&apos;re all set</h2>
        <p className="lead" style={{ margin: "0 auto 6px" }}>
          {data.legalName} has signed the 25 Woodgreen License ({data.licenseNumber}) for {data.premises} and
          paid {money(dueToday)} (first month + deposit). Your tenant portal is ready.
        </p>
        <p className="placeholder-note">(Demo: signature and payment are simulated — no document filed, no card charged.)</p>
        <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/portal" className="btn btn-pop">Open your tenant portal →</Link>
          <Link href="/" className="btn btn-ghost">Back to building plan</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="signsteps">
        {STEPS.map((s, i) => (
          <div key={s} className={`signstep${i === step ? " on" : ""}${i < step ? " done" : ""}`}>
            <span className="signstep-n">{i < step ? "✓" : i + 1}</span>{s}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="card panel sign-form">
          <h3>Licensee details (Schedule A)</h3>
          <div className="field"><label>Legal name (individual or entity)</label><input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} placeholder="Caldwell & Associates, PLLC" /></div>
          <div className="field"><label>Entity type</label><select value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value })}>{ENTITY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div className="field"><label>Primary contact</label><input value={form.primaryContact} onChange={(e) => setForm({ ...form, primaryContact: e.target.value })} placeholder="Jane Caldwell" /></div>
          <div className="field"><label>Primary email</label><input type="email" value={form.primaryEmail} onChange={(e) => setForm({ ...form, primaryEmail: e.target.value })} placeholder="jane@firm.com" /></div>
          <div className="field"><label>Phone (optional)</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(601) 555-0100" /></div>
          {isEntity && <p className="portal-note">As a business entity, signing requires a Personal Guaranty (Schedule C) from a principal.</p>}
          <button className="btn btn-pop" disabled={!detailsValid} onClick={() => setStep(1)}>Review the agreement →</button>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="agr-scroll"><AgreementDocument data={data} signed={null} /></div>
          <div className="sign-actions">
            <button className="btn btn-ghost" onClick={() => setStep(0)}>← Edit details</button>
            <button className="btn btn-pop" onClick={() => setStep(2)}>I have read it — continue to sign →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card panel sign-form">
          <h3>Electronic signature</h3>
          <p className="portal-note" style={{ marginTop: 0 }}>Per §19, electronic signature has the same legal effect as ink under MS UETA and the federal E-SIGN Act.</p>
          <div className="field"><label>Type your full legal name to sign</label><input value={signName} onChange={(e) => setSignName(e.target.value)} placeholder={form.primaryContact} /></div>
          {signName && signName.trim().toLowerCase() !== form.primaryContact.trim().toLowerCase() && (
            <p className="portal-note danger">Must match the primary contact name: {form.primaryContact}</p>
          )}
          <label className="consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I have read and agree to the 25 Woodgreen Coworking License Agreement, House Rules, and electronic delivery of notices.</label>
          {isEntity && (
            <div className="guaranty-box">
              <h4>Personal Guaranty (Schedule C)</h4>
              <div className="field"><label>Guarantor — principal&apos;s full name</label><input value={guarantor} onChange={(e) => setGuarantor(e.target.value)} placeholder="Jane Caldwell" /></div>
              <label className="consent"><input type="checkbox" checked={guarantyConsent} onChange={(e) => setGuarantyConsent(e.target.checked)} /> As a principal, I personally and unconditionally guarantee {data.legalName}&apos;s monetary obligations.</label>
            </div>
          )}
          <div className="sign-actions">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-pop" disabled={!signValid} onClick={() => setStep(3)}>Sign &amp; continue to payment →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card panel sign-form">
          <h3>Deposit &amp; first payment</h3>
          <div className="pay-summary">
            <div className="summary-line"><span>First month&apos;s License Fee</span><span>{money(pkg.totalFeeCents)}</span></div>
            <div className="summary-line"><span>Security deposit (one month)</span><span>{money(pkg.depositCents)}</span></div>
            <div className="summary-line total"><span>Due today</span><span>{money(dueToday)}</span></div>
          </div>
          <div className="seg" style={{ margin: "8px 0 12px" }}>
            <button className={payKind === "card" ? "on" : ""} onClick={() => setPayKind("card")}>Card</button>
            <button className={payKind === "bank" ? "on" : ""} onClick={() => setPayKind("bank")}>Bank (ACH)</button>
          </div>
          <div className="field"><label>{payKind === "card" ? "Card number" : "Account number"}</label><input value={payNum} onChange={(e) => setPayNum(e.target.value)} placeholder={payKind === "card" ? "4242 4242 4242 4242" : "000123456789"} inputMode="numeric" /></div>
          <div className="field"><label>{payKind === "card" ? "Expiry · CVC" : "Routing number"}</label><input value={payExtra} onChange={(e) => setPayExtra(e.target.value)} placeholder={payKind === "card" ? "12 / 28 · 123" : "062000019"} inputMode="numeric" /></div>
          <div className="sign-actions">
            <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-pop" disabled={!payValid} onClick={finish}>Pay {money(dueToday)} &amp; finish</button>
          </div>
          <p className="portal-note" style={{ textAlign: "center" }}>🔒 Simulated on-site payment. In production this is Stripe&apos;s secure element — no real card is charged here.</p>
        </div>
      )}
    </div>
  );
}
