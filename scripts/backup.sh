#!/bin/bash
# scripts/backup.sh
# Backup PostgreSQL harian ke S3
# Jalankan via cron: 0 2 * * * /home/ubuntu/infravision/scripts/backup.sh >> /var/log/infravision/backup.log 2>&1

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
CONTAINER="infravision_db"
DB_NAME="${POSTGRES_DB:-infravision}"
DB_USER="${POSTGRES_USER:-infra_user}"
S3_BUCKET="${AWS_S3_BUCKET:-infravision-backups}"
BACKUP_DIR="/tmp/infravision_backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

echo "=========================================="
echo "InfraVision DB Backup — $(date)"
echo "=========================================="

# ── Buat direktori backup ─────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── pg_dump dari container ────────────────────────────────────────────────────
echo "📦 Dumping database '$DB_NAME'..."
docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

FILE_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "✓ Backup berhasil: $BACKUP_FILE ($FILE_SIZE)"

# ── Upload ke S3 ──────────────────────────────────────────────────────────────
echo "☁️  Uploading ke S3: s3://$S3_BUCKET/daily/$(basename $BACKUP_FILE)"
aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/daily/$(basename $BACKUP_FILE)" \
    --region "${AWS_REGION:-ap-southeast-1}" \
    --storage-class STANDARD_IA

echo "✓ Upload selesai"

# ── Hapus backup lokal ────────────────────────────────────────────────────────
rm -f "$BACKUP_FILE"
echo "✓ File lokal dibersihkan"

# ── Hapus backup S3 yang lebih dari RETENTION_DAYS ───────────────────────────
echo "🧹 Membersihkan backup S3 lebih dari $RETENTION_DAYS hari..."
CUTOFF=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)

aws s3 ls "s3://$S3_BUCKET/daily/" | while read -r line; do
    FILE_DATE=$(echo "$line" | awk '{print $4}' | grep -oP '\d{8}' | head -1)
    FILE_NAME=$(echo "$line" | awk '{print $4}')
    if [[ -n "$FILE_DATE" && "$FILE_DATE" < "$CUTOFF" ]]; then
        aws s3 rm "s3://$S3_BUCKET/daily/$FILE_NAME"
        echo "   Dihapus: $FILE_NAME"
    fi
done

echo "✅ Backup selesai: $(date)"
echo ""
