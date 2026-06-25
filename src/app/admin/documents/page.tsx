"use client";

import { useMemo, useState } from "react";
import { PROPERTY_DOCS, DOC_CATEGORIES, type DocType } from "@/lib/admin/documents";

const TYPE_LABEL: Record<DocType, string> = { pdf: "PDF", docx: "DOC", xlsx: "XLS" };

export default function DocumentsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [showUpload, setShowUpload] = useState(false);

  const query = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      PROPERTY_DOCS.filter(
        (d) =>
          (cat === "all" || d.category === cat) &&
          (!query || [d.title, d.category, d.note ?? ""].some((f) => f.toLowerCase().includes(query))),
      ),
    [query, cat],
  );

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Property documents</h1>
          <p className="portal-sub">{PROPERTY_DOCS.length} records on file · the building&apos;s permanent history</p>
        </div>
        <button className="btn btn-pop" onClick={() => setShowUpload((v) => !v)}>+ Upload document</button>
      </header>

      {showUpload && (
        <div className="pcard" style={{ borderStyle: "dashed" }}>
          <span className="pcard-eyebrow">Upload</span>
          <p className="portal-note" style={{ marginTop: 6 }}>
            Drag-and-drop upload lands here in production — files go to Supabase Storage (signed URLs), tagged with category and optionally linked to a unit or lease, and included in backups. This prototype ships with the real deal documents pre-loaded below.
          </p>
        </div>
      )}

      <div className="filters">
        <input className="hist-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents…" />
        <div className="filter-group">
          <button className={`chip${cat === "all" ? " on" : ""}`} onClick={() => setCat("all")}>All</button>
          {DOC_CATEGORIES.map((c) => (
            <button key={c} className={`chip${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="doc-grid">
        {filtered.map((d) => {
          const inner = (
            <>
              <span className={`doc-type ${d.type}`}>{TYPE_LABEL[d.type]}</span>
              <div className="doc-body">
                <div className="doc-title">{d.title}</div>
                <div className="doc-meta">{d.category} · {d.sizeLabel} · {d.dateLabel}</div>
                {d.note && <div className="doc-note">{d.note}</div>}
              </div>
              <span className={d.external ? "doc-ext" : "doc-open"}>{d.external ? "External" : "Open ↗"}</span>
            </>
          );
          return d.external ? (
            <div key={d.id} className="doc-card external" title="Stored externally — available in Supabase Storage on deploy">{inner}</div>
          ) : (
            <a key={d.id} href={`/property-docs/${d.file}`} target="_blank" rel="noopener noreferrer" className="doc-card">{inner}</a>
          );
        })}
        {filtered.length === 0 && <p className="portal-note">No documents match.</p>}
      </div>

      <p className="portal-note">Prototype: documents are served from the app. In production they live in Supabase Storage with versioning, per-document access, and backup. Categories &amp; metadata are editable.</p>
    </div>
  );
}
