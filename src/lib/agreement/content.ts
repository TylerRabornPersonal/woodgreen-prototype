/**
 * 25 Woodgreen Coworking License Agreement — structured from the real DRAFT
 * (25_Woodgreen_License_Agreement_DRAFT.docx). Used to render the agreement in
 * the signing flow and the tenant portal.
 *
 * NOTE: §2.1 in the source .docx lists 12/18/24-month terms; the app/calculator
 * uses 12/24/36. The rendered §2.1 below is aligned to the app (12/24/36) — the
 * source .docx still needs reconciling to match (or vice-versa).
 */

export type Section = { n: string; title: string; body: string[] };

export const AGREEMENT_SECTIONS: Section[] = [
  {
    n: "",
    title: "Recitals",
    body: [
      "This Coworking License Agreement (the “Agreement”) is made effective as of the Commencement Date set forth on Schedule A (the “Effective Date”) by and between Licensor, 25 Woodgreen LLC, a Mississippi limited liability company at 25 Woodgreen Place, Madison, Mississippi 39110, and Licensee, the individual or entity identified on Schedule A.",
      "WHEREAS, Licensor owns and operates a shared workspace facility located at 25 Woodgreen Place (the “Building”); WHEREAS, Licensee desires a revocable license to use designated office space and shared amenities; and WHEREAS, the Parties intend that this Agreement create a license — and not a lease, tenancy, easement, or any other interest in real property. NOW, THEREFORE, the Parties agree as follows:",
    ],
  },
  {
    n: "1",
    title: "Grant of License; Nature of Relationship",
    body: [
      "1.1 License Grant. Licensor grants Licensee a revocable, non-exclusive, non-transferable license to use the office space and any bundled adjacent open-area space identified on Schedule A (the “Licensed Premises”), together with non-exclusive use of designated common areas, restrooms, kitchen, and shared amenities (the “Shared Facilities”).",
      "1.2 No Lease; No Tenancy. The Agreement creates a license; Licensee receives no estate, easement, or possessory interest; no landlord-tenant relationship is created; and Mississippi landlord-tenant law (incl. Miss. Code Ann. § 89-7-1 et seq.) shall not apply. Licensor retains legal possession and control of the Building.",
      "1.3 Bundled Configurations. Where Schedule A identifies a bundle of two or more offices and/or open-area space, the Licensed Premises shall be a single combined license. Licensee may not sublicense, share, or assign any portion of a bundle.",
    ],
  },
  {
    n: "2",
    title: "Term",
    body: [
      "2.1 Initial Term. The initial term shall be twelve (12), eighteen (18), twenty-four (24), thirty (30), or thirty-six (36) months as elected by Licensee on Schedule A (the “Initial Term”), commencing on the Commencement Date and ending at 11:59 p.m. Central Time on the last day of the Initial Term.",
      "2.2 Automatic Renewal. Unless either Party gives written notice of non-renewal at least sixty (60) (i.e., the 60-day mark) days before the end of the then-current term, this Agreement automatically renews for a successive term equal in length to the Initial Term (each, a “Renewal Term”). The monthly License Fee for each Renewal Term shall be the greater of (a) one hundred three percent (103%) of the then-current monthly License Fee or (b) the Licensor’s then-current published Fee Schedule for the licensed offices, furnishing, and term. Licensor will send Licensee a renewal reminder at least ninety (90) days before the end of the term; Licensee may instead elect month-to-month under §2.3 or non-renewal by the notice deadline.",
      "2.3 Holdover / Month-to-Month. If Licensee elects month-to-month, or continues use after expiration without a renewal or new written agreement, the License shall be month-to-month at one hundred twenty-five percent (125%) of the then-current monthly License Fee, terminable by either Party on thirty (30) days’ written notice.",
    ],
  },
  {
    n: "3",
    title: "License Fees and Payments",
    body: [
      "3.1 License Fee. Licensee shall pay the monthly License Fee set forth on Schedule A and the then-current Fee Schedule. No increase shall apply during the Initial Term except as stated on Schedule A.",
      "3.2 Payment Method. The License Fee, conference overage, furniture fees, and other charges are charged in advance on the first day of each calendar month via the payment method on file in Licensor’s member platform.",
      "3.3 Security Deposit. Upon execution, Licensee shall deliver a security deposit equal to one (1) month’s License Fee, held without interest and applicable against unpaid amounts or damage.",
      "3.4 Late Charges; Returned Payments. Amounts not paid within five (5) days accrue a 5% late charge. Returned/failed payments incur a $35.00 fee plus processor charges.",
      "3.5 Taxes. Licensee is responsible for any sales, use, or other taxes assessed on the License Fee or services.",
    ],
  },
  {
    n: "4",
    title: "Licensed Premises; Included Services",
    body: [
      "4.1 24/7 Keycard Access. Licensee is issued keycard or smart-lock credentials providing 24/7 access, subject to suspension upon non-payment or breach.",
      "4.2 Included Services. The License Fee includes Wi-Fi at published speeds; HVAC, electricity, and water; janitorial of the Shared Facilities; common-area coffee, water, and basic kitchen amenities; mail and package receipt at reception; and included conference room hours per Section 5.",
      "4.3 Excluded Services. Telephone service, off-site printing, dedicated bandwidth, IT support, private storage, and any service not expressly listed are not included and, if available, are charged per the Fee Schedule.",
    ],
  },
  {
    n: "5",
    title: "Conference Room Use",
    body: [
      "5.1 Member Allotment. Each private-office Licensee is entitled to the included conference hours per month on the Fee Schedule. Included hours do not roll over and have no cash value.",
      "5.2 Member Overage. Use beyond the allotment is billed at the member overage rate on the Fee Schedule.",
      "5.3 Non-Member Rate. Reservations by non-Licensees are billed at the materially higher non-member hourly rate.",
      "5.4 Booking. All reservations are made through the member platform, subject to availability and posted cancellation rules.",
    ],
  },
  {
    n: "6",
    title: "Furnishings",
    body: [
      "6.1 Default Unfurnished. Unless elected on Schedule A, the Licensed Premises are unfurnished and Licensee furnishes them at its own expense.",
      "6.2 Optional Furniture Package. If elected on Schedule A (per Schedule D), Licensor procures and installs the furniture and the monthly License Fee increases by the furniture package fee for the Initial Term. Furniture remains Licensor’s property unless stated otherwise.",
    ],
  },
  {
    n: "7",
    title: "Permitted Use; Restrictions",
    body: [
      "7.1 Permitted Use. The Licensed Premises shall be used solely for general office and professional business purposes consistent with a Class A shared workspace.",
      "7.2 Prohibited Uses. No residential use or overnight stays; no retail, manufacturing, warehousing, or regular walk-in customers without consent; no hazardous materials, firearms, or controlled substances; no unlawful activity or insurance/occupancy violations; and no noise, odor, or disturbance materially interfering with others.",
      "7.3 House Rules. Licensee shall comply with the House Rules attached as Schedule B, as amended on reasonable notice.",
    ],
  },
  {
    n: "8",
    title: "Insurance",
    body: [
      "8.1 Licensee Coverage. Licensee shall maintain commercial general liability of not less than $1,000,000 per occurrence / $2,000,000 aggregate, personal property and business-interruption coverage at full replacement value, and workers’ compensation where applicable.",
      "8.2 Additional Insured. Licensee shall name “25 Woodgreen LLC” as additional insured and furnish a certificate on request.",
      "8.3 Licensee Property at Licensee’s Risk. All Licensee property in the Building is at Licensee’s sole risk; Licensor is not responsible for loss, theft, or damage from any cause.",
    ],
  },
  {
    n: "9",
    title: "Indemnification",
    body: [
      "9.1 By Licensee. Licensee shall defend, indemnify, and hold harmless Licensor and its members, managers, officers, employees, and agents from claims arising out of Licensee’s use of the Building, the acts/omissions of Licensee’s people, or any breach by Licensee.",
      "9.2 Mutual Limitation. Neither Party is liable for indirect, consequential, special, or punitive damages. Licensor’s aggregate liability shall not exceed the License Fees paid in the three (3) months preceding the claim.",
    ],
  },
  {
    n: "10",
    title: "Personal Guaranty (Entity Licensees)",
    body: [
      "If Licensee is a business entity, this Agreement is conditioned on execution of the Personal Guaranty attached as Schedule C by a principal, who is jointly and severally liable with Licensee for all monetary obligations.",
    ],
  },
  {
    n: "11",
    title: "Maintenance; Alterations",
    body: [
      "11.1 Licensor Maintenance. Licensor maintains the structural elements, Building systems, and Shared Facilities in good operating condition.",
      "11.2 Licensee Care. Licensee keeps the Licensed Premises clean and free of damage beyond ordinary wear and promptly reports maintenance issues.",
      "11.3 No Alterations. No painting, drilling, affixing, installing, or modifying without Licensor’s prior written consent; unauthorized alterations may be removed at Licensee’s expense.",
    ],
  },
  {
    n: "12",
    title: "Default; Remedies",
    body: [
      "12.1 Events of Default. (a) failure to pay within five (5) days after notice; (b) non-monetary breach uncured within ten (10) days after notice; (c) acts creating imminent risk of harm; or (d) bankruptcy/insolvency/dissolution of Licensee.",
      "12.2 Licensor Remedies. Upon Default, Licensor may suspend access credentials, remove Licensee property to storage at Licensee’s expense, terminate, and recover all amounts due including liquidated damages. Because this is a license, no judicial eviction is required to terminate access.",
      "12.3 Cumulative Remedies. All remedies are cumulative and not exclusive.",
    ],
  },
  {
    n: "13",
    title: "Early Termination by Licensee; Liquidated Damages",
    body: [
      "If Licensee terminates before the end of the Initial Term other than for Licensor’s uncured material breach, Licensee shall immediately pay, as liquidated damages and not a penalty, an amount equal to all License Fees that would have been due for the remainder of the Initial Term plus any previously discounted amounts. The Parties agree actual damages are difficult to calculate and this is a reasonable estimate.",
    ],
  },
  {
    n: "14",
    title: "Termination by Licensor",
    body: [
      "14.1 For Cause. Licensor may terminate immediately upon an uncured Default, or immediately without cure for §12.1(c) or (d).",
      "14.2 Without Cause. Licensor may terminate on sixty (60) days’ notice, refunding prepaid License Fees for periods after termination and returning the Security Deposit (less lawful deductions).",
    ],
  },
  {
    n: "15",
    title: "Licensor Relocation Right",
    body: [
      "On not less than thirty (30) days’ notice, Licensor may relocate Licensee to comparable space of substantially equivalent square footage and quality, at Licensor’s expense for moving Licensee’s property; the License Fee shall not increase during the Initial Term as a result.",
    ],
  },
  {
    n: "16",
    title: "No Assignment; No Sublicensing",
    body: [
      "Licensee shall not assign, transfer, sublicense, or share any rights without Licensor’s prior written consent, which may be withheld in its sole discretion. Any attempted assignment in violation is void.",
    ],
  },
  {
    n: "17",
    title: "Force Majeure",
    body: [
      "Neither Party is liable for any failure or delay (other than payment of money) caused by acts of God, natural disaster, fire, flood, war, terrorism, civil unrest, governmental order, epidemic or pandemic, utility outage, or other event beyond reasonable control.",
    ],
  },
  {
    n: "18",
    title: "Notices",
    body: [
      "Notices shall be in writing and deemed given when delivered by hand, one business day after deposit with an overnight courier, or when sent by email to the address on file in the member platform with delivery confirmation. Notices to Licensor: 25 Woodgreen LLC, 25 Woodgreen Place, Madison, Mississippi 39110.",
    ],
  },
  {
    n: "19",
    title: "Electronic Signatures; Platform Delivery",
    body: [
      "This Agreement and any amendment may be executed by electronic signature, including via Licensor’s member platform, with the same legal effect as ink signatures under the Mississippi Uniform Electronic Transactions Act (Miss. Code Ann. § 75-12-1 et seq.) and the federal E-SIGN Act (15 U.S.C. § 7001 et seq.). Licensee consents to electronic delivery of this Agreement, the Fee Schedule, the House Rules, and notices.",
    ],
  },
  {
    n: "20",
    title: "Governing Law; Venue; Waiver of Jury Trial",
    body: [
      "This Agreement is governed by Mississippi law. The Parties consent to exclusive jurisdiction and venue in the state and federal courts of Madison County, Mississippi. EACH PARTY KNOWINGLY AND VOLUNTARILY WAIVES ANY RIGHT TO A JURY TRIAL.",
    ],
  },
  {
    n: "21",
    title: "General Provisions",
    body: [
      "Entire Agreement (with Schedules A–D, Fee Schedule, and House Rules); amendments only in writing signed (incl. electronically) by both Parties; severability; no waiver unless in writing; counterparts; and the Parties are independent contractors (no partnership, joint venture, agency, or employment).",
    ],
  },
];

