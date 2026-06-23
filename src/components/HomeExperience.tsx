"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FloorPlan from "./FloorPlan";
import type { Floor, Office, AddOn } from "@/lib/inventory";
import { quote, officeListPrice, addOnListPrice, money, type Term } from "@/lib/engine";

export default function HomeExperience({
  floors,
  officesByFloor,
  addOns,
}: {
  floors: Floor[];
  officesByFloor: Record<string, Office[]>;
  addOns: AddOn[];
}) {
  const router = useRouter();
  const allOffices = useMemo(() => Object.values(officesByFloor).flat(), [officesByFloor]);

  const [activeFloor, setActiveFloor] = useState(floors[0]?.id);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [furnished, setFurnished] = useState(false);
  const [term, setTerm] = useState<Term>(12);
  const [addonSel, setAddonSel] = useState<Set<string>>(new Set());

  const floor = floors.find((f) => f.id === activeFloor) ?? floors[0];

  const toggleOffice = (slug: string) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(slug) ? n.delete(slug) : n.add(slug);
      return n;
    });
  const toggleAddon = (slug: string) =>
    setAddonSel((p) => {
      const n = new Set(p);
      n.has(slug) ? n.delete(slug) : n.add(slug);
      return n;
    });

  const chosenOffices = allOffices.filter((o) => selected.has(o.slug));
  const chosenAddons = addOns.filter((a) => addonSel.has(a.slug));

  const q = useMemo(
    () =>
      quote({
        officeBaseRates: chosenOffices.map((o) => o.rate),
        addOnRates: chosenAddons.map((a) => a.rate),
        furnished,
        term,
      }),
    [chosenOffices, chosenAddons, furnished, term],
  );

  const reserve = () => {
    if (!chosenOffices.length) return;
    const params = new URLSearchParams({
      offices: chosenOffices.map((o) => o.slug).join(","),
      furnished: furnished ? "1" : "0",
      term: String(term),
    });
    if (chosenAddons.length) params.set("addons", chosenAddons.map((a) => a.slug).join(","));
    router.push(`/checkout?${params.toString()}`);
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const pct = (n: number) => `−${(n * 100).toFixed(0)}%`;

  return (
    <div className="home">
      {/* ── HERO ── */}
      <section className="home-hero">
        <div className="wrap">
          <div className="eyebrow on-dark">Executive suites · Madison, Mississippi</div>
          <h1 className="hero-h">A workspace with <em>provenance.</em></h1>
          <p className="hero-deck">
            Private offices and meeting space in a restored Madison landmark, available by the day,
            the month, or the year. The calm of a Southern library, with the service of a modern
            workplace.
          </p>
          <div className="hero-actions">
            <button className="btn btn-pop" onClick={() => scrollTo("offices")}>Select your office</button>
            <button className="btn btn-ghost on-dark" onClick={() => scrollTo("visit")}>Book a tour</button>
          </div>
          <div className="hero-note">Now pre-leasing · opening 2026</div>
        </div>
        <div className="brass-rule" />
      </section>

      {/* ── OFFICE SELECTOR ── */}
      <section id="offices" className="home-section sec-parchment">
        <div className="wrap">
          <span className="eyebrow">Availability</span>
          <h2 className="sec-h">Select your office.</h2>
          <p className="sec-lead">
            Browse the building floor by floor and select the offices you want. Pick as many as you
            like across any floor; your running total sits at the bottom of the screen, and the full
            breakdown is in the calculator just below.
          </p>

          <div className="switcher">
            {floors.map((f) => (
              <button key={f.id} className={f.id === activeFloor ? "on" : ""} onClick={() => setActiveFloor(f.id)}>
                {f.short}
              </button>
            ))}
          </div>

          <FloorPlan offices={officesByFloor[floor.id] ?? []} selected={selected} onToggle={toggleOffice} />
        </div>
      </section>

      {/* ── YOUR PACKAGE / CALCULATOR (directly below the selector) ── */}
      <section id="calculator" className="home-section sec-cream">
        <div className="wrap">
          <span className="eyebrow">Your package</span>
          <h2 className="sec-h">Build your price.</h2>
          <p className="sec-lead">Adjust the term, furnishing, and add-ons. Discounts update live as you go, and your offices come from the selections above.</p>

          <div className="calc-grid">
            {/* controls */}
            <div className="card panel">
              <span className="ctl-label">Furnishing (all offices)</span>
              <div className="seg">
                <button className={!furnished ? "on" : ""} onClick={() => setFurnished(false)}>Unfurnished</button>
                <button className={furnished ? "on" : ""} onClick={() => setFurnished(true)}>Furnished</button>
              </div>

              <span className="ctl-label">License term</span>
              <div className="seg brass">
                {([12, 24, 36] as Term[]).map((t) => (
                  <button key={t} className={term === t ? "on" : ""} onClick={() => setTerm(t)}>{t} months</button>
                ))}
              </div>

              <span className="ctl-label">Selected offices</span>
              {chosenOffices.length ? (
                <div className="office-lines">
                  {chosenOffices.map((o) => (
                    <div className="kv" key={o.slug}>
                      <span className="k">{o.code}{o.name ? ` · ${o.name}` : ""} <span style={{ color: "var(--drab)" }}>· {o.sqft} SF</span></span>
                      <span className="v">
                        {money(officeListPrice(o.rate, furnished))}/mo
                        <button className="linex" onClick={() => toggleOffice(o.slug)} aria-label={`Remove ${o.code}`}>×</button>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="placeholder-note">No offices selected yet. <button className="linklike" onClick={() => scrollTo("offices")}>Pick some on the plan ↑</button></p>
              )}

              <span className="ctl-label">Add storage, conference &amp; more</span>
              <div className="addon-list">
                {addOns.map((a) => {
                  const sel = addonSel.has(a.slug);
                  return (
                    <div key={a.slug} className={`addon${sel ? " sel" : ""}`} onClick={() => toggleAddon(a.slug)}>
                      <div><div className="nm">{a.name}</div><div className="meta">{a.sqft} SF · flat rate</div></div>
                      <div className="pr">{money(addOnListPrice(a.rate))}<span style={{ fontSize: 11, color: "var(--drab)", fontWeight: 400, fontStyle: "normal" }}>/mo</span></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* summary */}
            <div className="card panel pricebox">
              <div className="kv"><span className="k">Offices</span><span className="v">{q.officeCount}</span></div>
              <div className="kv"><span className="k">Package gross</span><span className="v">{money(q.grossMonthly)}/mo</span></div>
              <div style={{ margin: "12px 0 6px" }}>
                <div className="disc-row"><span>Multi-office {q.capped ? "(cap 10%)" : ""}</span><span className="v">{pct(q.multiDiscount)}</span></div>
                <div className="disc-row"><span>Term · {term}mo</span><span className="v">{pct(q.termDiscount)}</span></div>
              </div>
              <div className="kv"><span className="k">Conference hrs / mo</span><span className="v">{q.confHours}</span></div>
              <div style={{ marginTop: 16 }}>
                <div className="big">{money(q.netMonthly)}<small>/mo</small> <span className="pill">{pct(q.totalDiscount)}</span></div>
                <div className="yr">{money(q.annual)} / yr · {money(q.contractValue)} over {term} months</div>
              </div>
              <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} disabled={!chosenOffices.length} onClick={reserve}>
                Reserve {q.officeCount > 1 ? "these offices" : q.officeCount === 1 ? "this office" : "your office"} →
              </button>
              <p className="placeholder-note" style={{ textAlign: "center" }}>List price, a starting point for negotiation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE ADDRESS / STORY ── */}
      <section id="address" className="home-section sec-parchment">
        <div className="wrap">
          <span className="eyebrow">The address</span>
          <h2 className="sec-h">An address that means something.</h2>
          <p className="sec-lead">
            25 Woodgreen is a restored landmark in Madison: brick, brass, and live oaks, reimagined
            as private offices and meeting space. We didn&apos;t build a generic floor of
            workstations. We took a building with character and gave it the service of a modern
            workplace, with a real office, a real address, and a front door you&apos;re proud to give a client.
          </p>
          <div className="principle-grid">
            <div className="principle"><span className="pn">i.</span><h4>Rooted</h4><p>Of this place. We lead with the building, the brick, the live oaks, the address. Not generic coworking gloss.</p></div>
            <div className="principle"><span className="pn">ii.</span><h4>Considered</h4><p>Every detail is chosen. Brass, not chrome. Warm light, not fluorescent. Restraint reads as confidence.</p></div>
            <div className="principle"><span className="pn">iii.</span><h4>Hospitable</h4><p>A workplace that behaves like a good host: easy to join, easy to use, generous with the small things.</p></div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="home-section sec-cream">
        <div className="wrap">
          <span className="eyebrow">How it works</span>
          <h2 className="sec-h">Choose your office in three steps.</h2>
          <div className="steps-grid">
            <div className="step"><span className="step-n">01</span><h4>Select</h4><p>Browse the building floor by floor and pick the offices you want, one or a whole section. Availability and pricing are right there on the plan.</p></div>
            <div className="step"><span className="step-n">02</span><h4>Configure</h4><p>Set your term and furnishing, and add storage or a conference room. Your price updates as you go, with multi-office and term discounts applied automatically.</p></div>
            <div className="step"><span className="step-n">03</span><h4>Reserve</h4><p>Submit your request and we&apos;ll prepare the license agreement. No long lease, no runaround, just a clear price and a move-in date.</p></div>
          </div>
        </div>
      </section>

      {/* ── MEETING ROOMS & AMENITIES ── */}
      <section className="home-section sec-parchment">
        <div className="wrap">
          <span className="eyebrow">Beyond the office</span>
          <h2 className="sec-h">Rooms for the work between the work.</h2>
          <p className="sec-lead">
            Every suite comes with a monthly bank of conference hours in our shared meeting rooms.
            Book a boardroom for the morning, a small room for a call, and leave it as you found it.
            Beyond the desk: reception that greets your clients by name, fast Wi-Fi, secure access,
            and the quiet of a building made to be worked in.
          </p>
          <div className="amenity-grid">
            {[
              "Shared conference & boardrooms, included hours",
              "Staffed reception & client greeting",
              "Secure 24/7 access",
              "Business-grade Wi-Fi & print",
              "Mail & package handling",
              "Coffee, and the good kind",
            ].map((a) => (
              <div className="amenity" key={a}><span className="amenity-dot" />{a}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="home-section sec-cream">
        <div className="wrap">
          <span className="eyebrow">Who it&apos;s for</span>
          <h2 className="sec-h">One address, room for everyone.</h2>
          <div className="audience-grid">
            <div className="audience"><h4>The solo professional</h4><p>Attorneys, advisors, and consultants who want a real office and a credible place to meet clients, without a long lease.</p></div>
            <div className="audience"><h4>The small firm</h4><p>Two to ten people outgrowing a home office or a strip-mall suite. Room to grow, shared meeting space, and a building you&apos;re proud to put on the letterhead.</p></div>
            <div className="audience"><h4>The visiting team</h4><p>Regional reps and remote workers who need a day office or a conference room. Book, badge in, get to work.</p></div>
            <div className="audience"><h4>The community host</h4><p>Local organizations needing event or board-meeting space, in rooms with character.</p></div>
          </div>
        </div>
      </section>

      {/* ── TERMS ── */}
      <section className="home-section sec-parchment">
        <div className="wrap">
          <span className="eyebrow">Terms</span>
          <h2 className="sec-h">Flexible by design.</h2>
          <p className="sec-lead">
            Take one office or a whole floor. Furnished or bare. Month-to-month when you&apos;re testing
            the waters, or a multi-year license when you&apos;re putting down roots. The longer you stay
            and the more you take, the better the rate. Everything is priced in the open, so the figure
            on the plan is where the conversation begins, not a teaser.
          </p>
        </div>
      </section>

      {/* ── VISIT / CTA ── */}
      <section id="visit" className="home-cta">
        <div className="wrap">
          <h2 className="cta-h">Come see it.</h2>
          <p className="cta-deck">
            The building does most of the convincing. Park out front, come through the main doors, and
            we&apos;ll show you the suites that fit what you described, coffee on.
          </p>
          <div className="hero-actions">
            <a className="btn btn-pop" href="mailto:hello@25woodgreen.com?subject=Tour%20request">Book a tour</a>
            <button className="btn btn-ghost on-dark" onClick={() => scrollTo("offices")}>Select your office</button>
          </div>
        </div>
      </section>

      {/* ── SITE FOOTER ── */}
      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-top">
            <div>
              <span className="wm rev"><span className="n">25</span><span className="t">WOODGREEN</span></span>
              <p className="footer-addr">Executive suites · Madison, Mississippi</p>
            </div>
            <div className="footer-links">
              <a onClick={() => scrollTo("offices")}>Offices</a>
              <a onClick={() => scrollTo("address")}>The address</a>
              <a onClick={() => scrollTo("visit")}>Book a tour</a>
            </div>
          </div>
          <div className="footer-bottom">© 2026 25 Woodgreen Place · Madison, Mississippi</div>
        </div>
      </footer>

      {/* ── EVER-PRESENT STICKY CALCULATOR BAR ── */}
      <div className="calcbar">
        <div className="wrap calcbar-inner">
          {chosenOffices.length === 0 ? (
            <span className="calcbar-empty">Select offices above to build your price.</span>
          ) : (
            <>
              <div className="cb-col"><span className="cb-k">Offices</span><span className="cb-v">{q.officeCount}</span></div>
              <div className="cb-div" />
              <div className="cb-col"><span className="cb-k">Monthly (list)</span><span className="cb-v dim">{money(q.grossMonthly)}</span></div>
              <div className="cb-div" />
              <div className="cb-col"><span className="cb-k">Multi-office</span><span className="cb-v disc">{pct(q.multiDiscount)}</span></div>
              <div className="cb-col"><span className="cb-k">Term · {term}mo</span><span className="cb-v disc">{pct(q.termDiscount)}</span></div>
              <div className="cb-div" />
              <div className="cb-col"><span className="cb-k">Conf hrs/mo</span><span className="cb-v dim">{q.confHours}</span></div>
              <div className="cb-total">
                <div className="cb-total-k">You pay / month <span className="cb-pill">{pct(q.totalDiscount)} total</span></div>
                <div className="cb-big">{money(q.netMonthly)}</div>
                <div className="cb-sub">{money(q.annual)} / yr · {money(q.contractValue)} contract ({term} mo)</div>
              </div>
              <button className="btn btn-accent cb-btn" onClick={reserve}>Reserve →</button>
            </>
          )}
        </div>
      </div>
      <div className="calcbar-spacer" />
    </div>
  );
}
