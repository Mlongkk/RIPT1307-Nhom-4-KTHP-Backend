-- Drop tables that are not being used
-- Drop InvoiceItem first (foreign key dependency)
DROP TABLE IF EXISTS "InvoiceItem" CASCADE;

-- Drop Invoice
DROP TABLE IF EXISTS "Invoice" CASCADE;

-- Drop Service
DROP TABLE IF EXISTS "Service" CASCADE;

-- Drop ClinicInfo
DROP TABLE IF EXISTS "ClinicInfo" CASCADE;

-- Drop InvoiceStatus enum
DROP TYPE IF EXISTS "InvoiceStatus" CASCADE;

-- Drop serviceId from Appointment table if it exists
ALTER TABLE "Appointment" DROP COLUMN IF EXISTS "serviceId";
