-- Loyalty fields on users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='loyaltyPoints') THEN
    ALTER TABLE users ADD COLUMN "loyaltyPoints" INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='loyaltyTier') THEN
    ALTER TABLE users ADD COLUMN "loyaltyTier" VARCHAR(10) DEFAULT 'BRONZE';
  END IF;
END $$;

-- Loyalty transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "orderId" UUID,
  type VARCHAR(20) NOT NULL,
  points INT NOT NULL,
  description VARCHAR(255),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user ON loyalty_transactions("userId");

-- AppSettings loyalty columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_settings' AND column_name='loyaltyPointsPerOrder') THEN
    ALTER TABLE app_settings ADD COLUMN "loyaltyPointsPerOrder" INT DEFAULT 100;
    ALTER TABLE app_settings ADD COLUMN "loyaltySilverThreshold" INT DEFAULT 500;
    ALTER TABLE app_settings ADD COLUMN "loyaltyGoldThreshold" INT DEFAULT 2000;
    ALTER TABLE app_settings ADD COLUMN "loyaltyRedemptionRate" INT DEFAULT 1000;
  END IF;
END $$;
