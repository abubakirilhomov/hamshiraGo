-- ============================================================================
-- HamshiraGo: Full schema sync migration
-- Generated: 2026-03-31
--
-- This script is IDEMPOTENT. Safe to run multiple times.
-- All new columns on existing tables are NULLABLE to avoid breaking Railway.
-- Uses gen_random_uuid() (PostgreSQL 13+).
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENUM TYPES (create if not exist)
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orders_status_enum') THEN
    CREATE TYPE orders_status_enum AS ENUM (
      'CREATED','ASSIGNED','ACCEPTED','ON_THE_WAY','ARRIVED','SERVICE_STARTED','DONE','CANCELED'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'medics_verificationstatus_enum') THEN
    CREATE TYPE medics_verificationstatus_enum AS ENUM ('PENDING','APPROVED','REJECTED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispatch_attempts_result_enum') THEN
    CREATE TYPE dispatch_attempts_result_enum AS ENUM ('PENDING','ACCEPTED','DECLINED','TIMEOUT');
  END IF;
END $$;

-- Add missing enum values to existing types (safe: IF NOT EXISTS on each value)
-- Order status might be missing newer values
DO $$ BEGIN
  ALTER TYPE orders_status_enum ADD VALUE IF NOT EXISTS 'ASSIGNED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE orders_status_enum ADD VALUE IF NOT EXISTS 'ON_THE_WAY';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE orders_status_enum ADD VALUE IF NOT EXISTS 'ARRIVED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE orders_status_enum ADD VALUE IF NOT EXISTS 'SERVICE_STARTED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. TABLE: users
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  "passwordHash" VARCHAR(255) NOT NULL,
  "pushToken" VARCHAR,
  "isBlocked" BOOLEAN DEFAULT false,
  "referralCode" VARCHAR(10) DEFAULT NULL,
  "referredBy" VARCHAR(10) DEFAULT NULL,
  "referralBonusUsed" BOOLEAN DEFAULT false,
  "pendingReferralDiscount" INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns to users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='referralCode') THEN
    ALTER TABLE users ADD COLUMN "referralCode" VARCHAR(10) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='referredBy') THEN
    ALTER TABLE users ADD COLUMN "referredBy" VARCHAR(10) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='referralBonusUsed') THEN
    ALTER TABLE users ADD COLUMN "referralBonusUsed" BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pendingReferralDiscount') THEN
    ALTER TABLE users ADD COLUMN "pendingReferralDiscount" INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pushToken') THEN
    ALTER TABLE users ADD COLUMN "pushToken" VARCHAR DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='isBlocked') THEN
    ALTER TABLE users ADD COLUMN "isBlocked" BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Indexes on users
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_phone" ON users (phone);
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_referralCode" ON users ("referralCode") WHERE "referralCode" IS NOT NULL;

-- ============================================================================
-- 3. TABLE: medics
-- ============================================================================

