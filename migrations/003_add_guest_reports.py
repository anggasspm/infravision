from alembic import op
import sqlalchemy as sa
import secrets
import string

revision = '003_add_guest_reports'
down_revision = '002_add_indexes'
branch_labels = None
depends_on = None

_ALPHABET = "".join(c for c in string.ascii_uppercase + string.digits if c not in "01OI")


def _gen_code() -> str:
    return "INV-" + "".join(secrets.choice(_ALPHABET) for _ in range(6))


def upgrade() -> None:
    # 1) user_id boleh NULL
    op.alter_column('reports', 'user_id', nullable=True)

    # 2) tambah kolom tracking_code, sementara nullable dulu supaya bisa
    #    di-backfill baris yang sudah ada, baru dikunci NOT NULL + UNIQUE.
    op.add_column('reports', sa.Column('tracking_code', sa.String(20), nullable=True))

    connection = op.get_bind()
    existing_ids = [row[0] for row in connection.execute(sa.text("SELECT id FROM reports")).fetchall()]
    used_codes = set()
    for report_id in existing_ids:
        code = _gen_code()
        while code in used_codes:
            code = _gen_code()
        used_codes.add(code)
        connection.execute(
            sa.text("UPDATE reports SET tracking_code = :code WHERE id = :id"),
            {"code": code, "id": report_id},
        )

    op.alter_column('reports', 'tracking_code', nullable=False)
    op.create_unique_constraint('uq_reports_tracking_code', 'reports', ['tracking_code'])
    op.create_index('ix_reports_tracking_code', 'reports', ['tracking_code'])


def downgrade() -> None:
    op.drop_index('ix_reports_tracking_code', table_name='reports')
    op.drop_constraint('uq_reports_tracking_code', 'reports', type_='unique')
    op.drop_column('reports', 'tracking_code')
    op.alter_column('reports', 'user_id', nullable=False)