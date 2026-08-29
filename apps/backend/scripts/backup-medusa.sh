#!/usr/bin/env bash
# Backup del DB Medusa (Neon, gestito) → file .sql.gz locale con retention.
# Sul VPS: apt install -y postgresql-client ; copia questo script + cron:
#   0 3 * * * /opt/medusa/backup-medusa.sh >> /var/log/medusa-backup.log 2>&1
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL mancante}"
OUT_DIR="${BACKUP_DIR:-/var/backups/medusa}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

mkdir -p "$OUT_DIR"
TS="$(date +%Y%m%d_%H%M%S)"
FILE="$OUT_DIR/medusa_$TS.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$FILE"
echo "[$(date)] backup ok: $FILE ($(du -h "$FILE" | cut -f1))"

find "$OUT_DIR" -name 'medusa_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete