import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="brand">
            <span className="wm"><span className="n">25</span><span className="t">WOODGREEN</span></span>
            <span className="sub">Executive Suites · Madison, Mississippi</span>
          </Link>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/portal" className="portal-link">Tenant sign in</Link>
            <Link className="btn btn-ghost header-cta" href="/tour">Book a tour</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
