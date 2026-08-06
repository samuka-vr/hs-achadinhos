import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("o projeto não contém versões antigas ou patches", () => {
  const result = spawnSync(process.execPath, ["scripts/project-audit.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("o catálogo carrega seis produtos e oferece paginação incremental", () => {
  const source = read("src/components/ProductExplorer.tsx");
  assert.match(source, /pageSize\s*=\s*6/);
  assert.match(source, /page \+ 1/);
  assert.match(source, /Ver mais produtos/);
});

test("o coverflow possui autoplay pausável e pré-carregamento", () => {
  const source = read("src/components/HeroProductCarousel.tsx");
  assert.match(source, /setTimeout/);
  assert.doesNotMatch(source, /setInterval/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /preloadProductImage/);
});

test("o footer mobile usa grupos recolhíveis acessíveis", () => {
  const source = read("src/components/Footer.tsx");
  assert.match(source, /aria-expanded/);
  assert.match(source, /aria-controls/);
  assert.match(source, /Explorar/);
  assert.match(source, /Categorias/);
  assert.match(source, /Informações/);
});

test("consultas públicas não incluem notas internas", () => {
  const source = read("src/lib/catalog.ts");
  const declaration = source.match(/PUBLIC_PRODUCT_SELECT\s*=\s*"([^"]+)"/)?.[1] || "";
  assert.ok(declaration);
  assert.equal(declaration.includes("internal_notes"), false);
});

test("o painel possui área própria para buscas sem resultado e limpeza segura", () => {
  const source = read("src/components/SearchInsightsAdmin.tsx");
  const migration = read("supabase/migrations/003_admin_studio_reset.sql");
  assert.match(source, /delete_zero_result_searches/);
  assert.match(source, /Limpar tudo/);
  assert.match(source, /Excluir/);
  assert.match(migration, /security definer/i);
  assert.match(migration, /results_count\s*=\s*0/);
  assert.match(migration, /public\.is_admin/);
});

test("a aparência permite personalizar botões, links e estados", () => {
  const source = read("src/components/AppearanceAdmin.tsx");
  const types = read("src/lib/types.ts");
  const layout = read("src/app/(site)/layout.tsx");
  assert.match(source, /button_primary_color/);
  assert.match(source, /button_secondary_color/);
  assert.match(source, /link_color/);
  assert.match(types, /button_primary_hover_color/);
  assert.match(layout, /--hs-button-primary/);
});
