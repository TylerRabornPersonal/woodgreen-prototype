import Link from "next/link";
import { getOfficeBySlug, getAddOns } from "@/lib/data";
import { quote, officeListPrice, addOnListPrice, type Term } from "@/lib/engine";
import CheckoutClient, { type CheckoutData, type LineItem } from "@/components/CheckoutClient";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { office?: string; furnished?: string; term?: string; addons?: string };
}) {
  const officeSlug = searchParams.office;
  const office = officeSlug ? await getOfficeBySlug(officeSlug) : undefined;

  if (!office) {
    return (
      <div className="wrap page">
        <h2 className="section">Nothing to check out</h2>
        <p className="lead">Pick a room from the building plan first.</p>
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
    officeBaseRates: [office.rate],
    addOnRates: chosen.map((a) => a.rate),
    furnished,
    term,
  });

  const lines: LineItem[] = [
    {
      label: `Office ${office.code}`,
      sub: `${office.sqft} SF · ${furnished ? "furnished" : "unfurnished"}`,
      price: officeListPrice(office.rate, furnished),
    },
    ...chosen.map((a) => ({ label: a.name, sub: `${a.sqft} SF · add-on`, price: addOnListPrice(a.rate) })),
  ];

  const data: CheckoutData = {
    officeCode: office.code,
    officeSlug: office.slug,
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

  return (
    <div className="wrap page">
      <div className="breadcrumb">
        <Link href={`/office/${office.slug}`}>← Back to office</Link>
      </div>
      <h2 className="section">Checkout</h2>
      <p className="lead">Review your package and reserve. Multi-office and term discounts are already applied.</p>
      <CheckoutClient data={data} />
    </div>
  );
}
