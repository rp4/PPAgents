-- DropIndex
DROP INDEX "public"."profiles_username_idx";

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "benefit_id" TEXT,
ADD COLUMN     "benefits_desc" TEXT,
ADD COLUMN     "data" TEXT,
ADD COLUMN     "link" TEXT,
ADD COLUMN     "ops_status_id" TEXT,
ADD COLUMN     "phase_id" TEXT;

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefits" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ops_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "phases_name_key" ON "phases"("name");

-- CreateIndex
CREATE UNIQUE INDEX "phases_slug_key" ON "phases"("slug");

-- CreateIndex
CREATE INDEX "phases_slug_idx" ON "phases"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "benefits_name_key" ON "benefits"("name");

-- CreateIndex
CREATE UNIQUE INDEX "benefits_slug_key" ON "benefits"("slug");

-- CreateIndex
CREATE INDEX "benefits_slug_idx" ON "benefits"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ops_statuses_name_key" ON "ops_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ops_statuses_slug_key" ON "ops_statuses"("slug");

-- CreateIndex
CREATE INDEX "ops_statuses_slug_idx" ON "ops_statuses"("slug");

-- CreateIndex
CREATE INDEX "agents_phase_id_idx" ON "agents"("phase_id");

-- CreateIndex
CREATE INDEX "agents_benefit_id_idx" ON "agents"("benefit_id");

-- CreateIndex
CREATE INDEX "agents_ops_status_id_idx" ON "agents"("ops_status_id");

-- CreateIndex
CREATE INDEX "profiles_username_idx" ON "profiles"("username" text_pattern_ops);

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_benefit_id_fkey" FOREIGN KEY ("benefit_id") REFERENCES "benefits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_ops_status_id_fkey" FOREIGN KEY ("ops_status_id") REFERENCES "ops_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
