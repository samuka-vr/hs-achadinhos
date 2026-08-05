import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve("src");
const files = [];
const failures = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
}

function report(sourceFile, node, message) {
  const point = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  failures.push(`${path.relative(process.cwd(), sourceFile.fileName)}:${point.line + 1}:${point.character + 1} ${message}`);
}

walk(root);
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const output = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  for (const diagnostic of output.diagnostics ?? []) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    failures.push(`${path.relative(process.cwd(), file)}: ${message}`);
  }

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const keys = new Set();
      for (const property of node.properties) {
        if (!property.name) continue;
        const name = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) || ts.isNumericLiteral(property.name)
          ? property.name.text
          : null;
        if (!name) continue;
        if (keys.has(name)) report(sourceFile, property, `chave duplicada no objeto: ${name}`);
        keys.add(name);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  if (/\b(TODO|FIXME|HACK)\b/.test(source)) failures.push(`${path.relative(process.cwd(), file)}: marcador de trabalho incompleto encontrado`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Verificação de fonte concluída: ${files.length} arquivos TypeScript/TSX.`);
