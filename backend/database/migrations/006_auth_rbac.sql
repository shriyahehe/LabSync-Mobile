
BEGIN;

-- =====================================================
-- 1. MIGRATION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. DEPARTMENTS
-- =====================================================

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (name, code) VALUES
    ('Chemistry', 'CHEM'),
    ('Physics', 'PHY'),
    ('Biology', 'BIO'),
    ('Electronics and Communication', 'ECE'),
    ('Computer Science', 'CSE');

ALTER TABLE laboratories
ADD COLUMN department_id INTEGER;

UPDATE laboratories l
SET department_id = d.id
FROM departments d
WHERE
    LOWER(TRIM(l.department)) = LOWER(TRIM(d.name))
    OR (
        UPPER(TRIM(l.department)) = 'CSE'
        AND d.code = 'CSE'
    );

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM laboratories
        WHERE department_id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Some laboratories could not be mapped to a department';
    END IF;
END $$;

ALTER TABLE laboratories
ALTER COLUMN department_id SET NOT NULL;

ALTER TABLE laboratories
ADD CONSTRAINT fk_laboratories_department
FOREIGN KEY (department_id)
REFERENCES departments(id)
ON DELETE RESTRICT;

CREATE INDEX idx_laboratories_department
ON laboratories(department_id);

-- Correct known incorrect legacy department label.
UPDATE researchers
SET department = 'Biology'
WHERE department = 'Department Of Bioinformatics';

-- =====================================================
-- 3. USERS
-- =====================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_users_email_lower
ON users (LOWER(email));

ALTER TABLE researchers
ADD COLUMN user_id BIGINT UNIQUE
REFERENCES users(id)
ON DELETE SET NULL;

-- =====================================================
-- 4. ROLES
-- =====================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

INSERT INTO roles (name, description) VALUES
('SUPER_ADMIN', 'Full system access'),
('LAB_COORDINATOR', 'Operational management of assigned laboratories'),
('FACULTY', 'Department-wide laboratory access'),
('PHD_SCHOLAR', 'Research operations in assigned laboratory'),
('RESEARCH_SCHOLAR', 'Research operations in assigned laboratory');

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Super Admin must be the user's only role.
CREATE OR REPLACE FUNCTION enforce_super_admin_exclusivity()
RETURNS TRIGGER AS $$
DECLARE
    super_admin_id INTEGER;
BEGIN
    SELECT id INTO super_admin_id
    FROM roles
    WHERE name = 'SUPER_ADMIN';

    PERFORM 1
    FROM users
    WHERE id = NEW.user_id
    FOR UPDATE;

    IF NEW.role_id = super_admin_id THEN
        IF EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION
                'SUPER_ADMIN cannot be combined with other roles';
        END IF;
    ELSE
        IF EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = NEW.user_id
            AND r.name = 'SUPER_ADMIN'
        ) THEN
            RAISE EXCEPTION
                'Other roles cannot be assigned to a SUPER_ADMIN';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_super_admin_exclusivity
BEFORE INSERT OR UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION enforce_super_admin_exclusivity();

-- =====================================================
-- 5. USER SCOPE ASSIGNMENTS
-- =====================================================

CREATE TABLE user_departments (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, department_id)
);

CREATE TABLE user_laboratories (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    laboratory_id INTEGER NOT NULL REFERENCES laboratories(id) ON DELETE CASCADE,
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, laboratory_id)
);

-- =====================================================
-- 6. PERMISSIONS
-- =====================================================

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL
);

CREATE TABLE role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

INSERT INTO permissions (code, description) VALUES
('users.manage', 'Create, update and deactivate users'),
('roles.manage', 'Assign roles and permissions'),
('departments.manage', 'Manage departments'),
('laboratories.manage', 'Manage laboratories'),
('researchers.read', 'View researcher profiles'),
('researchers.manage', 'Create and update researcher profiles'),
('equipment.read', 'View equipment'),
('equipment.manage', 'Manage equipment'),
('equipment_transactions.manage', 'Record equipment checkout and return'),
('materials.read', 'View materials'),
('materials.manage', 'Manage materials'),
('inventory_transactions.manage', 'Record material consumption and restocking'),
('samples.read', 'View samples'),
('samples.manage', 'Manage samples and sample transactions'),
('experiments.read', 'View experiments'),
('experiments.manage', 'Manage experiments and experiment records'),
('lab_entries.read', 'View laboratory entry and exit records'),
('lab_entries.manage', 'Record laboratory entry and exit'),
('reports.read', 'View laboratory reports'),
('audit_logs.read', 'View audit logs');

-- Super Admin receives every permission.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN';

-- Lab Coordinator: operational management.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'LAB_COORDINATOR'
AND p.code IN (
    'researchers.read',
    'researchers.manage',
    'equipment.read',
    'equipment.manage',
    'equipment_transactions.manage',
    'materials.read',
    'materials.manage',
    'inventory_transactions.manage',
    'samples.read',
    'samples.manage',
    'experiments.read',
    'experiments.manage',
    'lab_entries.read',
    'lab_entries.manage',
    'reports.read'
);

-- Faculty: department-wide operational access.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'FACULTY'
AND p.code IN (
    'researchers.read',
    'researchers.manage',
    'equipment.read',
    'equipment_transactions.manage',
    'materials.read',
    'inventory_transactions.manage',
    'samples.read',
    'samples.manage',
    'experiments.read',
    'experiments.manage',
    'lab_entries.read',
    'lab_entries.manage',
    'reports.read'
);

-- PhD Scholar and Research Scholar: operational access.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('PHD_SCHOLAR', 'RESEARCH_SCHOLAR')
AND p.code IN (
    'researchers.read',
    'equipment.read',
    'equipment_transactions.manage',
    'materials.read',
    'inventory_transactions.manage',
    'samples.read',
    'samples.manage',
    'experiments.read',
    'experiments.manage',
    'lab_entries.read',
    'lab_entries.manage'
);

-- =====================================================
-- 7. AUTHENTICATION SESSIONS
-- =====================================================

CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_auth_sessions_user
ON auth_sessions(user_id);

CREATE INDEX idx_auth_sessions_expiry
ON auth_sessions(expires_at);

-- =====================================================
-- 8. AUDIT LOGS
-- =====================================================

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_actor
ON audit_logs(actor_user_id);

CREATE INDEX idx_audit_logs_created
ON audit_logs(created_at);

-- =====================================================
-- 9. AUTHENTICATED ACTOR REFERENCES
-- =====================================================

ALTER TABLE equipment_transactions
ADD COLUMN actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE inventory_transactions
ADD COLUMN actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE sample_transactions
ADD COLUMN actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE experiments
ADD COLUMN actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE experiment_records
ADD COLUMN actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE lab_entries
ADD COLUMN actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN check_out_actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
COMMIT;
