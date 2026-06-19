#!/bin/bash
# scripts/restore.sh
# Restore database dari file backup S3
# Usage: ./restore.sh backup_20250115_020000.sql.gz

set -euo pipefail

BACKUP_FILENAME="${1:-}"
S3_BUCKET="${AWS_S3_BUCKET:-infravision-backups}"
CONTAINER="infravision_db"
DB_NAME="${POSTGRES_DB:-infravision}"
DB_USER="${POSTGRES_USER:-infra_user}"

if [[ -z "$BACKUP_FILENAME" ]]; then
    echo "Usage: $0 <backup_filename.sql.gz>"
    echo ""
    echo "File backup tersedia di S3:"
    aws s3 ls "s3://$S3_BUCKET/daily/" | awk '{print $4}'
    exit 1
fi

echo "⚠️  PERINGATAN: Restore akan menghapus data database '$DB_NAME' saat ini!"
read -rp "Ketik 'YA' untuk melanjutkan: " CONFIRM
if [[ "$CONFIRM" != "YA" ]]; then
    echo "Dibatalkan."
    exit 0
fi

LOCAL_FILE="/tmp/$BACKUP_FILENAME"

echo "⬇️  Download dari S3..."
aws s3 cp "s3://$S3_BUCKET/daily/$BACKUP_FILENAME" "$LOCAL_FILE"

echo "🔄 Restore ke database '$DB_NAME'..."
gunzip -c "$LOCAL_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" "$DB_NAME"

rm -f "$LOCAL_FILE"

echo "✅ Restore selesai: $(date)"
