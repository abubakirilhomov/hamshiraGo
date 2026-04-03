-- 010_admin_audit_log.sql
-- Audit log for admin actions

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "adminId"    VARCHAR(100) NOT NULL,
    action       VARCHAR(100) NOT NULL,
    "targetType" VARCHAR(50),
    "targetId"   VARCHAR(100),
    details      TEXT,
    ip           VARCHAR(50),
    "createdAt"  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_logs ("adminId");
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs ("createdAt");
