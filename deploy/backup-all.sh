#!/bin/bash
# Nightly backup of all FacturApp tenant databases.
# Add to cron: 0 3 * * * /home/deploy/facturapp/deploy/backup-all.sh
#
# Backups are written to ~/backups/YYYY-MM-DD/<slug>.sql.gz
# Old backups (>30 days) are automatically removed.

set -euo pipefail

TENANTS_DIR="${TENANTS_DIR:-$HOME/tenants}"
BACKUP_ROOT="${BACKUP_ROOT:-$HOME/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TODAY=$(date +%Y-%m-%d)
BACKUP_DIR="${BACKUP_ROOT}/${TODAY}"

mkdir -p "$BACKUP_DIR"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting backup run"

ERRORS=0
COUNT=0

for dir in "$TENANTS_DIR"/*/; do
  [ -d "$dir" ] || continue
  slug=$(basename "$dir")

  # Skip the shared-scripts pseudo-directory
  [ "$slug" = "shared-scripts" ] && continue

  ENV_FILE="${dir}.env"
  if [ ! -f "$ENV_FILE" ]; then
    echo "  ⚠️  Skipping $slug — no .env found"
    continue
  fi

  # Read DB credentials from .env (only the vars we need)
  DB_USER=$(grep -m1 '^DATABASE_URL=' "$ENV_FILE" | sed 's|.*://\([^:]*\):.*|\1|')
  DB_NAME=$(grep -m1 '^DATABASE_URL=' "$ENV_FILE" | sed 's|.*/\([^?]*\).*|\1|')
  CONTAINER="db_${slug}"

  if ! docker inspect "$CONTAINER" &>/dev/null; then
    echo "  ⚠️  Skipping $slug — container $CONTAINER not running"
    continue
  fi

  OUT="${BACKUP_DIR}/${slug}.sql.gz"
  if docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$OUT"; then
    SIZE=$(du -sh "$OUT" | cut -f1)
    echo "  ✅ $slug → ${OUT} (${SIZE})"
    COUNT=$((COUNT + 1))
  else
    echo "  ❌ $slug — pg_dump failed"
    ERRORS=$((ERRORS + 1))
  fi
done

# Remove backups older than RETENTION_DAYS
find "$BACKUP_ROOT" -maxdepth 1 -type d -name "????-??-??" -mtime "+${RETENTION_DAYS}" -exec rm -rf {} + 2>/dev/null || true

echo ""
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Done — ${COUNT} backed up, ${ERRORS} errors"
echo "Backups saved to: ${BACKUP_DIR}"

[ "$ERRORS" -eq 0 ] || exit 1
