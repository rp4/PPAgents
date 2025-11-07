-- DropIndex
DROP INDEX "public"."profiles_username_idx";

-- CreateIndex
CREATE INDEX "profiles_username_idx" ON "profiles"("username" text_pattern_ops);
