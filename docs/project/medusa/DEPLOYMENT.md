# Deploy Medusa su Oracle Cloud Free Tier (Docker)

Guida operativa per portare il backend Medusa in produzione su una VM
**Oracle Cloud Always Free (ARM Ampere A1)**: api + worker + Redis + Caddy (HTTPS),
Postgres su **Neon free** (nuovo DB, separato da quello Payload).

> Costo: €0/mese (Free Tier). Tutto il resto del sito resta su Vercel free.

---

## 1. Provviste / prerequisiti

| Risorsa | Dove | Note |
|---|---|---|
| VM ARM Oracle Cloud (4 OCPU/24GB) | Oracle Cloud Free Tier | Serve carta di credito per verifica (non addebitata nel free tier). Se A1 non disponibile nella home region, riprova/ cambia region |
| DB Postgres | **Neon** — nuovo DB `dcc_medusa` | Non toccare il DB Payload |
| Redis | Container nel compose (self-hosted sul VM) | Nessun servizio esterno |
| Dominio | DNS `medusa.darkcardcollection.com → IP VPS` | A record (o AAAA) |
| Stripe | Dashboard → Developers | Chiavi + webhook `https://medusa.darkcardcollection.com/hooks/payment/stripe` (evento `payment_intent.succeeded`) |
| Resend | Dashboard Resend | `RESEND_API_KEY` + dominio verificato per `noreply@darkcardcollection.com` |

## 2. VM: installazione base (una tantum)

```bash
# aggiorna il sistema
sudo apt update && sudo apt upgrade -y

# Docker + compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu   # ri-loggiati dopo

# client postgres per i backup
sudo apt install -y postgresql-client

# repo (o rsync/scp dal tuo PC)
git clone https://github.com/patternlover/dark-card-collection.git /opt/dcc
cd /opt/dcc/apps/backend
```

## 3. Configurazione env

```bash
cp .env.example .env.prod
# compila .env.prod con:
#   DATABASE_URL (Neon, nuovo DB) · REDIS_URL=redis://redis:6379
#   JWT_SECRET / COOKIE_SECRET / AUTH_MFA_ENCRYPTION_KEY (64 hex)
#   STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
#   STORE_CORS=https://darkcardcollection.com
#   ADMIN_CORS=https://medusa.darkcardcollection.com,https://darkcardcollection.com
#   AUTH_CORS=https://medusa.darkcardcollection.com,https://darkcardcollection.com
#   RESEND_API_KEY / EMAIL_FROM=noreply@darkcardcollection.com
```

> `REDIS_URL` deve puntare al servizio compose: `redis://redis:6379`.

## 4. Build + avvio + migration + admin

```bash
docker compose -f docker-compose.prod.yml up -d --build

# migrazioni (crea tabelle + seed: region Italia, sales channel, location, publishable key)
docker compose -f docker-compose.prod.yml run --rm api npx medusa db:migrate

# log / health
docker compose -f docker-compose.prod.yml logs -f api
curl https://medusa.darkcardcollection.com/health
```

Poi:
- Apri `https://medusa.darkcardcollection.com/app` → **crea l'admin** (onboarding).
- **Stripe sulla region**: Admin → Settings → Regions → Italia → Payment providers → **Stripe**.
- **Publishable key**: Admin → Settings → API Keys → copia la `pk_...` per il frontend.

## 5. Frontend Vercel

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa.darkcardcollection.com`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live/test_...`
- Deploy preview del branch → test `/shop`, PDP, add-to-cart, checkout con carta `4242 4242 4242 4242`, register/login → poi merge su `main`.

## 6. Backup (Neon)

```bash
sudo cp /opt/dcc/apps/backend/scripts/backup-medusa.sh /opt/medusa-backup.sh
sudo chmod +x /opt/medusa-backup.sh
# cron notturno
(crontab -l 2>/dev/null; echo "0 3 * * * DATABASE_URL='postgres://...' BACKUP_DIR=/var/backups/medusa /opt/medusa-backup.sh >> /var/log/medusa-backup.log 2>&1") | crontab -
```

## 7. Monitoring / manutenzione

- `docker compose ps` per lo stato; `restart: unless-stopped` riavvia da solo.
- Uptime Kuma (opzionale, anche sul VM) che monitora `/health`.
- Aggiornamenti: `cd /opt/dcc/apps/backend && git pull && docker compose -f docker-compose.prod.yml up -d --build` + `db:migrate` se cambia lo schema.

## 8. Sicurezza

- La porta 9000 è bindata su `127.0.0.1` (solo Caddy la raggiunge). 80/443 esposti da Caddy.
- Firewall Oracle (Security Lists) / `ufw`: aprire solo 80 e 443.
- `JWT_SECRET`/`COOKIE_SECRET` forti (64 hex) e mai committati.

## 9. Failover / DR

- Dati su **Neon** (managed, PITR): se il VM muore, i dati sono al sicuro.
- Per la continuità si può tenere un secondo stack su un'altra VM e puntare il DNS — non necessario all'inizio.

---

## Checklist cutover (in ordine)

- [ ] VM Oracle + Docker ok, dominio DNS risolve
- [ ] `.env.prod` completo; `db:migrate` ok; admin creato
- [ ] Stripe provider abilitato su region Italia; webhook configurato e verificato (`/hooks/payment/stripe`)
- [ ] Vercel env aggiornato; preview verificata; merge su main
- [ ] Feed `https://darkcardcollection.com/api/feed/products` registrato in Merchant Center
- [ ] Backup cron attivo; primo backup verificato (file `.sql.gz` presente)