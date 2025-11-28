"""Add tenant_id column to projects table

Revision ID: 002_add_tenant_id
Revises: 001_initial_schema
Create Date: 2024-11-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_tenant_id'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add tenant_id column to projects table
    op.add_column('projects', sa.Column('tenant_id', sa.String(36), nullable=True))
    # Create index for tenant_id for efficient filtering
    op.create_index('ix_projects_tenant_id', 'projects', ['tenant_id'])


def downgrade() -> None:
    op.drop_index('ix_projects_tenant_id', table_name='projects')
    op.drop_column('projects', 'tenant_id')