export const HOUSE_RULES: { group: string; items: string[] }[] = [
  {
    group: "Access and Security",
    items: [
      "Keycard / smart-lock credentials are personal and may not be shared, duplicated, or transferred.",
      "Report lost credentials immediately; replacement fees apply.",
      "After-hours guests must be escorted at all times.",
      "Do not prop open exterior doors or disable any security device.",
    ],
  },
  {
    group: "Common Areas and Conduct",
    items: [
      "Keep noise to a level that lets others work; take calls in your office or a phone room.",
      "Clean up after yourself in the kitchen and conference rooms.",
      "No smoking, vaping, or cannabis anywhere in the Building.",
      "No pets except service animals as required by law.",
      "Alcohol only at Licensor-approved events.",
    ],
  },
  {
    group: "Conference Room",
    items: [
      "Book through the member platform; first-come, first-served if not booked.",
      "Cancel at least two (2) hours in advance to avoid being charged.",
      "Leave the room as you found it.",
    ],
  },
  {
    group: "Mail and Deliveries",
    items: [
      "Licensor accepts mail and small packages during business hours; not responsible for items left beyond 72 hours.",
    ],
  },
];

export const GUARANTY_TEXT =
  "FOR VALUE RECEIVED, and in consideration of 25 Woodgreen LLC entering into the Agreement with the entity identified on Schedule A, the undersigned individual (the “Guarantor”) absolutely, unconditionally, and irrevocably guarantees the full and prompt payment and performance of all monetary obligations of Licensee, including License Fees, late charges, overage charges, liquidated damages, and enforcement costs and reasonable attorneys’ fees. This is a guaranty of payment and performance, not of collection. Governed by Mississippi law; remains in effect until all obligations are fully satisfied.";

/* --- Schedule A data shape + builder --- */

export type ScheduleA = {
  licenseNumber: string;
  legalName: string;
  entityType: string;
  primaryContact: string;
  primaryEmail: string;
  premises: string; // "P1, P2, P3"
  sqft: number;
  termMonths: number;
  commencement: string;
  expiration: string;
  baseFeeCents: number;
  furnitureFeeCents: number;
  totalFeeCents: number;
  furnished: boolean;
  confHours: number;
  overageStdCents: number;
  overageBoardroomCents: number;
  depositCents: number;
  isEntity: boolean;
};
