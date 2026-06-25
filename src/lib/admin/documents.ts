/**
 * Property document vault — the building's permanent record (survey, appraisal,
 * inspection/diligence, title & closing, warranties, tax, floor plans, corporate).
 * Seeded from the real deal documents (served from /public/property-docs).
 *
 * PROTOTYPE NOTE: files live in /public for the demo. In production these move to
 * Supabase Storage with signed URLs + an `documents` table (uploader, version,
 * category, linked space/lease), and are included in backups.
 */

export type DocType = "pdf" | "docx" | "xlsx";

export type PropertyDoc = {
  id: string;
  title: string;
  category: DocCategory;
  file: string; // filename under /property-docs/
  type: DocType;
  sizeLabel: string;
  dateLabel: string; // vintage / context — editable
  note?: string;
  external?: boolean; // not served in the prototype (kept lean) — lives in Storage on deploy
};

export const DOC_CATEGORIES = [
  "Appraisal & Valuation",
  "Survey & Site",
  "Due Diligence & Environmental",
  "Title, Contract & Closing",
  "Warranties",
  "Tax",
  "Floor Plans",
  "Corporate & Legal",
  "Financials",
] as const;
export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const PROPERTY_DOCS: PropertyDoc[] = [
  { id: "appraisal", title: "Appraisal Report", category: "Appraisal & Valuation", file: "appraisal-report.pdf", type: "pdf", sizeLabel: "38 MB", dateLabel: "Diligence", external: true, note: "Stored externally — move to Supabase Storage upon deploy." },

  { id: "site-plan", title: "Site Plan / Survey — Madison Office", category: "Survey & Site", file: "site-plan-madison-office.pdf", type: "pdf", sizeLabel: "5.8 MB", dateLabel: "Apr 2026", note: "Scanned site drawings." },
  { id: "parcel-map", title: "Property Parcel / Ownership Map", category: "Survey & Site", file: "parcel-tax-map.pdf", type: "pdf", sizeLabel: "6.7 MB", dateLabel: "On file", note: "Tri-State Consulting tax parcel map (not a legal survey)." },

  { id: "dd-memo", title: "Commercial Building Due Diligence Memo", category: "Due Diligence & Environmental", file: "due-diligence-memo.pdf", type: "pdf", sizeLabel: "11 KB", dateLabel: "Diligence" },
  { id: "dd-summary", title: "Due Diligence Conversation Summary", category: "Due Diligence & Environmental", file: "due-diligence-summary.pdf", type: "pdf", sizeLabel: "133 KB", dateLabel: "Diligence" },
  { id: "astm", title: "ASTM Phase I ESA Agreement (signed)", category: "Due Diligence & Environmental", file: "astm-esa-agreement.pdf", type: "pdf", sizeLabel: "227 KB", dateLabel: "Diligence", note: "Environmental site assessment engagement." },

  { id: "purchase-contract", title: "Commercial Purchase Contract (F47, v13)", category: "Title, Contract & Closing", file: "purchase-contract.pdf", type: "pdf", sizeLabel: "112 KB", dateLabel: "2025" },
  { id: "addendum-1", title: "Addendum — Extension of Inspection & Closing", category: "Title, Contract & Closing", file: "addendum-inspection-closing.docx", type: "docx", sizeLabel: "9 KB", dateLabel: "2025" },
  { id: "amend-1", title: "First Amendment — Assignment to 25 Woodgreen LLC", category: "Title, Contract & Closing", file: "first-amendment-assignment.docx", type: "docx", sizeLabel: "10 KB", dateLabel: "Jun 2026" },
  { id: "addendum-2", title: "Second Addendum — Assignment to 25 Woodgreen LLC", category: "Title, Contract & Closing", file: "second-addendum-assignment.docx", type: "docx", sizeLabel: "10 KB", dateLabel: "Jun 2026" },
  { id: "existing-lease", title: "Existing Lease (in-place tenant)", category: "Title, Contract & Closing", file: "existing-lease.pdf", type: "pdf", sizeLabel: "10.8 MB", dateLabel: "In place", external: true, note: "Stored externally — move to Supabase Storage upon deploy." },

  { id: "foundation-warranty", title: "Foundation Warranty Certificate", category: "Warranties", file: "foundation-warranty.pdf", type: "pdf", sizeLabel: "15.7 MB", dateLabel: "On file", external: true, note: "Stored externally — move to Supabase Storage upon deploy." },

  { id: "property-tax", title: "Madison County Property Tax (current)", category: "Tax", file: "property-tax.pdf", type: "pdf", sizeLabel: "124 KB", dateLabel: "2026" },

  { id: "floor-plans-combined", title: "Woodgreen Floor Plans (combined)", category: "Floor Plans", file: "floor-plans-combined.pdf", type: "pdf", sizeLabel: "907 KB", dateLabel: "On file" },
  { id: "current-floor-plans", title: "25 Woodgreen — Current Floor Plans", category: "Floor Plans", file: "current-floor-plans.pdf", type: "pdf", sizeLabel: "99 KB", dateLabel: "Jun 2026" },

  { id: "operating-agreement", title: "25 Woodgreen LLC — Operating Agreement", category: "Corporate & Legal", file: "operating-agreement.docx", type: "docx", sizeLabel: "17 KB", dateLabel: "2026" },
  { id: "license-draft", title: "License Agreement (DRAFT)", category: "Corporate & Legal", file: "license-agreement-draft.docx", type: "docx", sizeLabel: "20 KB", dateLabel: "Draft" },

  { id: "7yr-analysis", title: "25 Woodgreen — 7-Year Analysis", category: "Financials", file: "7yr-analysis.xlsx", type: "xlsx", sizeLabel: "29 KB", dateLabel: "2026" },
];

/* ── editable display labels (rename without touching the stored file) ── */
const TITLES_KEY = "wg_doc_titles";

export function loadDocTitles(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(TITLES_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveDocTitle(id: string, title: string) {
  if (typeof window === "undefined") return;
  try {
    const all = loadDocTitles();
    if (title.trim()) all[id] = title.trim();
    else delete all[id];
    window.localStorage.setItem(TITLES_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("wg-doc-titles"));
  } catch {
    /* ignore */
  }
}

export function docsByCategory(): { category: DocCategory; docs: PropertyDoc[] }[] {
  return DOC_CATEGORIES.map((category) => ({
    category,
    docs: PROPERTY_DOCS.filter((d) => d.category === category),
  })).filter((g) => g.docs.length);
}
