import {
  AGREEMENT_SECTIONS,
  HOUSE_RULES,
  GUARANTY_TEXT,
  type ScheduleA,
} from "@/lib/agreement/content";

const money = (cents: number) => "$" + Math.round(cents / 100).toLocaleString();
const TERM_WORD: Record<number, string> = { 12: "Twelve (12) months", 18: "Eighteen (18) months", 24: "Twenty-four (24) months", 30: "Thirty (30) months", 36: "Thirty-six (36) months" };

export default function AgreementDocument({
  data,
  signed = null,
}: {
  data: ScheduleA;
  signed?: { name: string; date: string } | null;
}) {
  return (
    <div className="agreement">
      <div className="doc-mark"><span className="wm"><span className="n">25</span><span className="t">WOODGREEN</span></span></div>
      <div className="agr-head">
        <div className="agr-org">25 Woodgreen LLC</div>
        <h2 className="doc-title">Coworking License Agreement</h2>
        <div className="agr-addr">25 Woodgreen Place, Madison, Mississippi 39110 · {data.licenseNumber}</div>
      </div>

      {/* Schedule A summary up top */}
      <div className="agr-scheduleA">
        <h3 className="doc-h3">Schedule A — Licensed Premises, Term &amp; Fees</h3>
        <div className="doc-grid">
          <div><span className="doc-k">Licensee</span><span className="doc-v">{data.legalName || "—"}</span></div>
          <div><span className="doc-k">Entity type</span><span className="doc-v">{data.entityType || "—"}</span></div>
          <div><span className="doc-k">Primary contact</span><span className="doc-v">{data.primaryContact || "—"}{data.primaryEmail ? ` · ${data.primaryEmail}` : ""}</span></div>
          <div><span className="doc-k">Licensed premises</span><span className="doc-v">{data.premises} · {data.sqft} SF</span></div>
          <div><span className="doc-k">Initial term</span><span className="doc-v">{TERM_WORD[data.termMonths] ?? `${data.termMonths} months`}</span></div>
          <div><span className="doc-k">Commencement → expiration</span><span className="doc-v">{data.commencement} – {data.expiration}</span></div>
          <div><span className="doc-k">Furnishing</span><span className="doc-v">{data.furnished ? "Furniture package (Schedule D)" : "Unfurnished (default)"}</span></div>
          <div><span className="doc-k">Conference allotment</span><span className="doc-v">{data.confHours} hrs/mo · {money(data.overageStdCents)}/hr overage ({money(data.overageBoardroomCents)} boardroom)</span></div>
        </div>
        <table className="doc-table">
          <tbody>
            <tr><td>Base monthly License Fee</td><td className="num">{money(data.baseFeeCents)}</td></tr>
            {data.furnitureFeeCents > 0 && <tr><td>Furniture package fee</td><td className="num">{money(data.furnitureFeeCents)}</td></tr>}
            <tr className="doc-tr-total"><td>Total monthly License Fee (locked for Initial Term)</td><td className="num">{money(data.totalFeeCents)}</td></tr>
            <tr><td>Security deposit (one month)</td><td className="num">{money(data.depositCents)}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Agreement body */}
      <div className="agr-body">
        {AGREEMENT_SECTIONS.map((s, i) => (
          <section key={i} className="agr-section">
            <h4 className="agr-sh">{s.n ? `${s.n}. ` : ""}{s.title}</h4>
            {s.body.map((p, j) => <p key={j} className="agr-p">{p}</p>)}
          </section>
        ))}
      </div>

      {/* Schedule B */}
      <div className="agr-body">
        <h3 className="doc-h3">Schedule B — House Rules</h3>
        {HOUSE_RULES.map((g, i) => (
          <div key={i} className="agr-rules">
            <h4 className="agr-sh">{g.group}</h4>
            <ul className="agr-ul">{g.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
          </div>
        ))}
      </div>

      {/* Schedule C — only entities */}
      {data.isEntity && (
        <div className="agr-body">
          <h3 className="doc-h3">Schedule C — Personal Guaranty</h3>
          <p className="agr-p">{GUARANTY_TEXT}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="agr-body">
        <h3 className="doc-h3">Signatures</h3>
        <p className="agr-p">IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.</p>
        <div className="doc-sign">
          <div className="doc-sign-block">
            <div className="doc-sign-line">25 Woodgreen LLC</div>
            <span className="doc-k">Licensor</span>
          </div>
          <div className="doc-sign-block">
            <div className="doc-sign-line">{signed ? signed.name : ""}</div>
            <span className="doc-k">
              {signed ? `Licensee · signed electronically ${signed.date}` : "Licensee · signature"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
