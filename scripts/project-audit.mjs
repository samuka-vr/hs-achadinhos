import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const required = [
  "package.json", "tsconfig.json", "next.config.ts", ".env.example", ".gitignore",
  "README.md", "PROJECT-MANIFEST.md", "src/app/layout.tsx", "src/app/(site)/layout.tsx",
  "src/app/admin/layout.tsx", "src/app/styles/public.css", "src/app/styles/admin.css",
  "src/components/HeroProductCarousel.tsx", "src/components/Footer.tsx",
  "src/components/ProductExplorer.tsx", "src/app/api/catalog/route.ts",
  "supabase/migrations/001_schema.sql", "supabase/migrations/002_existing_database_fixes.sql",
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Arquivo obrigatório ausente: ${file}`);
}

const forbiddenNames = [".next", ".vercel", "tsconfig.tsbuildinfo"];
for (const name of forbiddenNames) {
  if (fs.existsSync(path.join(root, name))) failures.push(`Artefato proibido na raiz: ${name}`);
}

const allFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", ".vercel"].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else allFiles.push(full);
  }
}
walk(root);

for (const file of allFiles) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  if (/\.(zip|log)$/i.test(rel)) failures.push(`Arquivo proibido: ${rel}`);
  if (/ATUALIZA|CORRE[CÇ][AÃ]O|PATCH|V1[234](?:\.|-|_)/i.test(rel)) failures.push(`Nome legado: ${rel}`);
}

const textFiles = allFiles.filter((file) => /\.(?:ts|tsx|css|mjs|json|md|sql|svg|txt)$/i.test(file));
for (const file of textFiles) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const source = fs.readFileSync(file, "utf8");
  const legacyTokens = ["admin" + "-v14", "public" + "-v14", "Product" + "Coverflow", "hs-achadinhos-" + "v14"];
  if (legacyTokens.some((token) => source.toLowerCase().includes(token.toLowerCase()))) failures.push(`Referência legada em ${rel}`);
  if (/(?:service_role|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'][^"']+/i.test(source)) failures.push(`Possível segredo em ${rel}`);
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source)) failures.push(`Chave privada em ${rel}`);
}

function resolveImport(from, request) {
  const base = request.startsWith("@/")
    ? path.join(root, "src", request.slice(2))
    : path.resolve(path.dirname(from), request);
  const candidates = [
    base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, `${base}.css`,
    path.join(base, "index.ts"), path.join(base, "index.tsx"), path.join(base, "index.js"),
  ];
  return candidates.some((candidate) => fs.existsSync(candidate));
}

for (const file of allFiles.filter((item) => /\.(?:ts|tsx|mjs)$/.test(item))) {
  const source = fs.readFileSync(file, "utf8");
  const matcher = /(?:from\s+|import\s*\()\s*["']([^"']+)["']/g;
  for (const match of source.matchAll(matcher)) {
    const request = match[1];
    if ((request.startsWith(".") || request.startsWith("@/")) && !resolveImport(file, request)) {
      failures.push(`Import local não resolvido em ${path.relative(root, file)}: ${request}`);
    }
  }
}

for (const file of allFiles.filter((item) => item.endsWith(".css"))) {
  const source = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const opens = (source.match(/{/g) || []).length;
  const closes = (source.match(/}/g) || []).length;
  if (opens !== closes) failures.push(`CSS desequilibrado em ${path.relative(root, file)}: ${opens}/${closes}`);
}

const catalog = fs.readFileSync(path.join(root, "src/components/ProductExplorer.tsx"), "utf8");
if (!/pageSize\s*=\s*6/.test(catalog)) failures.push("Catálogo não inicia com 6 produtos.");
if (!/Ver mais produtos/.test(catalog)) failures.push("Botão Ver mais produtos ausente.");

const carousel = fs.readFileSync(path.join(root, "src/components/HeroProductCarousel.tsx"), "utf8");
if (/setInterval/.test(carousel)) failures.push("Coverflow deve usar um único timeout, não setInterval.");
if (!/IntersectionObserver/.test(carousel) || !/visibilitychange/.test(carousel)) failures.push("Pausas de visibilidade do coverflow ausentes.");
if (!/preloadProductImage/.test(carousel)) failures.push("Pré-carregamento do coverflow ausente.");

const publicSelect = fs.readFileSync(path.join(root, "src/lib/catalog.ts"), "utf8");
const selectDeclaration = publicSelect.match(/PUBLIC_PRODUCT_SELECT\s*=\s*"([^"]+)"/)?.[1] || "";
if (selectDeclaration.includes("internal_notes")) failures.push("Notas internas expostas na consulta pública.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Auditoria do projeto concluída: ${allFiles.length} arquivos verificados.`);
