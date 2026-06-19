# InfraVision — Deployment Guide

## Struktur File

```
infravision/
├── docker-compose.yml          # Sprint 1 Task 1
├── .env.example                # Template env vars
├── alembic.ini                 # Config Alembic
├── migrations/
│   ├── env.py
│   ├── 001_init_schema.py     # Sprint 1 Task 2 — Semua tabel
│   └── 002_add_indexes.py     # Sprint 2 Task 5 — Indexing
├── scripts/
│   ├── seed.py                 # Sprint 1 Task 3 — 20 laporan dummy
│   ├── backup.sh               # Sprint 3 Task 6 — pg_dump + S3
│   ├── restore.sh              # Test restore
│   ├── setup_ec2.sh            # Sprint 4 Task 9 — Provisioning EC2
│   └── query_optimization.sql  # Sprint 3 Task 8 — EXPLAIN ANALYZE
├── nginx/
│   └── nginx.conf              # Sprint 4 Task 10 — Reverse proxy + SSL
└── .github/workflows/
    ├── ci.yml                  # Sprint 3 Task 7 — Lint + test di PR
    └── deploy.yml              # Sprint 3-4 — Build + deploy ke EC2
```

---

## Sprint 1 — Setup Lokal

```bash
# 1. Copy env
cp .env.example .env
# Edit .env dengan credentials yang benar

# 2. Jalankan semua service
docker compose up -d

# 3. Jalankan migrasi
docker compose exec backend alembic upgrade head

# 4. Seed data dummy
docker compose exec backend python scripts/seed.py

# Verifikasi: buka http://localhost:3000
```

## Sprint 2 — Cloudinary + Indexing

```bash
# Cloudinary sudah dikonfigurasi via .env (CLOUDINARY_*)
# Jalankan migrasi indexing
docker compose exec backend alembic upgrade head

# Cek index aktif di DB
docker compose exec postgres psql -U infra_user -d infravision \
  -c "SELECT indexname, tablename FROM pg_indexes WHERE schemaname='public' ORDER BY tablename;"
```

## Sprint 3 — CI/CD + Backup

### Setup GitHub Secrets
Di GitHub repo → Settings → Secrets → Actions:
| Secret | Keterangan |
|--------|-----------|
| `DOCKERHUB_USERNAME` | Username Docker Hub |
| `DOCKERHUB_TOKEN` | Access token Docker Hub |
| `EC2_HOST` | IP publik EC2 |
| `EC2_SSH_KEY` | Private key SSH (isi konten .pem) |

### Test backup manual
```bash
# Set env vars dulu
export AWS_S3_BUCKET=infravision-backups
export POSTGRES_DB=infravision
export POSTGRES_USER=infra_user

./scripts/backup.sh

# Test restore (gunakan nama file dari output backup)
./scripts/restore.sh backup_20250115_020000.sql.gz
```

## Sprint 4 — EC2 Deployment

```bash
# SSH ke EC2
ssh -i your-key.pem ubuntu@<EC2_IP>

# Upload setup script
scp -i your-key.pem scripts/setup_ec2.sh ubuntu@<EC2_IP>:~/

# Jalankan setup (sekali saja)
chmod +x setup_ec2.sh && ./setup_ec2.sh
```

### Monitoring
- **UptimeRobot**: Daftarkan URL `https://infravision.example.com` untuk uptime check setiap 5 menit
- **Nginx logs**: `docker compose exec nginx tail -f /var/log/nginx/access.log`
- **App logs**: `docker compose logs -f backend`

---

## Definition of Done Checklist

- [ ] `docker compose up` menjalankan semua 5 service tanpa error
- [ ] `alembic upgrade head` membuat semua tabel (idempotent)
- [ ] `python scripts/seed.py` mengisi 20+ laporan dummy
- [ ] Index terverifikasi aktif via `pg_stat_user_indexes`
- [ ] CI pipeline hijau di setiap PR
- [ ] Deploy otomatis berjalan saat push ke `main`
- [ ] Aplikasi bisa diakses via HTTPS dengan SSL valid
- [ ] Backup berjalan otomatis jam 02:00 dan restore berhasil ditest
