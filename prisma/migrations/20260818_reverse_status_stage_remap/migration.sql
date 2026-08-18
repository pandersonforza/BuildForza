-- Reverse the status/stage remap from the reverted commit.
-- Original mapping was: Active→Construction, On Hold→Planning, Dead→Planning, Completed→Closeout
-- Stage mapping was:    Pre-Development→Planning, Permitting→Planning

-- Restore statuses
UPDATE "Project" SET "status" = 'Active'    WHERE "status" = 'Construction';
UPDATE "Project" SET "status" = 'On Hold'   WHERE "status" = 'Planning';
UPDATE "Project" SET "status" = 'Completed' WHERE "status" = 'Closeout';

-- Restore stages (Planning could have been Pre-Development or Permitting; default to Pre-Development)
UPDATE "Project" SET "stage" = 'Pre-Development' WHERE "stage" = 'Planning';
