INSERT INTO "Group" ("id", "name", "sortOrder", "createdAt")
VALUES
  (gen_random_uuid()::text, 'Forza',  0, NOW()),
  (gen_random_uuid()::text, 'F7B',    1, NOW()),
  (gen_random_uuid()::text, 'Harman', 2, NOW()),
  (gen_random_uuid()::text, 'H7B',    3, NOW())
ON CONFLICT ("name") DO NOTHING;
