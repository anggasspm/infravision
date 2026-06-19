"""Sprint 2 — Add all performance indexes

Revision ID: 002_add_indexes
Revises: 001_init_schema
Create Date: 2025-01-15 00:00:00
"""
from alembic import op

revision = '002_add_indexes'
down_revision = '001_init_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ─────────────────────────────────────────────────
    op.create_index('idx_users_email', 'users', ['email'], unique=True)

    # ── reports — query paling sering ─────────────────────────
    op.create_index('idx_reports_user_id',  'reports', ['user_id'])
    op.create_index('idx_reports_status',   'reports', ['status'])
    op.create_index('idx_reports_severity', 'reports', ['severity'])

    # priority_score DESC untuk sorting dashboard admin
    op.create_index('idx_reports_priority', 'reports', ['priority_score'],
                    postgresql_ops={'priority_score': 'DESC'})

    # Spatial bounding-box query untuk peta GIS
    op.create_index('idx_reports_geo', 'reports', ['latitude', 'longitude'])

    # Composite: filter umum admin (status + severity bersamaan)
    op.create_index('idx_reports_status_severity', 'reports',
                    ['status', 'severity'])

    # created_at untuk laporan terbaru / pagination time-based
    op.create_index('idx_reports_created_at', 'reports', ['created_at'],
                    postgresql_ops={'created_at': 'DESC'})

    # Duplicate detection: cek berdasarkan is_duplicate flag
    op.create_index('idx_reports_duplicate', 'reports', ['is_duplicate'],
                    postgresql_where="is_duplicate = TRUE")

    # ── report_history ────────────────────────────────────────
    op.create_index('idx_history_report_id', 'report_history', ['report_id'])

    # ── notifications — partial index: hanya yang belum dibaca ─
    op.create_index('idx_notif_user_unread', 'notifications', ['user_id'],
                    postgresql_where="is_read = FALSE")
    op.create_index('idx_notif_created_at', 'notifications', ['created_at'],
                    postgresql_ops={'created_at': 'DESC'})


def downgrade() -> None:
    op.drop_index('idx_notif_created_at',        table_name='notifications')
    op.drop_index('idx_notif_user_unread',        table_name='notifications')
    op.drop_index('idx_history_report_id',        table_name='report_history')
    op.drop_index('idx_reports_duplicate',        table_name='reports')
    op.drop_index('idx_reports_created_at',       table_name='reports')
    op.drop_index('idx_reports_status_severity',  table_name='reports')
    op.drop_index('idx_reports_geo',              table_name='reports')
    op.drop_index('idx_reports_priority',         table_name='reports')
    op.drop_index('idx_reports_severity',         table_name='reports')
    op.drop_index('idx_reports_status',           table_name='reports')
    op.drop_index('idx_reports_user_id',          table_name='reports')
    op.drop_index('idx_users_email',              table_name='users')