CREATE TABLE IF NOT EXISTS medics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  rating DECIMAL(3,2) DEFAULT NULL,
  "reviewCount" INT NOT NULL DEFAULT 0,
  "experienceYears" INT NOT NULL DEFAULT 0,
  "isOnline" BOOLEAN NOT NULL DEFAULT false,
  "isBlocked" BOOLEAN DEFAULT false,
  "verificationStatus" medics_verificationstatus_enum DEFAULT 'PENDING',
  "facePhotoUrl" VARCHAR(512) DEFAULT NULL,
  "licensePhotoUrl" VARCHAR(512) DEFAULT NULL,
  "profilePhotoUrl" VARCHAR(512) DEFAULT NULL,
  "verificationRejectedReason" TEXT DEFAULT NULL,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  earnings DECIMAL(12,2) DEFAULT 0,
  "pushToken" VARCHAR DEFAULT NULL,
  "telegramChatId" BIGINT DEFAULT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  "workZoneLat" DECIMAL(10,7),
  "workZoneLng" DECIMAL(10,7),
  "workZoneRadius" DECIMAL(5,2),
  "lastSeenAt" TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns to medics
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='earnings') THEN
    ALTER TABLE medics ADD COLUMN earnings DECIMAL(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='telegramChatId') THEN
    ALTER TABLE medics ADD COLUMN "telegramChatId" BIGINT DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='workZoneLat') THEN
    ALTER TABLE medics ADD COLUMN "workZoneLat" DECIMAL(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='workZoneLng') THEN
    ALTER TABLE medics ADD COLUMN "workZoneLng" DECIMAL(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='workZoneRadius') THEN
    ALTER TABLE medics ADD COLUMN "workZoneRadius" DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='lastSeenAt') THEN
    ALTER TABLE medics ADD COLUMN "lastSeenAt" TIMESTAMP DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='profilePhotoUrl') THEN
    ALTER TABLE medics ADD COLUMN "profilePhotoUrl" VARCHAR(512) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='verificationRejectedReason') THEN
    ALTER TABLE medics ADD COLUMN "verificationRejectedReason" TEXT DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='balance') THEN
    ALTER TABLE medics ADD COLUMN balance DECIMAL(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='isBlocked') THEN
    ALTER TABLE medics ADD COLUMN "isBlocked" BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='verificationStatus') THEN
    ALTER TABLE medics ADD COLUMN "verificationStatus" medics_verificationstatus_enum DEFAULT 'PENDING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='facePhotoUrl') THEN
    ALTER TABLE medics ADD COLUMN "facePhotoUrl" VARCHAR(512) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='licensePhotoUrl') THEN
    ALTER TABLE medics ADD COLUMN "licensePhotoUrl" VARCHAR(512) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='pushToken') THEN
    ALTER TABLE medics ADD COLUMN "pushToken" VARCHAR DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='latitude') THEN
    ALTER TABLE medics ADD COLUMN latitude DECIMAL(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='longitude') THEN
    ALTER TABLE medics ADD COLUMN longitude DECIMAL(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='reviewCount') THEN
    ALTER TABLE medics ADD COLUMN "reviewCount" INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medics' AND column_name='experienceYears') THEN
    ALTER TABLE medics ADD COLUMN "experienceYears" INT DEFAULT 0;
  END IF;
END $$;

-- Indexes on medics
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_medics_phone" ON medics (phone);
CREATE INDEX IF NOT EXISTS "IDX_medics_isOnline" ON medics ("isOnline");
CREATE INDEX IF NOT EXISTS "IDX_medics_verificationStatus" ON medics ("verificationStatus");

-- ============================================================================
-- 4. TABLE: services
-- ============================================================================

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  "titleUz" VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  "descriptionUz" TEXT DEFAULT NULL,
  category VARCHAR(100) DEFAULT NULL,
  "categoryUz" VARCHAR(100) DEFAULT NULL,
  price INT NOT NULL,
  "durationMinutes" INT DEFAULT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns to services
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='titleUz') THEN
    ALTER TABLE services ADD COLUMN "titleUz" VARCHAR(255) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='descriptionUz') THEN
    ALTER TABLE services ADD COLUMN "descriptionUz" TEXT DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='categoryUz') THEN
    ALTER TABLE services ADD COLUMN "categoryUz" VARCHAR(100) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='durationMinutes') THEN
    ALTER TABLE services ADD COLUMN "durationMinutes" INT DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='sortOrder') THEN
    ALTER TABLE services ADD COLUMN "sortOrder" INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='category') THEN
    ALTER TABLE services ADD COLUMN category VARCHAR(100) DEFAULT NULL;
  END IF;
END $$;

