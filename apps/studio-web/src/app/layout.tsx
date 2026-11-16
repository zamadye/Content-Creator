import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content Studio",
  description: "Ruang kerja privat untuk merancang video yang menjelaskan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
