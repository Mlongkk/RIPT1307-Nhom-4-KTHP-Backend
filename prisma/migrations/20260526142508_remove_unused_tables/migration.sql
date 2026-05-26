-- Drop tables that are not being used
-- Drop Service
DROP TABLE IF EXISTS "Service" CASCADE;

-- Drop ClinicInfo
DROP TABLE IF EXISTS "ClinicInfo" CASCADE;

-- Drop serviceId from Appointment table if it exists
ALTER TABLE "Appointment" DROP COLUMN IF EXISTS "serviceId";
