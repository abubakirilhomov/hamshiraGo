-- 009_promo_codes.sql
-- Promo codes for marketing campaigns

CREATE TABLE IF NOT EXISTS promo_codes (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code             VARCHAR(50) NOT NULL UNIQUE,
    "discountAmount" INT NOT NULL DEFAULT 0,
    "discountPercent" INT NOT NULL DEFAULT 0,
    "maxUses"        INT NOT NULL DEFAULT 0,
    "usedCount"      INT NOT NULL DEFAULT 0,
    "expiresAt"      TIMESTAMP,
    "isActive"       BOOLEAN NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes (code);
