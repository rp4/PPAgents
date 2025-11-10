-- Remove ratings and downloads models and related fields

-- Drop ratings table
DROP TABLE IF EXISTS "ratings" CASCADE;

-- Drop downloads table
DROP TABLE IF EXISTS "downloads" CASCADE;

-- Remove downloads_count, ratings_count, and avg_rating columns from agents table
ALTER TABLE "agents" DROP COLUMN IF EXISTS "downloads_count";
ALTER TABLE "agents" DROP COLUMN IF EXISTS "ratings_count";
ALTER TABLE "agents" DROP COLUMN IF EXISTS "avg_rating";

-- Drop index on downloads_count (if it exists)
DROP INDEX IF EXISTS "agents_is_public_downloads_count_idx";

-- Create new index on favorites_count
CREATE INDEX IF NOT EXISTS "agents_is_public_favorites_count_idx" ON "agents"("is_public" ASC, "favorites_count" DESC);
