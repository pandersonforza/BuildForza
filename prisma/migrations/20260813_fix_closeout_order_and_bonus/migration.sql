-- Fix section sort order: zero-pad single-digit category prefixes so "09." < "10."
-- (string sort on "9." > "10." because '9' > '1', but "09." < "10." sorts correctly)
UPDATE "CloseoutItem" SET "category" = '01. Deal Setup & Team Coordination'      WHERE "category" = '1. Deal Setup & Team Coordination';
UPDATE "CloseoutItem" SET "category" = '02. Legal & Corporate'                    WHERE "category" = '2. Legal & Corporate';
UPDATE "CloseoutItem" SET "category" = '03. Title, Survey & Legal Description'    WHERE "category" = '3. Title, Survey & Legal Description';
UPDATE "CloseoutItem" SET "category" = '04. Entitlements, Permits & Compliance'   WHERE "category" = '4. Entitlements, Permits & Compliance';
UPDATE "CloseoutItem" SET "category" = '05. Construction Closeout'                WHERE "category" = '5. Construction Closeout';
UPDATE "CloseoutItem" SET "category" = '06. Financial, Lender & Tax'              WHERE "category" = '6. Financial, Lender & Tax';
UPDATE "CloseoutItem" SET "category" = '07. Leasing & Tenancy'                    WHERE "category" = '7. Leasing & Tenancy';
UPDATE "CloseoutItem" SET "category" = '08. Property Diligence Package for Buyer' WHERE "category" = '8. Property Diligence Package for Buyer';
UPDATE "CloseoutItem" SET "category" = '09. Purchase & Sale / Closing Mechanics'  WHERE "category" = '9. Purchase & Sale / Closing Mechanics';
-- "10. Post-Closing" prefix is already two digits; no rename needed

-- Add "Cut bonus checks for development team members" to every existing project
-- that already has Post-Closing items but doesn't yet have this item
INSERT INTO "CloseoutItem" ("id", "projectId", "category", "title", "sortOrder", "completed", "updatedAt")
SELECT
  gen_random_uuid()::text,
  p."projectId",
  '10. Post-Closing',
  'Cut bonus checks for development team members',
  6,
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
    AND ci."title" = 'Cut bonus checks for development team members'
);
