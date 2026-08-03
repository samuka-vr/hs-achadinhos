import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "H&S Achadinhos", template: "%s | H&S Achadinhos" },
  description: "Seleção de achadinhos e ofertas para encontrar produtos na Shopee.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
