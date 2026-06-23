import Link from "next/link";
import { getOfficeBySlug, getAddOns } from "@/lib/data";
import CheckoutClient from "@/components/CheckoutClient";
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
  const term = Number(searchParams.term) || 12;
  const addOnSlugs = (searchParams.addons ?? "").split(",").filter(Boolean);
  const allAddOns = await getAddOns();
  const configureHref = `/configure?offices=${offices.map((o) => o.slug).join(",")}`;

  return (
    <div className="wrap page">
      <div className="breadcrumb"><Link href={configureHref}>← Back to configure</Link></div>
      <h2 className="section">Checkout</h2>
      <p className="lead">Review your package and reserve. Multi-office and term discounts are already applied.</p>
      <CheckoutClient offices={offices} allAddOns={allAddOns} addOnSlugs={addOnSlugs} furnished={furnished} term={term} />
    </div>
  );
}
