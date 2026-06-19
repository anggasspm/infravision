"""
seed.py — Seed data untuk development InfraVision
Jalankan: python seed.py

Membuat:
  - 3 user dummy (citizen, maintenance, admin)
  - 20 laporan dengan variasi status, severity, kategori
"""
import os
import uuid
import random
from datetime import datetime, timedelta

import bcrypt
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://infra_user:password@localhost:5432/infravision"
)

engine = create_engine(DATABASE_URL)

# ── Dummy users ───────────────────────────────────────────────────────────────
DUMMY_USERS = [
    {
        "name":  "Budi Santoso",
        "email": "citizen@infra.id",
        "role":  "citizen",
    },
    {
        "name":  "Siti Rahayu",
        "email": "admin@infra.id",
        "role":  "admin",
    },
    {
        "name":  "Eko Prasetyo",
        "email": "maint@infra.id",
        "role":  "maintenance",
    },
]

DEFAULT_PASSWORD = "password123"

# ── Variasi laporan ───────────────────────────────────────────────────────────
CATEGORIES = [
    "Jalan Berlubang",
    "Jembatan Rusak",
    "Drainase Tersumbat",
    "Lampu Jalan Mati",
    "Trotoar Retak",
    "Rambu Lalu Lintas Rusak",
]

STATUSES = [
    "pending",
    "verified",
    "assigned",
    "in_progress",
    "under_repair",
    "completed",
]

SEVERITIES = ["low", "medium", "high", "critical"]

# Koordinat sekitar Jakarta (untuk demo)
BASE_LAT  = -6.2088
BASE_LONG = 106.8456

DUMMY_REPORTS = []
for i in range(20):
    status   = STATUSES[i % len(STATUSES)]
    severity = SEVERITIES[i % len(SEVERITIES)]
    category = CATEGORIES[i % len(CATEGORIES)]
    lat_offset  = random.uniform(-0.05, 0.05)
    long_offset = random.uniform(-0.05, 0.05)
    days_ago = random.randint(0, 30)

    DUMMY_REPORTS.append({
        "category":      category,
        "description":   f"Laporan kerusakan #{i+1}: {category} ditemukan di lokasi tersebut.",
        "image_url":     f"https://res.cloudinary.com/demo/image/upload/infravision/report_{i+1}.jpg",
        "latitude":      round(BASE_LAT  + lat_offset,  8),
        "longitude":     round(BASE_LONG + long_offset, 8),
        "ai_confidence": round(random.uniform(0.65, 0.99), 4),
        "severity":      severity,
        "priority_score": random.randint(10, 95),
        "status":        status,
        "is_duplicate":  (i % 10 == 9),  # 2 dari 20 laporan adalah duplikat
        "created_at":    datetime.utcnow() - timedelta(days=days_ago),
    })


# ── Runner ────────────────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def seed():
    with engine.connect() as conn:
        print("🌱 Seeding users...")
        user_ids = {}

        for u in DUMMY_USERS:
            uid = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO users (id, name, email, password_hash, role)
                VALUES (:id, :name, :email, :password_hash, :role)
                ON CONFLICT (email) DO NOTHING
            """), {
                "id":            uid,
                "name":          u["name"],
                "email":         u["email"],
                "password_hash": hash_password(DEFAULT_PASSWORD),
                "role":          u["role"],
            })
            user_ids[u["role"]] = uid
            print(f"   ✓ {u['role']:12s} — {u['email']}")

        citizen_id = user_ids["citizen"]
        admin_id   = user_ids["admin"]
        maint_id   = user_ids["maintenance"]

        print("\n🌱 Seeding reports...")
        report_ids = []

        for i, r in enumerate(DUMMY_REPORTS):
            rid = str(uuid.uuid4())
            report_ids.append(rid)

            conn.execute(text("""
                INSERT INTO reports (
                    id, user_id, category, description, image_url,
                    latitude, longitude, ai_confidence, severity,
                    priority_score, status, is_duplicate, created_at
                )
                VALUES (
                    :id, :user_id, :category, :description, :image_url,
                    :latitude, :longitude, :ai_confidence, :severity,
                    :priority_score, :status, :is_duplicate, :created_at
                )
            """), {
                "id":            rid,
                "user_id":       citizen_id,
                "created_at":    r["created_at"],
                **{k: v for k, v in r.items() if k != "created_at"},
            })

            # Buat report_history jika status bukan pending
            if r["status"] != "pending":
                conn.execute(text("""
                    INSERT INTO report_history (
                        id, report_id, previous_status, current_status,
                        changed_by, updated_at
                    ) VALUES (
                        gen_random_uuid(), :report_id, 'pending', :current_status,
                        :changed_by, :updated_at
                    )
                """), {
                    "report_id":      rid,
                    "current_status": r["status"],
                    "changed_by":     admin_id,
                    "updated_at":     r["created_at"] + timedelta(hours=2),
                })

            # Buat notifikasi untuk status completed
            if r["status"] == "completed":
                conn.execute(text("""
                    INSERT INTO notifications (
                        id, user_id, report_id, message, is_read, created_at
                    ) VALUES (
                        gen_random_uuid(), :user_id, :report_id, :message, false, :created_at
                    )
                """), {
                    "user_id":   citizen_id,
                    "report_id": rid,
                    "message":   f"Laporan '{r['category']}' Anda telah selesai ditangani.",
                    "created_at": r["created_at"] + timedelta(days=3),
                })

            print(f"   ✓ Report #{i+1:02d} — {r['category']:<30s} [{r['status']:<12s}] [{r['severity']}]")

        conn.commit()
        print(f"\n✅ Seeding selesai: {len(DUMMY_USERS)} users, {len(DUMMY_REPORTS)} reports")
        print(f"   Login: citizen@infra.id / admin@infra.id / maint@infra.id")
        print(f"   Password semua: {DEFAULT_PASSWORD}")


if __name__ == "__main__":
    seed()
