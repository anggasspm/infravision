"""Sprint 1 — Create all base tables

Revision ID: 001_init_schema
Revises: 
Create Date: 2025-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_init_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgcrypto extension untuk gen_random_uuid()
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    # ENUM types
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE user_role AS ENUM ('citizen', 'maintenance', 'admin');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE report_status AS ENUM (
                'pending', 'verified', 'assigned',
                'in_progress', 'under_repair', 'completed'
            );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    # ── Tabel users ──────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True),
                  server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('name',          sa.String(100),  nullable=False),
        sa.Column('email',         sa.String(255),  nullable=False),
        sa.Column('password_hash', sa.String(255),  nullable=False),
        sa.Column('role',
                  postgresql.ENUM('citizen', 'maintenance', 'admin',
                                  name='user_role', create_type=False),
                  nullable=False, server_default='citizen'),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False,
                  server_default=sa.text('NOW()')),
        sa.UniqueConstraint('email', name='uq_users_email'),
    )

    # ── Tabel reports ─────────────────────────────────────────
    op.create_table(
        'reports',
        sa.Column('id', postgresql.UUID(as_uuid=True),
                  server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('user_id',        postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('category',       sa.String(100),    nullable=False),
        sa.Column('description',    sa.Text(),         nullable=True),
        sa.Column('image_url',      sa.String(500),    nullable=False),
        sa.Column('latitude',       sa.Numeric(10, 8), nullable=False),
        sa.Column('longitude',      sa.Numeric(11, 8), nullable=False),
        sa.Column('ai_confidence',  sa.Numeric(5, 4),  server_default='0'),
        sa.Column('severity',
                  postgresql.ENUM('low', 'medium', 'high', 'critical',
                                  name='severity_level', create_type=False),
                  server_default='low'),
        sa.Column('priority_score', sa.Integer(),
                  sa.CheckConstraint('priority_score BETWEEN 0 AND 100'),
                  server_default='0'),
        sa.Column('status',
                  postgresql.ENUM('pending', 'verified', 'assigned',
                                  'in_progress', 'under_repair', 'completed',
                                  name='report_status', create_type=False),
                  nullable=False, server_default='pending'),
        sa.Column('is_duplicate',   sa.Boolean(),      nullable=False, server_default='false'),
        sa.Column('created_at',     sa.TIMESTAMP(),    nullable=False,
                  server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'],
                                ondelete='CASCADE', name='fk_reports_user'),
    )

    # ── Tabel report_history ──────────────────────────────────
    op.create_table(
        'report_history',
        sa.Column('id', postgresql.UUID(as_uuid=True),
                  server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('report_id',       postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('previous_status',
                  postgresql.ENUM('pending', 'verified', 'assigned',
                                  'in_progress', 'under_repair', 'completed',
                                  name='report_status', create_type=False),
                  nullable=True),
        sa.Column('current_status',
                  postgresql.ENUM('pending', 'verified', 'assigned',
                                  'in_progress', 'under_repair', 'completed',
                                  name='report_status', create_type=False),
                  nullable=False),
        sa.Column('changed_by',  postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_at',  sa.TIMESTAMP(), nullable=False,
                  server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['report_id'], ['reports.id'],
                                ondelete='CASCADE', name='fk_history_report'),
        sa.ForeignKeyConstraint(['changed_by'], ['users.id'],
                                ondelete='SET NULL', name='fk_history_user'),
    )

    # ── Tabel notifications ───────────────────────────────────
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True),
                  server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('user_id',   postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('report_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('message',   sa.Text(),    nullable=False),
        sa.Column('is_read',   sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False,
                  server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'],   ['users.id'],
                                ondelete='CASCADE', name='fk_notif_user'),
        sa.ForeignKeyConstraint(['report_id'], ['reports.id'],
                                ondelete='CASCADE', name='fk_notif_report'),
    )


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('report_history')
    op.drop_table('reports')
    op.drop_table('users')

    op.execute("DROP TYPE IF EXISTS report_status")
    op.execute("DROP TYPE IF EXISTS severity_level")
    op.execute("DROP TYPE IF EXISTS user_role")
