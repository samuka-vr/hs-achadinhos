"use client";

import { useState } from "react";

export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const data = { title, url: window.location.href };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(data.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return <button className="button secondary" type="button" onClick={() => void share()}>{copied ? "Link copiado" : "Compartilhar"}</button>;
}