-- ============================================================================
-- 5. TABLE: orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "medicId" UUID REFERENCES medics(id) ON DELETE SET NULL,
  "serviceId" VARCHAR(255),
  "serviceTitle" VARCHAR(255),
  "priceAmount" INT,
  "discountAmount" INT DEFAULT 0,
  "platformFee" INT DEFAULT 0,
  status orders_status_enum NOT NULL DEFAULT 'CREATED',
  "dispatchStatus" VARCHAR(50) DEFAULT NULL,
  "cancelReason" VARCHAR(500),
  "isUrgent" BOOLEAN,
  "urgentFee" DECIMAL(10,0),
  "clientRating" SMALLINT DEFAULT NULL,
  "clientReview" VARCHAR(1000) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns to orders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='serviceId') THEN
    ALTER TABLE orders ADD COLUMN "serviceId" VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='serviceTitle') THEN
    ALTER TABLE orders ADD COLUMN "serviceTitle" VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='priceAmount') THEN
    ALTER TABLE orders ADD COLUMN "priceAmount" INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discountAmount') THEN
    ALTER TABLE orders ADD COLUMN "discountAmount" INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='platformFee') THEN
    ALTER TABLE orders ADD COLUMN "platformFee" INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='dispatchStatus') THEN
    ALTER TABLE orders ADD COLUMN "dispatchStatus" VARCHAR(50) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='cancelReason') THEN
    ALTER TABLE orders ADD COLUMN "cancelReason" VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='isUrgent') THEN
    ALTER TABLE orders ADD COLUMN "isUrgent" BOOLEAN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='urgentFee') THEN
    ALTER TABLE orders ADD COLUMN "urgentFee" DECIMAL(10,0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='clientRating') THEN
    ALTER TABLE orders ADD COLUMN "clientRating" SMALLINT DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='clientReview') THEN
    ALTER TABLE orders ADD COLUMN "clientReview" VARCHAR(1000) DEFAULT NULL;
  END IF;
END $$;

-- Indexes on orders
CREATE INDEX IF NOT EXISTS "IDX_orders_clientId" ON orders ("clientId");
CREATE INDEX IF NOT EXISTS "IDX_orders_medicId" ON orders ("medicId");
CREATE INDEX IF NOT EXISTS "IDX_orders_created_at" ON orders (created_at);

-- ============================================================================
-- 6. TABLE: order_locations
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  house VARCHAR(255) NOT NULL,
  floor VARCHAR(20),
  apartment VARCHAR(20),
  phone VARCHAR(30) NOT NULL
);

-- ============================================================================
-- 7. TABLE: dispatch_attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "medicId" UUID NOT NULL REFERENCES medics(id) ON DELETE CASCADE,
  "sentAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMP NOT NULL,
  result dispatch_attempts_result_enum NOT NULL DEFAULT 'PENDING'
);

CREATE INDEX IF NOT EXISTS "IDX_dispatch_attempts_orderId" ON dispatch_attempts ("orderId");
CREATE INDEX IF NOT EXISTS "IDX_dispatch_attempts_medicId" ON dispatch_attempts ("medicId");
CREATE INDEX IF NOT EXISTS "IDX_dispatch_attempts_composite" ON dispatch_attempts ("orderId", "medicId", result);

-- ============================================================================
-- 8. TABLE: reviews
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" VARCHAR(255) NOT NULL,
  "authorId" VARCHAR(255) NOT NULL,
  "authorRole" VARCHAR(10) NOT NULL,
  "targetId" VARCHAR(255) NOT NULL,
  "targetRole" VARCHAR(10) NOT NULL,
  rating SMALLINT NOT NULL,
  comment VARCHAR(1000) DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite unique constraint: one review per order per author-target role pair
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UQ_reviews_order_author_target'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT "UQ_reviews_order_author_target"
      UNIQUE ("orderId", "authorRole", "targetRole");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IDX_reviews_orderId" ON reviews ("orderId");
CREATE INDEX IF NOT EXISTS "IDX_reviews_authorId" ON reviews ("authorId");
CREATE INDEX IF NOT EXISTS "IDX_reviews_targetId" ON reviews ("targetId");

-- ============================================================================
-- 9. TABLE: referrals
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "referrerId" VARCHAR(255) NOT NULL,
  "referredId" VARCHAR(255) NOT NULL,
  "bonusPaid" BOOLEAN NOT NULL DEFAULT false,
  "bonusAmount" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 10. TABLE: treatment_courses
-- ============================================================================

CREATE TABLE IF NOT EXISTS treatment_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  "serviceId" VARCHAR(255) NOT NULL,
  "totalProcedures" INT NOT NULL,
  "completedProcedures" INT NOT NULL DEFAULT 0,
  "intervalDays" INT NOT NULL,
  "nextDate" TIMESTAMP,
  status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
  "reminderSentToday" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing column reminderSentToday if table existed before
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment_courses' AND column_name='reminderSentToday') THEN
    ALTER TABLE treatment_courses ADD COLUMN "reminderSentToday" BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- 11. TABLE: favorite_medics
