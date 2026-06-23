import Link from "next/link";
import { getOfficeBySlug, getAddOns } from "@/lib/data";
import type { Term } from "@/lib/engine";
import SignFlow from "@/components/agreement/SignFlow";
import type { Office, AddOn } from "@/lib/inventory";

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
  const chosen = allAddOns.filter((a: AddOn) => addOnSlugs.includes(a.slug));

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const endExclusive = new Date(start.getFullYear(), start.getMonth() + term, 1);
  const end = new Date(endExclusive.getTime() - 86400000);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const meta = {
    licenseNumber: `WG-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    commencement: fmt(start),
    expiration: fmt(end),
  };

  const configureHref = `/checkout?offices=${offices.map((o) => o.slug).join(",")}&furnished=${furnished ? "1" : "0"}&term=${term}${chosen.length ? `&addons=${chosen.map((a) => a.slug).join(",")}` : ""}`;

  return (
    <div className="wrap page">
      <div className="breadcrumb"><Link href={configureHref}>← Back to checkout</Link></div>
      <h2 className="section">Sign your license</h2>
      <p className="lead">Confirm your details, review the 25 Woodgreen Coworking License Agreement, and sign electronically.</p>
      <SignFlow
        offices={offices}
        chosenAddOns={chosen}
        furnished={furnished}
        term={term}
        meta={meta}
        prefill={{ company: searchParams.company ?? "", name: searchParams.name ?? "", email: searchParams.email ?? "" }}
      />
    </div>
  );
}
