import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "25 Woodgreen Place — Executive Suites",
  description: "Find your office at 25 Woodgreen Place, Madison MS. Pick a room, configure your term, reserve.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand">
              <span className="wm"><span className="n">25</span><span className="t">WOODGREEN</span></span>
              <span className="sub">Executive Suites · Madison, Mississippi</span>
            </Link>
            <div className="nav-steps">Select offices → configure → reserve</div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
