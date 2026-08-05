"use client";

import { useState } from "react";
import Icon from "./Icon";

export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const data = { title, url: window.location.href };
    if (navigator.share) { await navigator.share(data).catch(() => undefined); return; }
    try { await navigator.clipboard.writeText(data.url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  }
  return <button className="hs-share-button" type="button" onClick={() => void share()}><Icon name={copied ? "check" : "link"} size={17} />{copied ? "Link copiado" : "Compartilhar"}</button>;
}
