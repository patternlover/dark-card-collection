#!/usr/bin/env bash
# Setup one-shot del VPS Oracle (Oracle Cloud Free Tier) per il backend Medusa.
# Fa: aggiorna il sistema, installa Docker, clona il repo, avvia lo stack,
# esegue le migrazioni. Vedere docs/project/medusa/DEPLOYMENT.md per DNS/env.
#
# Uso: sudo bash apps/backend/scripts/setup-vps.sh
set -euo pipefail

apt-get update && apt-get upgrade -y
curl -fsSL https://get.docker.com | sh
apt-get install -y postgresql-client jq python3

# Repo. Se diventa privata (PENDING W6) servira' una deploy key:
#   git clone git@github.com:patternlover/dark-card-collection.git /opt/dcc
if [ ! -d /opt/dcc/.git ]; then
  git clone https://github.com/patternlover/dark-card-collection.git /opt/dcc
else
  git -C /opt/dcc pull --ff-only
fi

cd /opt/dcc/apps/backend

if [ ! -f .env.prod ]; then
  echo "ERRORE: /opt/dcc/apps/backend/.env.prod mancante."
  echo "Crealo localmente con: node apps/backend/scripts/gen-prod-env.js"
  echo "poi compila DATABASE_URL/Stripe/Resend e copialo sul VPS."
  exit 1
fi

docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm api npx medusa db:migrate

echo
echo "Fatto. Ora:"
echo "  1) crea l'admin su https://medusa.darkcardcollection.com/app"
echo "  2) Admin → Settings → Regions → Italia → abilita il provider Stripe"
echo "  3) Stripe webhook → https://medusa.darkcardcollection.com/hooks/payment/stripe (evento payment_intent.succeeded)"