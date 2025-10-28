"""Add API debug logs table

Revision ID: add_api_debug_logs
Revises: 
Create Date: 2025-10-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mssql

# revision identifiers, used by Alembic.
revision = 'add_api_debug_logs'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'api_debug_logs',
        sa.Column('id', mssql.UNIQUEIDENTIFIER(), nullable=False),
        sa.Column('flashcard_id', mssql.UNIQUEIDENTIFIER(), nullable=True),
        sa.Column('operation_type', mssql.NVARCHAR(50), nullable=False),  # 'image_generation', 'audio_generation', 'batch_generate'
        sa.Column('word', mssql.NVARCHAR(500), nullable=True),
        sa.Column('status', mssql.NVARCHAR(20), nullable=False),  # 'started', 'success', 'failed'
        sa.Column('step', mssql.NVARCHAR(100), nullable=True),  # Current processing step
        sa.Column('input_data', mssql.NVARCHAR(None), nullable=True),  # JSON input parameters
        sa.Column('output_data', mssql.NVARCHAR(None), nullable=True),  # JSON output/result
        sa.Column('error_message', mssql.NVARCHAR(None), nullable=True),
        sa.Column('error_traceback', mssql.NVARCHAR(None), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('api_provider', mssql.NVARCHAR(50), nullable=True),  # 'openai', 'google_cloud', etc.
        sa.Column('api_model', mssql.NVARCHAR(50), nullable=True),  # 'dall-e-3', 'gpt-4', etc.
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('GETDATE()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add index on flashcard_id for quick lookups
    op.create_index('ix_api_debug_logs_flashcard_id', 'api_debug_logs', ['flashcard_id'])
    op.create_index('ix_api_debug_logs_operation_type', 'api_debug_logs', ['operation_type'])
    op.create_index('ix_api_debug_logs_created_at', 'api_debug_logs', ['created_at'])


def downgrade():
    op.drop_index('ix_api_debug_logs_created_at', 'api_debug_logs')
    op.drop_index('ix_api_debug_logs_operation_type', 'api_debug_logs')
    op.drop_index('ix_api_debug_logs_flashcard_id', 'api_debug_logs')
    op.drop_table('api_debug_logs')
