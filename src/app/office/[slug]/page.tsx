import Link from "next/link";
import { notFound } from "next/navigation";
import { getOfficeBySlug, getAddOns, getFloors } from "@/lib/data";
import Configurator from "@/components/Configurator";

export default async function OfficePage({ params }: { params: { slug: string } }) {
  const office = await getOfficeBySlug(params.slug);
  if (!office) notFound();

  const [addOns, floors] = await Promise.all([getAddOns(), getFloors()]);
  const floor = floors.find((f) => f.id === office.floorId);

  return (
    <div className="wrap page">
      <div className="breadcrumb">
        <Link href="/">← Building plan</Link>
      </div>

      <h2 className="section">
        Office {office.code}{" "}
        {office.premium && <span className="tag prem">Premium</span>}
        {office.windows && <span className="tag" style={{ marginLeft: 6 }}>Windows</span>}
      </h2>
      <p className="lead">
        {floor?.label}
        {office.name ? ` · ${office.name}` : ""} · {office.sqft} SF. A private executive office at 25
        Woodgreen Place. Configure it below — your price updates live as you choose term, furnishing,
        and add-ons.
      </p>

      <Configurator office={office} addOns={addOns} />
    </div>
  );
}
