-- Create API Debug Logs Table for Troubleshooting
-- Run this on Cloud SQL database before deploying v2.6.29

-- Drop table if exists (for clean re-run)
IF OBJECT_ID('api_debug_logs', 'U') IS NOT NULL
    DROP TABLE api_debug_logs;
GO

-- Create the debug logs table
CREATE TABLE api_debug_logs (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    flashcard_id UNIQUEIDENTIFIER NULL,
    operation_type NVARCHAR(50) NOT NULL,  -- 'image_generation', 'audio_generation', 'batch_generate'
    word NVARCHAR(500) NULL,
    status NVARCHAR(20) NOT NULL,  -- 'started', 'success', 'failed', 'skipped'
    step NVARCHAR(100) NULL,  -- Current processing step
    input_data NVARCHAR(MAX) NULL,  -- JSON input parameters
    output_data NVARCHAR(MAX) NULL,  -- JSON output/result
    error_message NVARCHAR(MAX) NULL,
    error_traceback NVARCHAR(MAX) NULL,
    duration_ms INT NULL,
    api_provider NVARCHAR(50) NULL,  -- 'openai', 'google_cloud', etc.
    api_model NVARCHAR(50) NULL,  -- 'dall-e-3', 'gpt-4', etc.
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- Create indexes for performance
CREATE INDEX ix_api_debug_logs_flashcard_id ON api_debug_logs(flashcard_id);
CREATE INDEX ix_api_debug_logs_operation_type ON api_debug_logs(operation_type);
CREATE INDEX ix_api_debug_logs_created_at ON api_debug_logs(created_at DESC);
CREATE INDEX ix_api_debug_logs_status ON api_debug_logs(status);
GO

-- Verify table creation
SELECT 'API Debug Logs table created successfully' AS Result;
SELECT COUNT(*) AS InitialRowCount FROM api_debug_logs;
GO
