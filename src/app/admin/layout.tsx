import type { Metadata } from "next";
import "../styles/admin.css";

export const metadata: Metadata = { title: "H&S Studio", robots: { index: false, follow: false } };
export default function AdminRootLayout({ children }: { children: React.ReactNode }) { return children; }
