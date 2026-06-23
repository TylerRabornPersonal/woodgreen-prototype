import Link from "next/link";
import { getOfficeBySlug, getAddOns } from "@/lib/data";
import { quote, officeListPrice, addOnListPrice, type Term } from "@/lib/engine";
import CheckoutClient, { type CheckoutData, type LineItem } from "@/components/CheckoutClient";
import type { Office } from "@/lib/inventory";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { offices?: string; furnished?: string; term?: string; addons?: string };
}) {
  const slugs = (searchParams.offices ?? "").split(",").filter(Boolean);
  const resolved = await Promise.all(slugs.map((s) => getOfficeBySlug(s)));
  const offices = resolved.filter((o): o is Office => Boolean(o));

  if (!offices.length) {
    return (
      <div className="wrap page">
        <h2 className="section">Nothing to check out</h2>
        <p className="lead">Pick your offices from the building plan first.</p>
        <Link href="/" className="btn btn-primary">Back to building plan</Link>
      </div>
    );
  }

  const furnished = searchParams.furnished === "1";
  const term = (Number(searchParams.term) || 12) as Term;
  const addOnSlugs = (searchParams.addons ?? "").split(",").filter(Boolean);
  const allAddOns = await getAddOns();
  const chosen = allAddOns.filter((a) => addOnSlugs.includes(a.slug));

  const q = quote({
    officeBaseRates: offices.map((o) => o.rate),
    addOnRates: chosen.map((a) => a.rate),
    furnished,
    term,
  });

  const lines: LineItem[] = [
    ...offices.map((o) => ({
      label: `Office ${o.code}`,
      sub: `${o.sqft} SF · ${furnished ? "furnished" : "unfurnished"}`,
      price: officeListPrice(o.rate, furnished),
    })),
    ...chosen.map((a) => ({ label: a.name, sub: `${a.sqft} SF · add-on`, price: addOnListPrice(a.rate) })),
  ];

  const data: CheckoutData = {
    officeCodes: offices.map((o) => o.code),
    officeSlugs: offices.map((o) => o.slug),
    term,
    furnished,
    lines,
    grossMonthly: q.grossMonthly,
    multiDiscount: q.multiDiscount,
    termDiscount: q.termDiscount,
    totalDiscount: q.totalDiscount,
    netMonthly: q.netMonthly,
    annual: q.annual,
    contractValue: q.contractValue,
    confHours: q.confHours,
  };

  const configureHref = `/configure?offices=${offices.map((o) => o.slug).join(",")}`;

  return (
    <div className="wrap page">
      <div className="breadcrumb">
        <Link href={configureHref}>← Back to configure</Link>
      </div>
      <h2 className="section">Checkout</h2>
      <p className="lead">Review your package and reserve. Multi-office and term discounts are already applied.</p>
      <CheckoutClient data={data} />
    </div>
  );
}
