-- Remap project statuses to new three-value set
UPDATE "Project" SET "status" = 'Construction' WHERE "status" = 'Active';
UPDATE "Project" SET "status" = 'Planning'     WHERE "status" = 'On Hold';
UPDATE "Project" SET "status" = 'Planning'     WHERE "status" = 'Dead';
UPDATE "Project" SET "status" = 'Closeout'     WHERE "status" = 'Completed';

-- Merge Pre-Development and Permitting stages into Planning
UPDATE "Project" SET "stage" = 'Planning' WHERE "stage" = 'Pre-Development';
UPDATE "Project" SET "stage" = 'Planning' WHERE "stage" = 'Permitting';
