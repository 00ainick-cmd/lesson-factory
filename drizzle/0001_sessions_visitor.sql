ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "visitor_id" text;
CREATE INDEX IF NOT EXISTS "sessions_visitor_idx" ON "sessions" ("visitor_id");
