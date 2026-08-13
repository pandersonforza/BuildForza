INSERT INTO "CloseoutItem" ("id", "projectId", "category", "title", "sortOrder", "completed", "updatedAt")
SELECT
  gen_random_uuid()::text,
  p."projectId",
  '10. Post-Closing',
  'Confirm with PM they have all items for a clean hand-off',
  7,
  false,
  NOW()
FROM (
  SELECT DISTINCT "projectId"
  FROM "CloseoutItem"
  WHERE "category" = '10. Post-Closing'
) p
WHERE NOT EXISTS (
  SELECT 1 FROM "CloseoutItem" ci
  WHERE ci."projectId" = p."projectId"
    AND ci."title" = 'Confirm with PM they have all items for a clean hand-off'
);
