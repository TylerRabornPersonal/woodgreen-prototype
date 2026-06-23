import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "25 Woodgreen Place · Executive Suites",
  description: "Find your office at 25 Woodgreen Place, Madison MS. Pick a room, configure your term, reserve.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