-- ============================================================================

CREATE TABLE IF NOT EXISTS favorite_medics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "medicId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite unique: one favorite per user-medic pair
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UQ_favorite_medics_user_medic'
  ) THEN
    ALTER TABLE favorite_medics ADD CONSTRAINT "UQ_favorite_medics_user_medic"
      UNIQUE ("userId", "medicId");
  END IF;
END $$;

-- ============================================================================
-- 12. TABLE: medical_cards
-- ============================================================================

CREATE TABLE IF NOT EXISTS medical_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE,
  "bloodType" VARCHAR(10),
  allergies TEXT,
  "chronicDiseases" TEXT,
  notes TEXT,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 13. TABLE: app_settings (singleton row)
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  id VARCHAR(20) PRIMARY KEY,
  "isPaidMode" BOOLEAN NOT NULL DEFAULT false,
  "commissionRate" INT NOT NULL DEFAULT 10,
  "urgentFeePercent" INT,
  "urgentStartHour" INT,
  "urgentEndHour" INT,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure singleton row exists
INSERT INTO app_settings (id, "isPaidMode", "commissionRate")
VALUES ('singleton', false, 10)
ON CONFLICT (id) DO NOTHING;

-- Add missing columns to app_settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_settings' AND column_name='urgentFeePercent') THEN
    ALTER TABLE app_settings ADD COLUMN "urgentFeePercent" INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_settings' AND column_name='urgentStartHour') THEN
    ALTER TABLE app_settings ADD COLUMN "urgentStartHour" INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_settings' AND column_name='urgentEndHour') THEN
    ALTER TABLE app_settings ADD COLUMN "urgentEndHour" INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_settings' AND column_name='isPaidMode') THEN
    ALTER TABLE app_settings ADD COLUMN "isPaidMode" BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_settings' AND column_name='commissionRate') THEN
    ALTER TABLE app_settings ADD COLUMN "commissionRate" INT NOT NULL DEFAULT 10;
  END IF;
END $$;

-- ============================================================================
-- 14. TABLE: client_errors
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" VARCHAR(36) DEFAULT NULL,
  "appType" VARCHAR(20) DEFAULT NULL,
  screen VARCHAR(255) DEFAULT NULL,
  message VARCHAR(500) DEFAULT NULL,
  stacktrace TEXT DEFAULT NULL,
  meta TEXT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'NEW',
  "deviceInfo" VARCHAR(200) DEFAULT NULL,
  "appVersion" VARCHAR(50) DEFAULT NULL,
  "errorCode" VARCHAR(100) DEFAULT NULL,
  count INT DEFAULT 1,
  "resolvedAt" TIMESTAMP DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns to client_errors
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_errors' AND column_name='appType') THEN
    ALTER TABLE client_errors ADD COLUMN "appType" VARCHAR(20) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_errors' AND column_name='screen') THEN
    ALTER TABLE client_errors ADD COLUMN screen VARCHAR(255) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_errors' AND column_name='deviceInfo') THEN
    ALTER TABLE client_errors ADD COLUMN "deviceInfo" VARCHAR(200) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_errors' AND column_name='appVersion') THEN
    ALTER TABLE client_errors ADD COLUMN "appVersion" VARCHAR(50) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_errors' AND column_name='errorCode') THEN
    ALTER TABLE client_errors ADD COLUMN "errorCode" VARCHAR(100) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_errors' AND column_name='count') THEN
    ALTER TABLE client_errors ADD COLUMN count INT DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_errors' AND column_name='resolvedAt') THEN
    ALTER TABLE client_errors ADD COLUMN "resolvedAt" TIMESTAMP DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_errors' AND column_name='status') THEN
    ALTER TABLE client_errors ADD COLUMN status VARCHAR(20) DEFAULT 'NEW';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_errors' AND column_name='meta') THEN
    ALTER TABLE client_errors ADD COLUMN meta TEXT DEFAULT NULL;
  END IF;
END $$;

-- ============================================================================
-- DONE
-- ============================================================================

COMMIT;
