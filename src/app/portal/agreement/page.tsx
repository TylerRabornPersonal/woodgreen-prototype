"use client";

import AgreementDocument from "@/components/agreement/AgreementDocument";
import type { ScheduleA } from "@/lib/agreement/content";
import { usePortal } from "@/components/portal/PortalProvider";
import { quote, CONFIG, type Term } from "@/lib/engine";

export default function AgreementPage() {
  const { license, tenant, confBank } = usePortal();
  const officeRates = license.offices.map((o) => o.rate);
  const addRates = license.addOns.map((a) => a.rate);
  const baseQ = quote({ officeBaseRates: officeRates, addOnRates: addRates, furnished: false, term: license.termMonths as Term });
  const baseFeeCents = Math.round(baseQ.netMonthly * 100);

  const data: ScheduleA = {
    licenseNumber: license.number,
    legalName: tenant.legalName,
    entityType: "Per Schedule A",
    primaryContact: tenant.primaryContact.name,
    primaryEmail: tenant.primaryContact.email,
    premises: license.offices.map((o) => o.code).join(", "),
    sqft: license.offices.reduce((s, o) => s + o.sqft, 0),
    termMonths: license.termMonths,
    commencement: license.startDate,
    expiration: license.endDate,
    baseFeeCents,
    furnitureFeeCents: Math.max(0, license.netMonthlyCents - baseFeeCents),
    totalFeeCents: license.netMonthlyCents,
    furnished: license.furnished,
    confHours: confBank.allotted,
    overageStdCents: CONFIG.overageStd * 100,
    overageBoardroomCents: CONFIG.overageBoardroom * 100,
    depositCents: license.depositCents,
    isEntity: true,
  };

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">License agreement</h1>
          <p className="portal-sub">{license.number} · executed {license.startDate}</p>
        </div>
        <button className="btn btn-pop" onClick={() => window.print()}>Download PDF</button>
      </header>

      <div className="pcard doc">
        <AgreementDocument data={data} signed={{ name: tenant.primaryContact.name, date: license.startDate }} />
      </div>
    </div>
  );
}
