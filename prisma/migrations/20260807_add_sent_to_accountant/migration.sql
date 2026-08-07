-- Add sentToAccountant flag to Invoice
ALTER TABLE "Invoice" ADD COLUMN "sentToAccountant" BOOLEAN NOT NULL DEFAULT false;
