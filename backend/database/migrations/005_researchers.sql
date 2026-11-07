
BEGIN;

-- Main researcher profiles
CREATE TABLE researchers (
    id SERIAL PRIMARY KEY,
    researcher_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    researcher_type VARCHAR(30) NOT NULL
        CHECK (researcher_type IN ('RESEARCH_SCHOLAR', 'PHD_SCHOLAR')),
    department VARCHAR(100),
    research_area VARCHAR(200),
    primary_laboratory_id INTEGER NOT NULL
        REFERENCES laboratories(id) ON DELETE RESTRICT,
    supervisor_name VARCHAR(150),
    joining_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Additional laboratory assignments
CREATE TABLE researcher_laboratories (
    id SERIAL PRIMARY KEY,
    researcher_id INTEGER NOT NULL
        REFERENCES researchers(id) ON DELETE CASCADE,
    laboratory_id INTEGER NOT NULL
        REFERENCES laboratories(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (researcher_id, laboratory_id)
);

-- Each researcher can have at most one primary assignment here.
CREATE UNIQUE INDEX idx_researcher_one_primary_lab
ON researcher_laboratories(researcher_id)
WHERE is_primary = TRUE;

-- Performance indexes
CREATE INDEX idx_researchers_name
ON researchers(LOWER(full_name));

CREATE INDEX idx_researchers_code
ON researchers(researcher_code);

CREATE INDEX idx_researchers_status
ON researchers(status);

CREATE INDEX idx_researchers_primary_lab
ON researchers(primary_laboratory_id);

CREATE INDEX idx_researcher_labs_laboratory
ON researcher_laboratories(laboratory_id);

-- Optional researcher references on existing activity records.
-- Existing name fields and historical records are preserved.
ALTER TABLE lab_entries
ADD COLUMN researcher_id INTEGER
REFERENCES researchers(id) ON DELETE SET NULL;

ALTER TABLE experiments
ADD COLUMN researcher_id INTEGER
REFERENCES researchers(id) ON DELETE SET NULL;

ALTER TABLE equipment_transactions
ADD COLUMN researcher_id INTEGER
REFERENCES researchers(id) ON DELETE SET NULL;

ALTER TABLE sample_transactions
ADD COLUMN researcher_id INTEGER
REFERENCES researchers(id) ON DELETE SET NULL;

ALTER TABLE inventory_transactions
ADD COLUMN researcher_id INTEGER
REFERENCES researchers(id) ON DELETE SET NULL;

CREATE INDEX idx_lab_entries_researcher
ON lab_entries(researcher_id);

CREATE INDEX idx_experiments_researcher
ON experiments(researcher_id);

CREATE INDEX idx_equipment_transactions_researcher
ON equipment_transactions(researcher_id);

CREATE INDEX idx_sample_transactions_researcher
ON sample_transactions(researcher_id);

CREATE INDEX idx_inventory_transactions_researcher
ON inventory_transactions(researcher_id);

COMMIT;
