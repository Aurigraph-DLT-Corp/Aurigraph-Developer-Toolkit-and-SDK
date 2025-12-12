-- V17: Add CDN URL column to file_attachments table
-- MinIO CDN Integration (December 2025)
-- Files are uploaded to MinIO and served via nginx CDN proxy

-- Add cdn_url column for MinIO CDN URLs
ALTER TABLE file_attachments
ADD COLUMN IF NOT EXISTS cdn_url VARCHAR(500);

-- Create index for CDN URL lookups
CREATE INDEX IF NOT EXISTS idx_file_attachments_cdn_url
ON file_attachments(cdn_url)
WHERE cdn_url IS NOT NULL;

-- Make storage_path nullable (MinIO-only files don't need local storage)
ALTER TABLE file_attachments
ALTER COLUMN storage_path DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN file_attachments.cdn_url IS 'MinIO CDN URL for file access (e.g., https://dlt.aurigraph.io/cdn/attachments/file.pdf)';
