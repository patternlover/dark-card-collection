#!/usr/bin/env bash
# Crea il progetto Neon "dcc_medusa" (DB nuovo, separato dal Payload) e stampa
# la DATABASE_URL da incollare in apps/backend/.env.prod.
#
# Prerequisito: NEON_API_KEY da Neon console → Account → API keys → Create new key.
#
# Uso: NEON_API_KEY=neon_... bash apps/backend/scripts/create-neon-db.sh
set -euo pipefail

: "${NEON_API_KEY:?NEON_API_KEY mancante (Neon console → Account → API keys)}"
REGION="${NEON_REGION:-eu-central-1}"
NAME="${NEON_DB_NAME:-dcc_medusa}"

echo "Creo il progetto Neon '$NAME' (region $REGION)..."

resp=$(curl -sS -f -X POST "https://console.neon.tech/api/v2/projects" \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"project\":{\"name\":\"$NAME\",\"region_id\":\"$REGION\"}}") || {
  echo "ERRORE: API Neon non riuscita. Verifica NEON_API_KEY." >&2
  exit 1
}

conn=$(printf '%s' "$resp" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['connection_uris'][0]['connection_string'])" 2>/dev/null \
  || printf '%s' "$resp" | jq -r '.connection_uris[0].connection_string' 2>/dev/null \
  || printf '%s' "$resp")

echo "DATABASE_URL=$conn"
echo
echo "Incolla il valore sopra in apps/backend/.env.prod -> DATABASE_URL"
echo "In alternativa crealo a mano dalla console Neon (2 min)."