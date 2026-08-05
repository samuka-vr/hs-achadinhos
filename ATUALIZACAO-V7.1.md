# H&S Achadinhos V7.1

Correção do erro TypeScript no indicador de etapas do importador em massa.

Não é necessário executar SQL no Supabase.

## Atualização rápida no Codespaces

```bash
python - <<'PY'
from pathlib import Path
p = Path('src/components/BulkImportAdmin.tsx')
s = p.read_text()
s = s.replace(
    'className={step === "paste" ? "active" : step !== "paste" ? "done" : ""}',
    'className={step === "paste" ? "active" : "done"}'
)
p.write_text(s)
print('BulkImportAdmin.tsx corrigido.')
PY

npm run build
git add src/components/BulkImportAdmin.tsx
git commit -m "Corrigir etapa do importador V7.1"
git push origin main
```
