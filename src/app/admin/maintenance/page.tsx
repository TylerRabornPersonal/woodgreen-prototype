"use client";

import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/admin/mock";
import {
  loadMaintenance,
  updateRequest,
  addRequest,
  maintStats,
  inPreset,
  MAINT_CATEGORIES,
  MAINT_STATUSES,
  MAINT_PRIORITIES,
  STATUS_LABEL,
  DATE_PRESETS,
  type MaintRequest,
  type MaintStatus,
  type MaintCategory,
  type MaintPriority,
  type DatePreset,
} from "@/lib/admin/maintenance";

type StatusFilter = "open" | "all" | MaintStatus;
const STATUS_CHIPS: { key: StatusFilter; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "new", label: "New" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All statuses" },
];

export default function MaintenancePage() {
  const [list, setList] = useState<MaintRequest[]>([]);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"orders" | "expenses">("orders");

  // work-order filters
  const [statusF, setStatusF] = useState<StatusFilter>("open");
  const [catF, setCatF] = useState<"all" | MaintCategory>("all");
  const [dateField, setDateField] = useState<"createdISO" | "completedISO">("createdISO");
  const [datePreset, setDatePreset] = useState<DatePreset>("365d");
  // expenses filter
  const [expPreset, setExpPreset] = useState<DatePreset>("365d");

  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", category: "General" as MaintCategory, location: "", priority: "normal" as MaintPriority, description: "" });

  useEffect(() => {
    setList(loadMaintenance());
    setReady(true);
    const refresh = () => setList(loadMaintenance());
    window.addEventListener("wg-maintenance", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("wg-maintenance", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!ready) return <p className="portal-note">Loading…</p>;

  const s = maintStats(list);

  const statusMatch = (r: MaintRequest) => statusF === "all" || (statusF === "open" ? r.status !== "completed" : r.status === statusF);
  const orders = list.filter(
    (r) => statusMatch(r) && (catF === "all" || r.category === catF) && inPreset(r[dateField], datePreset),
  );
  const expenses = list
    .filter((r) => r.status === "completed" && (r.costCents ?? 0) > 0 && inPreset(r.completedISO, expPreset))
    .sort((a, b) => (b.completedISO ?? "").localeCompare(a.completedISO ?? ""));
  const expenseTotal = expenses.reduce((sum, r) => sum + (r.costCents ?? 0), 0);

  const setStatus = (id: string, status: MaintStatus) => setList(updateRequest(id, { status }));
  const setPriority = (id: string, priority: MaintPriority) => setList(updateRequest(id, { priority }));
  const setVendor = (id: string, vendor: string) => setList(updateRequest(id, { vendor }));
  const setCost = (id: string, dollars: string) => {
    const n = parseFloat(dollars);
    setList(updateRequest(id, { costCents: isNaN(n) ? undefined : Math.round(n * 100) }));
  };
  const attachInvoice = (id: string, name: string) => setList(updateRequest(id, { invoiceFile: name }));

  const submitNew = () => {
    if (!f.title.trim()) return;
    setList(addRequest({ title: f.title.trim(), category: f.category, location: f.location.trim() || "Building", priority: f.priority, requester: "Operator", description: f.description.trim() }));
    setF({ title: "", category: "General", location: "", priority: "normal", description: "" });
    setOpen(false);
  };

  const kpis = [
    { label: "Open", num: String(s.open), sub: `${s.openUrgent} urgent`, alert: s.openUrgent > 0 },
    { label: "In progress", num: String(s.inProgress), sub: "being worked" },
    { label: "Scheduled", num: String(s.scheduled), sub: "vendor booked" },
    { label: "Completed", num: String(s.completed), sub: "all-time" },
    { label: "Spend · YTD", num: money(s.spendCents), sub: "completed this year" },
  ];

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Maintenance &amp; requests</h1>
          <p className="portal-sub">{s.open} open · {list.length} total work orders</p>
        </div>
        <button className="btn btn-pop" onClick={() => setOpen(true)}>+ Log request</button>
      </header>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className={`kpi${k.alert ? " alert" : ""}`}>
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-num">{k.num}</span>
            <span className="kpi-sub">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="subtabs">
        <button className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>Work orders</button>
        <button className={tab === "expenses" ? "on" : ""} onClick={() => setTab("expenses")}>Expenses</button>
      </div>

      {tab === "orders" ? (
        <>
          <div className="filters">
            <div className="filter-group">
              {STATUS_CHIPS.map((c) => (
                <button key={c.key} className={`chip${statusF === c.key ? " on" : ""}`} onClick={() => setStatusF(c.key)}>{c.label}</button>
              ))}
            </div>
            <div className="filter-group">
              <button className={`chip${catF === "all" ? " on" : ""}`} onClick={() => setCatF("all")}>All types</button>
              {MAINT_CATEGORIES.map((c) => (
                <button key={c} className={`chip${catF === c ? " on" : ""}`} onClick={() => setCatF(c)}>{c}</button>
              ))}
            </div>
            <div className="filter-group date-filter">
              <span className="filter-lbl">By</span>
              <select value={dateField} onChange={(e) => setDateField(e.target.value as typeof dateField)}>
                <option value="createdISO">Request date</option>
                <option value="completedISO">Completed date</option>
              </select>
              <select value={datePreset} onChange={(e) => setDatePreset(e.target.value as DatePreset)}>
                {DATE_PRESETS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
            </div>
          </div>

          <div className="pcard" style={{ overflowX: "auto" }}>
            <table className="bill-table mnt-table">
              <thead>
                <tr><th>Request</th><th>Location</th><th>Requester</th><th>Priority</th><th>Status</th><th>Vendor</th><th className="num">Cost</th><th>Invoice</th></tr>
              </thead>
              <tbody>
                {orders.map((r) => (
                  <tr key={r.id} className={r.priority === "urgent" && r.status !== "completed" ? "row-alert" : ""}>
                    <td>
                      <div className="mnt-title">{r.title}</div>
                      <div className="mnt-sub">{r.category} · {r.description}</div>
                      <div className="mnt-sub">Requested {r.createdISO}{r.completedISO ? ` · completed ${r.completedISO}` : ""}</div>
                    </td>
                    <td>{r.location}</td>
                    <td>{r.requester}</td>
                    <td>
                      <select className={`mnt-status ${r.priority}`} value={r.priority} onChange={(e) => setPriority(r.id, e.target.value as MaintPriority)}>
                        {MAINT_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className={`mnt-status ${r.status}`} value={r.status} onChange={(e) => setStatus(r.id, e.target.value as MaintStatus)}>
                        {MAINT_STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
                      </select>
                    </td>
                    <td><input className="mnt-input" value={r.vendor ?? ""} placeholder="—" onChange={(e) => setVendor(r.id, e.target.value)} /></td>
                    <td className="num"><span className="mnt-dollar">$</span><input className="mnt-input cost" inputMode="decimal" value={r.costCents != null ? (r.costCents / 100).toString() : ""} placeholder="0" onChange={(e) => setCost(r.id, e.target.value)} /></td>
                    <td><InvoiceCell req={r} onAttach={attachInvoice} /></td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={8}><p className="portal-note">No requests match.</p></td></tr>}
              </tbody>
            </table>
          </div>
          <p className="portal-note">Tenant submissions arrive as “New.” Status, priority, vendor, cost &amp; invoice save instantly. Completed costs roll into Expenses + accounting.</p>
        </>
      ) : (
        <>
          <div className="filters">
            <div className="filter-group">
              <span className="filter-lbl">Completed in</span>
              {DATE_PRESETS.map((d) => (
                <button key={d.key} className={`chip${expPreset === d.key ? " on" : ""}`} onClick={() => setExpPreset(d.key)}>{d.label}</button>
              ))}
            </div>
          </div>
          <div className="pcard" style={{ overflowX: "auto" }}>
            <table className="bill-table mnt-table">
              <thead>
                <tr><th>Completed</th><th>Work order</th><th>Type</th><th>Vendor</th><th>Invoice</th><th className="num">Amount</th></tr>
              </thead>
              <tbody>
                {expenses.map((r) => (
                  <tr key={r.id}>
                    <td>{r.completedISO}</td>
                    <td><div className="mnt-title">{r.title}</div><div className="mnt-sub">{r.location}</div></td>
                    <td>{r.category}</td>
                    <td>{r.vendor ?? "—"}</td>
                    <td><InvoiceCell req={r} onAttach={attachInvoice} /></td>
                    <td className="num">{money(r.costCents ?? 0)}</td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan={6}><p className="portal-note">No expenses in this window.</p></td></tr>}
              </tbody>
              {expenses.length > 0 && (
                <tfoot>
                  <tr className="lg-total"><td colSpan={5}>Total · {DATE_PRESETS.find((d) => d.key === expPreset)?.label}</td><td className="num">{money(expenseTotal)}</td></tr>
                </tfoot>
              )}
            </table>
          </div>
          <p className="portal-note">Defaults to the last 365 days. Each row links to its invoice PDF; in production these export to the accounting module and to CSV.</p>
        </>
      )}

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>Log a request</h3><button className="modal-x" onClick={() => setOpen(false)}>×</button></div>
            <div className="field"><label>Title</label><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. HVAC not cooling — O5" /></div>
            <div className="book-row">
              <div className="field"><label>Type</label><select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as MaintCategory })}>{MAINT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className="field"><label>Priority</label><select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as MaintPriority })}>{MAINT_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
            </div>
            <div className="field"><label>Location</label><input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Office code, Common area, Exterior…" /></div>
            <div className="field"><label>Description</label><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="What's going on?" /></div>
            <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center" }} disabled={!f.title.trim()} onClick={submitNew}>Create work order</button>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceCell({ req, onAttach }: { req: MaintRequest; onAttach: (id: string, name: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  if (req.invoiceFile) {
    return (
      <a className="inv-link" href={`/maintenance-invoices/${req.invoiceFile}`} target="_blank" rel="noopener noreferrer" title={req.invoiceFile}>
        📄 Invoice
      </a>
    );
  }
  return (
    <>
      <button className="inv-upload" onClick={() => ref.current?.click()}>Attach PDF</button>
      <input
        ref={ref}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => {
          const name = e.target.files?.[0]?.name;
          if (name) onAttach(req.id, name);
        }}
      />
    </>
  );
}
