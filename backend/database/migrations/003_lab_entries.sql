-- ============================================
-- LABSYNC LAB ENTRY RECORDS
-- ============================================

CREATE TABLE IF NOT EXISTS lab_entries (
    id SERIAL PRIMARY KEY,

    laboratory_id INTEGER NOT NULL,

    researcher_name VARCHAR(150) NOT NULL,

    check_in TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    check_out TIMESTAMP,

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lab_entry_laboratory
        FOREIGN KEY (laboratory_id)
        REFERENCES laboratories(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_lab_entry_times
        CHECK (check_out IS NULL OR check_out >= check_in)
);

-- Prevent a researcher from having multiple
-- active entries in the same laboratory.
CREATE UNIQUE INDEX IF NOT EXISTS
    idx_lab_entries_active_researcher
ON lab_entries (laboratory_id, LOWER(researcher_name))
WHERE check_out IS NULL;

CREATE INDEX IF NOT EXISTS
    idx_lab_entries_check_in
ON lab_entries (check_in DESC);