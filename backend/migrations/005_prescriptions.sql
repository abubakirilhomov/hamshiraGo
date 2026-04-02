-- 005_prescriptions.sql
-- Prescriptions: doctor prescribes a service → client confirms with address → auto-order

CREATE TABLE IF NOT EXISTS prescriptions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "consultationId" UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    "clientId"      UUID NOT NULL,
    "serviceId"     UUID NOT NULL,
    "serviceTitle"  VARCHAR(255) NOT NULL,
    "servicePrice"  INT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "orderId"       UUID,
    "doctorNotes"   TEXT,
    "createdAt"     TIMESTAMP DEFAULT NOW(),
    "expiresAt"     TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_client ON prescriptions ("clientId");
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions ("consultationId");
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions (status);
