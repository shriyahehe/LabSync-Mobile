
-- ============================================
-- LABSYNC EXPERIMENTS MIGRATION
-- ============================================

BEGIN;

-- 1. EXPERIMENTS
CREATE TABLE IF NOT EXISTS experiments (
    id SERIAL PRIMARY KEY,
    laboratory_id INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    started_by VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_experiment_laboratory
        FOREIGN KEY (laboratory_id)
        REFERENCES laboratories(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_experiment_status
        CHECK (
            status IN (
                'PLANNED',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED'
            )
        )
);

-- 2. EXPERIMENT RECORDS
CREATE TABLE IF NOT EXISTS experiment_records (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER NOT NULL,
    recorded_by VARCHAR(150),
    record_type VARCHAR(50) NOT NULL DEFAULT 'OBSERVATION',
    notes TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_experiment_record
        FOREIGN KEY (experiment_id)
        REFERENCES experiments(id)
        ON DELETE CASCADE
);

COMMIT;
