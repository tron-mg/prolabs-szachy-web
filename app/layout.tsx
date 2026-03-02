import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prolabs Chess MVP",
  description: "Desktop-first, mobile-friendly chess UI shell"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
