import Link from "next/link";
import { getOfficeBySlug, getAddOns } from "@/lib/data";
import { quote, CONFIG, officeListPrice, addOnListPrice, type Term } from "@/lib/engine";
import SignFlow, { type PackagePart } from "@/components/agreement/SignFlow";
import type { SessionLicense } from "@/lib/portal/session";
import type { Office } from "@/lib/inventory";

export default async function SignPage({
  searchParams,
}: {
  searchParams: { offices?: string; furnished?: string; term?: string; addons?: string; company?: string; name?: string; email?: string };
}) {
  const slugs = (searchParams.offices ?? "").split(",").filter(Boolean);
  const resolved = await Promise.all(slugs.map((s) => getOfficeBySlug(s)));
  const offices = resolved.filter((o): o is Office => Boolean(o));

  if (!offices.length) {
    return (
      <div className="wrap page">
        <h2 className="section">Nothing to sign yet</h2>
        <p className="lead">Pick your offices and configure your package first.</p>
        <Link href="/" className="btn btn-primary">Back to building plan</Link>
      </div>
    );
  }

  const furnished = searchParams.furnished === "1";
  const term = (Number(searchParams.term) || 12) as Term;
  const addOnSlugs = (searchParams.addons ?? "").split(",").filter(Boolean);
  const allAddOns = await getAddOns();
  const chosen = allAddOns.filter((a) => addOnSlugs.includes(a.slug));
  const addRates = chosen.map((a) => a.rate);

  const q = quote({ officeBaseRates: offices.map((o) => o.rate), addOnRates: addRates, furnished, term });
  const totalFeeCents = Math.round(q.netMonthly * 100);
  const baseFeeCents = furnished
    ? Math.round(quote({ officeBaseRates: offices.map((o) => o.rate), addOnRates: addRates, furnished: false, term }).netMonthly * 100)
    : totalFeeCents;
  const furnitureFeeCents = Math.max(0, totalFeeCents - baseFeeCents);

  // dates
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const endExclusive = new Date(start.getFullYear(), start.getMonth() + term, 1);
  const end = new Date(endExclusive.getTime() - 86400000);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const pkg: PackagePart = {
    licenseNumber: `WG-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    premises: offices.map((o) => o.code).join(", "),
    sqft: offices.reduce((s, o) => s + o.sqft, 0),
    termMonths: term,
    commencement: fmt(start),
    expiration: fmt(end),
    baseFeeCents,
    furnitureFeeCents,
    totalFeeCents,
    furnished,
    confHours: q.confHours,
    overageStdCents: CONFIG.overageStd * 100,
    overageBoardroomCents: CONFIG.overageBoardroom * 100,
    depositCents: totalFeeCents,
  };

  const portalLicense: SessionLicense = {
    number: pkg.licenseNumber,
    status: "Active",
    furnished,
    termMonths: term,
    startDate: pkg.commencement,
    endDate: pkg.expiration,
    offices: offices.map((o) => ({ code: o.code, name: o.name, sqft: o.sqft, rate: o.rate })),
    addOns: chosen.map((a) => ({ name: a.name, sqft: a.sqft, rate: a.rate })),
    grossMonthlyCents: Math.round(q.grossMonthly * 100),
    netMonthlyCents: totalFeeCents,
    annualCents: Math.round(q.annual * 100),
    contractValueCents: Math.round(q.contractValue * 100),
    multiDiscount: q.multiDiscount,
    termDiscount: q.termDiscount,
    totalDiscount: q.totalDiscount,
    depositCents: totalFeeCents,
    lineItems: [
      ...offices.map((o) => ({ label: `Office ${o.code}`, sub: `${o.sqft} SF · ${furnished ? "furnished" : "unfurnished"}`, cents: Math.round(officeListPrice(o.rate, furnished) * 100) })),
      ...chosen.map((a) => ({ label: a.name, sub: `${a.sqft} SF · add-on`, cents: Math.round(addOnListPrice(a.rate) * 100) })),
    ],
  };

  return (
    <div className="wrap page">
      <div className="breadcrumb">
        <Link href={`/checkout?offices=${offices.map((o) => o.slug).join(",")}&furnished=${furnished ? "1" : "0"}&term=${term}${chosen.length ? `&addons=${chosen.map((a) => a.slug).join(",")}` : ""}`}>← Back to checkout</Link>
      </div>
      <h2 className="section">Sign your license</h2>
      <p className="lead">Confirm your details, review the 25 Woodgreen Coworking License Agreement, and sign electronically.</p>
      <SignFlow
        pkg={pkg}
        portalLicense={portalLicense}
        prefill={{ company: searchParams.company ?? "", name: searchParams.name ?? "", email: searchParams.email ?? "" }}
      />
    </div>
  );
}
