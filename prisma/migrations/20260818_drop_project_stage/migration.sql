-- Remove the stage column from Project; status is the only categorization field going forward.
DROP INDEX IF EXISTS "Project_stage_idx";
ALTER TABLE "Project" DROP COLUMN IF EXISTS "stage";
