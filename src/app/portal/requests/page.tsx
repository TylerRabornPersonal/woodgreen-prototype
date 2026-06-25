"use client";

import { useEffect, useState } from "react";
import { usePortal } from "@/components/portal/PortalProvider";
import {
  loadMaintenance,
  addRequest,
  MAINT_CATEGORIES,
  STATUS_LABEL,
  type MaintRequest,
  type MaintCategory,
  type MaintPriority,
} from "@/lib/admin/maintenance";

export default function TenantRequestsPage() {
  const { tenant, license } = usePortal();
  const [list, setList] = useState<MaintRequest[]>([]);
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState<MaintCategory>("General");
  const [office, setOffice] = useState(license.offices[0]?.code ?? "Common area");
  const [priority, setPriority] = useState<MaintPriority>("normal");
  const [desc, setDesc] = useState("");
  const [flash, setFlash] = useState(false);

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

  const mine = list.filter((r) => r.requester === tenant.orgName).sort((a, b) => b.createdISO.localeCompare(a.createdISO));

  const submit = () => {
    if (!desc.trim()) return;
    const title = `${category} — ${office}`;
    setList(
      addRequest({
        title,
        category,
        location: office,
        priority,
        requester: tenant.orgName,
        description: desc.trim(),
      }),
    );
    setDesc("");
    setPriority("normal");
    setFlash(true);
    setTimeout(() => setFlash(false), 3000);
  };

  if (!ready) return <p className="portal-note">Loading…</p>;

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Maintenance &amp; requests</h1>
          <p className="portal-sub">Report an issue — building management is notified right away</p>
        </div>
      </header>

      {flash && <div className="flash">✓ Request submitted — we&apos;ll be in touch.</div>}

      <div className="portal-grid two">
        <div className="pcard">
          <span className="pcard-eyebrow">Submit a request</span>
          <div className="book-row">
            <div className="field"><label>Type</label><select value={category} onChange={(e) => setCategory(e.target.value as MaintCategory)}>{MAINT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Location</label><select value={office} onChange={(e) => setOffice(e.target.value)}>{license.offices.map((o) => <option key={o.code}>{o.code}</option>)}<option>Common area</option></select></div>
          </div>
          <div className="field"><label>Priority</label>
            <div className="seg">
              {(["low", "normal", "high", "urgent"] as MaintPriority[]).map((p) => (
                <button key={p} className={priority === p ? "on" : ""} onClick={() => setPriority(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div className="field"><label>What&apos;s going on?</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="Describe the issue…" /></div>
          <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center" }} disabled={!desc.trim()} onClick={submit}>Submit request</button>
          <p className="portal-note" style={{ textAlign: "center" }}>Urgent safety issues? Call the building line directly.</p>
        </div>

        <div className="pcard">
          <span className="pcard-eyebrow">Your requests</span>
          {mine.length ? (
            <div className="req-list">
              {mine.map((r) => (
                <div className="req" key={r.id}>
                  <div>
                    <div className="req-title">{r.title}</div>
                    <div className="req-meta">{r.location} · {r.priority} · submitted {r.createdISO}</div>
                    {r.description && <div className="req-desc">{r.description}</div>}
                  </div>
                  <span className={`mnt-status-badge ${r.status}`}>{STATUS_LABEL[r.status]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="portal-note">No requests yet. Submit one and it&apos;ll show here with live status.</p>
          )}
        </div>
      </div>
    </div>
  );
}
