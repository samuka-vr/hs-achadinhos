const DEFAULT_AFFILIATE_DOMAINS = [
  "shopee.com.br",
  "www.shopee.com.br",
  "s.shopee.com.br",
];

function normalizeHost(host: string) {
  return host.trim().toLowerCase().replace(/^\.+|\.+$/g, "");
}

export function affiliateAllowedDomains() {
  const configured = (process.env.AFFILIATE_ALLOWED_DOMAINS || "")
    .split(",")
    .map(normalizeHost)
    .filter(Boolean);
  return new Set([...DEFAULT_AFFILIATE_DOMAINS, ...configured]);
}

export function isAllowedAffiliateUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const hostname = normalizeHost(url.hostname);
    const allowed = affiliateAllowedDomains();
    return [...allowed].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

/** Accepts only local paths or HTTPS links configured by an administrator. */
export function isSafePublicUrl(value: string) {
  const candidate = value.trim();
  if (!candidate) return false;
  if (candidate.startsWith("/")) return !candidate.startsWith("//");
  if (candidate.startsWith("#")) return true;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function safePublicHref(value: string | null | undefined, fallback = "#") {
  return value && isSafePublicUrl(value) ? value : fallback;
}

export function safeSiteUrl(value: string | null | undefined) {
  try {
    const parsed = new URL(value || "http://localhost:3000");
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("invalid protocol");
    return parsed;
  } catch {
    return new URL("http://localhost:3000");
  }
}
