-- 006_nps.sql
-- NPS surveys: monthly user satisfaction tracking

CREATE TABLE IF NOT EXISTS nps_surveys (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId"    UUID NOT NULL,
    score       SMALLINT NOT NULL CHECK (score >= 0 AND score <= 10),
    comment     TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nps_surveys_user ON nps_surveys ("userId");
CREATE INDEX IF NOT EXISTS idx_nps_surveys_created ON nps_surveys ("createdAt");
