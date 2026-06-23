import Link from "next/link";
import { getOfficeBySlug, getAddOns } from "@/lib/data";
import Configurator from "@/components/Configurator";
import type { Office } from "@/lib/inventory";

export default async function ConfigurePage({
  searchParams,
}: {
  searchParams: { offices?: string };
}) {
  const slugs = (searchParams.offices ?? "").split(",").filter(Boolean);
  const resolved = await Promise.all(slugs.map((s) => getOfficeBySlug(s)));
  const offices = resolved.filter((o): o is Office => Boolean(o));

  if (!offices.length) {
    return (
      <div className="wrap page">
        <h2 className="section">No offices selected</h2>
        <p className="lead">Head back to the building plan and pick the offices you want.</p>
        <Link href="/" className="btn btn-primary">Back to building plan</Link>
      </div>
    );
  }

  const addOns = await getAddOns();

  return (
    <div className="wrap page">
      <div className="breadcrumb">
        <Link href="/">← Building plan</Link>
      </div>
      <h2 className="section">Configure your package</h2>
      <p className="lead">
        {offices.length === 1
          ? "One office selected. Choose your term and furnishing, add storage or a conference room, then reserve."
          : `${offices.length} offices selected. Set the term and furnishing for the package and add any shared rooms — your multi-office discount is applied automatically.`}
      </p>
      <Configurator offices={offices} addOns={addOns} />
    </div>
  );
}
