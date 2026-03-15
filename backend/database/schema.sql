-- =============================================================
-- Lite MES — Database Schema
-- PostgreSQL  >=14
-- Run:  psql $DATABASE_URL -f database/schema.sql
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Production Lines  (สายการผลิต)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lines (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 2. Processes  (ขั้นตอนการทำงาน)
--    Each process belongs to one line and has an explicit sequence
--    so admins can reorder without deleting rows.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS processes (
    id          SERIAL PRIMARY KEY,
    line_id     INTEGER      NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
    name        VARCHAR(120) NOT NULL,
    description TEXT,
    sequence    SMALLINT     NOT NULL DEFAULT 1,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (line_id, sequence)
);

-- ---------------------------------------------------------------
-- 3. Trays  (ถาดงาน)
--    A tray carries a batch of work through processes.
--    The QR code printed on the tray equals tray.qr_code.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trays (
    id          SERIAL PRIMARY KEY,
    qr_code     VARCHAR(64)  NOT NULL UNIQUE,
    line_id     INTEGER      REFERENCES lines(id) ON DELETE SET NULL,
    product     VARCHAR(120),
    batch_no    VARCHAR(64),
    qty         INTEGER      NOT NULL DEFAULT 1,
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','in_progress','completed','on_hold')),
    due_date    TIMESTAMPTZ,
    started_at  TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 4. Production Logs  (บันทึกการผลิต)
--    One row per action taken on a tray at a specific process.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_logs (
    id            SERIAL PRIMARY KEY,
    tray_id       INTEGER      NOT NULL REFERENCES trays(id) ON DELETE CASCADE,
    process_id    INTEGER      NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    operator      VARCHAR(80),
    action        VARCHAR(20)  NOT NULL
                               CHECK (action IN ('start','finish','ng')),
    note          TEXT,
    logged_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 5. Operators  (ข้อมูลผู้ปฏิบัติงาน)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operators (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(120) NOT NULL,
    employee_id  VARCHAR(40)  UNIQUE,
    department   VARCHAR(80),
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 6. Users  (บัญชีผู้ใช้ระบบ)
--    User accounts are separate from operator master data.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id             SERIAL PRIMARY KEY,
    employee_id    VARCHAR(40)  NOT NULL UNIQUE,
    name           VARCHAR(120) NOT NULL,
    password_hash  TEXT         NOT NULL,
    role           VARCHAR(20)  NOT NULL
                               CHECK (role IN ('superadmin','admin','operator','viewer')),
    operator_id    INTEGER      UNIQUE REFERENCES operators(id) ON DELETE SET NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_processes_line_id   ON processes(line_id);
CREATE INDEX IF NOT EXISTS idx_trays_qr_code        ON trays(qr_code);
CREATE INDEX IF NOT EXISTS idx_trays_line_id        ON trays(line_id);
CREATE INDEX IF NOT EXISTS idx_prod_logs_tray_id    ON production_logs(tray_id);
CREATE INDEX IF NOT EXISTS idx_prod_logs_process_id ON production_logs(process_id);
CREATE INDEX IF NOT EXISTS idx_prod_logs_logged_at  ON production_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_operators_employee_id ON operators(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_role           ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_operator_id    ON users(operator_id);

-- ---------------------------------------------------------------
-- Trigger: keep updated_at current on lines / processes / trays
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['lines','processes','trays','operators','users'] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = 'trg_' || t || '_updated_at'
        ) THEN
            EXECUTE format(
                'CREATE TRIGGER trg_%I_updated_at
                 BEFORE UPDATE ON %I
                 FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
                t, t
            );
        END IF;
    END LOOP;
END;
$$;

-- ---------------------------------------------------------------
-- Seed: demo data (safe to re-run — uses INSERT … ON CONFLICT)
-- ---------------------------------------------------------------
INSERT INTO lines (id, name, description) VALUES
    (1, 'SMT Line A',    'Surface Mount Technology — board assembly'),
    (2, 'Assembly Line B','Manual assembly and testing')
ON CONFLICT (id) DO NOTHING;

INSERT INTO processes (id, line_id, name, sequence) VALUES
    (1, 1, 'Solder Paste',    1),
    (2, 1, 'Pick & Place',    2),
    (3, 1, 'Reflow Oven',     3),
    (4, 1, 'AOI Inspection',  4),
    (5, 2, 'Sub-assembly',    1),
    (6, 2, 'Final Assembly',  2),
    (7, 2, 'Functional Test', 3),
    (8, 2, 'Packing',         4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO trays (id, qr_code, line_id, product, batch_no, qty) VALUES
    (1, 'TRAY-0001', 1, 'PCB-Model-X', 'BT-2024-001', 50),
    (2, 'TRAY-0002', 2, 'Widget-Pro',  'BT-2024-002', 30)
ON CONFLICT (id) DO NOTHING;

-- Demo operators (ผู้ปฏิบัติงานตัวอย่าง)
INSERT INTO operators (id, name, employee_id, department) VALUES
    (1, 'สมชาย ใจดี',    'EMP-001', 'SMT'),
    (2, 'สมหญิง รักงาน', 'EMP-002', 'Assembly')
ON CONFLICT (id) DO NOTHING;

-- Demo users (บัญชีผู้ใช้ระบบตัวอย่าง)
-- Password for all seeded users: Demo@1234
INSERT INTO users (employee_id, name, password_hash, role, operator_id, is_active) VALUES
    ('SA-0001', 'SuperAdmin One', '$2a$10$EbllIjC037XALT.LdBcyX.sne1pz.GJyrWePamFMJS4XYCP7GPkYu', 'superadmin', NULL, TRUE),
    ('SA-0002', 'SuperAdmin Two', '$2a$10$EbllIjC037XALT.LdBcyX.sne1pz.GJyrWePamFMJS4XYCP7GPkYu', 'superadmin', NULL, TRUE),
    ('AD-0001', 'Admin One',      '$2a$10$EbllIjC037XALT.LdBcyX.sne1pz.GJyrWePamFMJS4XYCP7GPkYu', 'admin',      NULL, TRUE),
    ('AD-0002', 'Admin Two',      '$2a$10$EbllIjC037XALT.LdBcyX.sne1pz.GJyrWePamFMJS4XYCP7GPkYu', 'admin',      NULL, TRUE),
    ('OP-0001', 'Operator One',   '$2a$10$EbllIjC037XALT.LdBcyX.sne1pz.GJyrWePamFMJS4XYCP7GPkYu', 'operator',   1,    TRUE),
    ('OP-0002', 'Operator Two',   '$2a$10$EbllIjC037XALT.LdBcyX.sne1pz.GJyrWePamFMJS4XYCP7GPkYu', 'operator',   2,    TRUE),
    ('VW-0001', 'Viewer One',     '$2a$10$EbllIjC037XALT.LdBcyX.sne1pz.GJyrWePamFMJS4XYCP7GPkYu', 'viewer',     NULL, TRUE),
    ('VW-0002', 'Viewer Two',     '$2a$10$EbllIjC037XALT.LdBcyX.sne1pz.GJyrWePamFMJS4XYCP7GPkYu', 'viewer',     NULL, TRUE)
ON CONFLICT (employee_id) DO NOTHING;

-- Reset sequences after seed
SELECT setval('lines_id_seq',      (SELECT MAX(id) FROM lines));
SELECT setval('processes_id_seq',  (SELECT MAX(id) FROM processes));
SELECT setval('trays_id_seq',      (SELECT MAX(id) FROM trays));
SELECT setval('operators_id_seq',  (SELECT MAX(id) FROM operators));
SELECT setval('users_id_seq',      COALESCE((SELECT MAX(id) FROM users), 1), true);
