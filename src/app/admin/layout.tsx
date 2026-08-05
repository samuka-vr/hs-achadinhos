import type { Metadata } from "next";
import "../styles/admin-v14.css";

export const metadata: Metadata = { title: "H&S Studio", robots: { index: false, follow: false } };
export default function AdminRootLayout({ children }: { children: React.ReactNode }) { return children; }
