#!/bin/bash
# scripts/setup_ec2.sh
# Provisioning awal EC2 Ubuntu 22.04 untuk InfraVision
# Jalankan SEKALI setelah instance baru dibuat:
# chmod +x setup_ec2.sh && ./setup_ec2.sh

set -euo pipefail

REPO_URL="https://github.com/your-org/infravision.git"
APP_DIR="/home/ubuntu/infravision"
DOMAIN="infravision.example.com"

echo "🚀 InfraVision EC2 Setup — $(date)"

# ── 1. Update sistem ──────────────────────────────────────────────────────────
echo "📦 Update packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

# ── 2. Install Docker ─────────────────────────────────────────────────────────
echo "🐳 Install Docker..."
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker

# ── 3. Install Docker Compose v2 ─────────────────────────────────────────────
echo "🐳 Install Docker Compose..."
sudo apt-get install -y docker-compose-plugin

# ── 4. Install Certbot (SSL) ──────────────────────────────────────────────────
echo "🔒 Install Certbot..."
sudo apt-get install -y certbot

# ── 5. Install AWS CLI ────────────────────────────────────────────────────────
echo "☁️  Install AWS CLI..."
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
sudo /tmp/aws/install
rm -rf /tmp/awscliv2.zip /tmp/aws

# ── 6. Clone repo ─────────────────────────────────────────────────────────────
echo "📂 Clone repository..."
git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"

# ── 7. Buat file .env dari template ──────────────────────────────────────────
if [[ ! -f "$APP_DIR/.env" ]]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo ""
    echo "⚠️  File .env sudah dibuat. Edit sebelum lanjut:"
    echo "   nano $APP_DIR/.env"
    echo ""
    read -rp "Tekan Enter setelah mengisi .env..."
fi

# ── 8. Issue SSL certificate ──────────────────────────────────────────────────
echo "🔒 Issue SSL untuk $DOMAIN..."
sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email admin@example.com

# ── 9. Setup cron backup ──────────────────────────────────────────────────────
echo "⏰ Setup cron backup harian jam 02:00..."
mkdir -p /var/log/infravision
chmod +x "$APP_DIR/scripts/backup.sh"
(crontab -l 2>/dev/null; \
 echo "0 2 * * * $APP_DIR/scripts/backup.sh >> /var/log/infravision/backup.log 2>&1") \
 | crontab -

# ── 10. Start semua service ───────────────────────────────────────────────────
echo "▶️  Starting services..."
cd "$APP_DIR"
docker compose pull
docker compose up -d

echo ""
echo "⏳ Tunggu services ready..."
sleep 10

# ── 11. Jalankan migrasi DB ───────────────────────────────────────────────────
echo "🗄️  Running DB migrations..."
docker compose exec -T backend alembic upgrade head

echo ""
echo "✅ Setup selesai!"
echo "   App: https://$DOMAIN"
echo "   API: https://$DOMAIN/api/docs"
echo ""
echo "Commands berguna:"
echo "  docker compose ps           — cek status service"
echo "  docker compose logs -f      — lihat logs"
echo "  docker compose restart      — restart semua"
