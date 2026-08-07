-- Backfill: mark all existing Approved and Paid invoices as sent to accountant
UPDATE "Invoice" SET "sentToAccountant" = true WHERE "status" IN ('Approved', 'Paid');
