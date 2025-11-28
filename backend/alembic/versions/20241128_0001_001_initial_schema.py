"""Initial schema with projects, jar_tests, and jar_test_counter tables

Revision ID: 001_initial_schema
Revises:
Create Date: 2024-11-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get dialect to use JSONB for PostgreSQL, JSON for SQLite
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == 'postgresql':
        json_type = postgresql.JSONB
    else:
        json_type = sa.JSON

    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('plant_configuration', json_type, nullable=False),
        sa.Column('jar_test_id', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Create jar_tests table
    op.create_table(
        'jar_tests',
        sa.Column('id', sa.String(20), primary_key=True),
        sa.Column('date', sa.Date, nullable=False),
        sa.Column('sample', json_type, nullable=False),
        sa.Column('polymer', json_type, nullable=False),
        sa.Column('doses', json_type, nullable=False),
        sa.Column('analysis', json_type, nullable=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Create jar_test_counter table for sequential ID generation
    op.create_table(
        'jar_test_counter',
        sa.Column('year', sa.Integer, primary_key=True),
        sa.Column('counter', sa.Integer, default=0),
    )


def downgrade() -> None:
    op.drop_table('jar_test_counter')
    op.drop_table('jar_tests')
    op.drop_table('projects')
