-- 003_subscriptions.sql — Subscription tiers & user subscriptions
-- Idempotent: safe to run multiple times

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  "nameUz" VARCHAR(100),
  description TEXT,
  "descriptionUz" TEXT,
  price INT NOT NULL,
  "billingDays" INT DEFAULT 30,
  "maxOrders" INT DEFAULT 10,
  "discountPercent" INT DEFAULT 15,
  "isActive" BOOLEAN DEFAULT true,
  "sortOrder" INT DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "tierId" UUID NOT NULL REFERENCES subscription_tiers(id),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  "ordersUsed" INT DEFAULT 0,
  "startDate" TIMESTAMPTZ NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Seed default tiers
INSERT INTO subscription_tiers (name, "nameUz", price, "billingDays", "maxOrders", "discountPercent", "sortOrder")
VALUES
  ('Базовый', 'Asosiy', 500000, 30, 5, 10, 1),
  ('Семейный', 'Oilaviy', 900000, 30, 10, 15, 2),
  ('Премиум', 'Premium', 1500000, 30, 20, 20, 3)
ON CONFLICT DO NOTHING;
