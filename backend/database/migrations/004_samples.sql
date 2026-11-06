
BEGIN;

CREATE TABLE IF NOT EXISTS samples (
    id SERIAL PRIMARY KEY,
    laboratory_id INTEGER NOT NULL REFERENCES laboratories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    sample_type VARCHAR(100),
    description TEXT,
    initial_quantity NUMERIC(12,2) NOT NULL CHECK (initial_quantity >= 0),
    available_quantity NUMERIC(12,2) NOT NULL CHECK (available_quantity >= 0),
    unit VARCHAR(30) NOT NULL,
    storage_location VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (available_quantity <= initial_quantity)
);

CREATE TABLE IF NOT EXISTS sample_transactions (
    id SERIAL PRIMARY KEY,
    sample_id INTEGER NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('USE', 'RESTOCK')),
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    performed_by VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_samples_laboratory
ON samples(laboratory_id);

CREATE INDEX IF NOT EXISTS idx_sample_transactions_sample
ON sample_transactions(sample_id);

CREATE INDEX IF NOT EXISTS idx_sample_transactions_created
ON sample_transactions(created_at DESC);

COMMIT;
