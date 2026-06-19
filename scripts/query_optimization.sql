-- scripts/query_optimization.sql
-- Sprint 3 Task 8 — Analisis & optimasi slow queries
-- Jalankan di psql untuk cek performa sebelum/sesudah indexing

-- ============================================================
-- 1. EXPLAIN ANALYZE — Query laporan dengan filter status
-- ============================================================
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, category, severity, priority_score, status, created_at
FROM reports
WHERE status = 'pending'
ORDER BY priority_score DESC
LIMIT 20;

-- ============================================================
-- 2. EXPLAIN ANALYZE — Query GIS bounding box (peta Leaflet)
-- Filter laporan dalam radius tampilan peta user
-- ============================================================
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, category, severity, latitude, longitude, status
FROM reports
WHERE latitude  BETWEEN -6.30 AND -6.10
  AND longitude BETWEEN 106.75 AND 106.95
  AND status != 'completed';

-- ============================================================
-- 3. EXPLAIN ANALYZE — Analytics dashboard admin
-- Distribusi per kategori + rata-rata confidence
-- ============================================================
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    category,
    COUNT(*)                          AS total,
    AVG(ai_confidence)::NUMERIC(5,4) AS avg_confidence,
    AVG(priority_score)::INT          AS avg_priority,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS selesai
FROM reports
GROUP BY category
ORDER BY total DESC;

-- ============================================================
-- 4. EXPLAIN ANALYZE — Notifikasi belum dibaca milik user
-- Harus menggunakan partial index idx_notif_user_unread
-- ============================================================
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, message, created_at
FROM notifications
WHERE user_id = '00000000-0000-0000-0000-000000000001'
  AND is_read = FALSE
ORDER BY created_at DESC;

-- ============================================================
-- 5. Cek ukuran tabel dan penggunaan index
-- ============================================================
SELECT
    relname                                             AS table_name,
    pg_size_pretty(pg_total_relation_size(relid))      AS total_size,
    pg_size_pretty(pg_relation_size(relid))            AS table_size,
    pg_size_pretty(pg_indexes_size(relid))             AS index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- ============================================================
-- 6. Cek semua index yang aktif digunakan
-- ============================================================
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan        AS times_used,
    idx_tup_read    AS tuples_read,
    idx_tup_fetch   AS tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- ============================================================
-- 7. Duplicate detection query — cek laporan dalam radius 50m
-- Dipakai oleh Orang 2 di endpoint /reports/check-duplicate
-- ============================================================
-- Formula Haversine sederhana dengan bounding box pre-filter
-- lat 1 derajat ≈ 111km, long 1 derajat ≈ 111km * cos(lat)
-- 50m = 0.00045 derajat
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, category, image_url, latitude, longitude, created_at
FROM reports
WHERE latitude  BETWEEN (-6.2088 - 0.00045) AND (-6.2088 + 0.00045)
  AND longitude BETWEEN (106.8456 - 0.00050) AND (106.8456 + 0.00050)
  AND status != 'completed'
  AND is_duplicate = FALSE
ORDER BY created_at DESC
LIMIT 5;
