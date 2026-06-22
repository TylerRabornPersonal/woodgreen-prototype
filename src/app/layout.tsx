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
              <div className="mark">W</div>
              <div>
                <h1>25 Woodgreen Place</h1>
                <div className="sub">Executive Suites · Madison, MS</div>
              </div>
            </Link>
            <div className="nav-steps">Pick a room → configure → reserve</div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
