"use client";

import { useEffect, useMemo, useState } from "react";
import { PROPERTY_DOCS, DOC_CATEGORIES, loadDocTitles, saveDocTitle, type DocType, type PropertyDoc } from "@/lib/admin/documents";

const TYPE_LABEL: Record<DocType, string> = { pdf: "PDF", docx: "DOC", xlsx: "XLS" };

export default function DocumentsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [viewing, setViewing] = useState<PropertyDoc | null>(null);

  useEffect(() => {
    setTitles(loadDocTitles());
    const refresh = () => setTitles(loadDocTitles());
    window.addEventListener("wg-doc-titles", refresh);
    return () => window.removeEventListener("wg-doc-titles", refresh);
  }, []);

  const titleOf = (d: PropertyDoc) => titles[d.id] ?? d.title;

  const query = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      PROPERTY_DOCS.filter(
        (d) =>
          (cat === "all" || d.category === cat) &&
          (!query || [titleOf(d), d.category, d.note ?? ""].some((f) => f.toLowerCase().includes(query))),
      ),
    [query, cat, titles],
  );

  const startRename = (d: PropertyDoc) => {
    setEditing(d.id);
    setEditVal(titleOf(d));
  };
  const commitRename = (id: string) => {
    saveDocTitle(id, editVal);
    setTitles(loadDocTitles());
    setEditing(null);
  };

  const openDoc = (d: PropertyDoc) => {
    if (d.external) return;
    if (d.type === "pdf") setViewing(d);
    else window.open(`/property-docs/${d.file}`, "_blank");
  };

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
        {filtered.map((d) => (
          <div key={d.id} className={`doc-card${d.external ? " external" : " clickable"}`} onClick={() => editing !== d.id && openDoc(d)}>
            <span className={`doc-type ${d.type}`}>{TYPE_LABEL[d.type]}</span>
            <div className="doc-body">
              {editing === d.id ? (
                <input
                  className="doc-rename"
                  value={editVal}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditVal(e.target.value)}
                  onBlur={() => commitRename(d.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitRename(d.id); if (e.key === "Escape") setEditing(null); }}
                />
              ) : (
                <div className="doc-title">{titleOf(d)}</div>
              )}
              <div className="doc-meta">{d.category} · {d.sizeLabel} · {d.dateLabel}</div>
              {d.note && <div className="doc-note">{d.note}</div>}
            </div>
            <div className="doc-actions">
              <button className="doc-rename-btn" title="Rename" onClick={(e) => { e.stopPropagation(); startRename(d); }}>✎</button>
              <span className={d.external ? "doc-ext" : "doc-open"}>{d.external ? "External" : d.type === "pdf" ? "View" : "Open ↗"}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="portal-note">No documents match.</p>}
      </div>

      <p className="portal-note">Click a PDF to view it inline; click ✎ to rename (label only — the stored file is untouched). In production documents live in Supabase Storage with versioning, per-document access, and backup.</p>

      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="doc-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="doc-viewer-head">
              <span className="doc-viewer-title">{titleOf(viewing)}</span>
              <div className="doc-viewer-actions">
                <a className="linklike" href={`/property-docs/${viewing.file}`} target="_blank" rel="noopener noreferrer">Open in new tab ↗</a>
                <button className="modal-x" onClick={() => setViewing(null)}>×</button>
              </div>
            </div>
            <iframe className="doc-frame" src={`/property-docs/${viewing.file}`} title={titleOf(viewing)} />
          </div>
        </div>
      )}
    </div>
  );
}
