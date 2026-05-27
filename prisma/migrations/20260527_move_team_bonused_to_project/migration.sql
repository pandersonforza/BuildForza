-- Move teamBonused from Milestone to Project
ALTER TABLE "Project" ADD COLUMN "teamBonused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Milestone" DROP COLUMN IF EXISTS "teamBonused";
