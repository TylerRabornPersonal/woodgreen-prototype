"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/admin/mock";
import {
  loadMaintenance,
  updateRequest,
  addRequest,
  maintStats,
  MAINT_CATEGORIES,
  MAINT_STATUSES,
  MAINT_PRIORITIES,
  STATUS_LABEL,
  type MaintRequest,
  type MaintStatus,
  type MaintCategory,
  type MaintPriority,
} from "@/lib/admin/maintenance";

export default function MaintenancePage() {
  const [list, setList] = useState<MaintRequest[]>([]);
  const [ready, setReady] = useState(false);
  const [statusF, setStatusF] = useState<"all" | MaintStatus>("all");
  const [catF, setCatF] = useState<"all" | MaintCategory>("all");
  const [open, setOpen] = useState(false);

  // new-request form
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
  const filtered = list.filter((r) => (statusF === "all" || r.status === statusF) && (catF === "all" || r.category === catF));

  const setStatus = (id: string, status: MaintStatus) => setList(updateRequest(id, { status }));
  const setVendor = (id: string, vendor: string) => setList(updateRequest(id, { vendor }));
  const setCost = (id: string, dollars: string) => {
    const n = parseFloat(dollars);
    setList(updateRequest(id, { costCents: isNaN(n) ? undefined : Math.round(n * 100) }));
  };

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
    { label: "Spend to date", num: money(s.spendCents), sub: "completed work orders" },
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

      <div className="filters">
        <div className="filter-group">
          <button className={`chip${statusF === "all" ? " on" : ""}`} onClick={() => setStatusF("all")}>All statuses</button>
          {MAINT_STATUSES.map((st) => (
            <button key={st} className={`chip${statusF === st ? " on" : ""}`} onClick={() => setStatusF(st)}>{STATUS_LABEL[st]}</button>
          ))}
        </div>
        <div className="filter-group">
          <button className={`chip${catF === "all" ? " on" : ""}`} onClick={() => setCatF("all")}>All types</button>
          {MAINT_CATEGORIES.map((c) => (
            <button key={c} className={`chip${catF === c ? " on" : ""}`} onClick={() => setCatF(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="pcard" style={{ overflowX: "auto" }}>
        <table className="bill-table mnt-table">
          <thead>
            <tr><th>Request</th><th>Location</th><th>Requester</th><th>Priority</th><th>Status</th><th>Vendor</th><th className="num">Cost</th></tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={r.priority === "urgent" && r.status !== "completed" ? "row-alert" : ""}>
                <td>
                  <div className="mnt-title">{r.title}</div>
                  <div className="mnt-sub">{r.category} · {r.description}</div>
                </td>
                <td>{r.location}</td>
                <td>{r.requester}</td>
                <td><span className={`mnt-pri ${r.priority}`}>{r.priority}</span></td>
                <td>
                  <select className={`mnt-status ${r.status}`} value={r.status} onChange={(e) => setStatus(r.id, e.target.value as MaintStatus)}>
                    {MAINT_STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
                  </select>
                </td>
                <td><input className="mnt-input" value={r.vendor ?? ""} placeholder="—" onChange={(e) => setVendor(r.id, e.target.value)} /></td>
                <td className="num"><span className="mnt-dollar">$</span><input className="mnt-input cost" inputMode="decimal" value={r.costCents != null ? (r.costCents / 100).toString() : ""} placeholder="0" onChange={(e) => setCost(r.id, e.target.value)} /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7}><p className="portal-note">No requests match.</p></td></tr>}
          </tbody>
        </table>
      </div>
      <p className="portal-note">Tenant submissions arrive here as “New.” Status, vendor, and cost edits save instantly; completed costs roll into spend (and into accounting later). Demo data is simulated.</p>

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
