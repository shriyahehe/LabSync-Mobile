-- ============================================
-- LABSYNC INITIAL DATABASE SCHEMA
-- ============================================

-- ============================================
-- 1. LABORATORIES
-- ============================================

CREATE TABLE IF NOT EXISTS laboratories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    location VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 2. MATERIALS / CHEMICALS
-- ============================================

CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,

    laboratory_id INTEGER NOT NULL,

    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),

    quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    unit VARCHAR(30) NOT NULL,

    minimum_quantity DECIMAL(12,2) DEFAULT 0,

    expiry_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_material_laboratory
        FOREIGN KEY (laboratory_id)
        REFERENCES laboratories(id)
        ON DELETE CASCADE
);


-- ============================================
-- 3. INVENTORY TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,

    material_id INTEGER NOT NULL,

    transaction_type VARCHAR(30) NOT NULL,

    quantity DECIMAL(12,2) NOT NULL,

    performed_by VARCHAR(150),

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transaction_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id)
        ON DELETE CASCADE
);
-- ============================================
-- 4. EQUIPMENT
-- ============================================

CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,

    laboratory_id INTEGER NOT NULL,

    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),

    serial_number VARCHAR(100),

    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',

    location VARCHAR(150),

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_equipment_laboratory
        FOREIGN KEY (laboratory_id)
        REFERENCES laboratories(id)
        ON DELETE CASCADE
);
-- ============================================
-- 5. EQUIPMENT TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS equipment_transactions (
    id SERIAL PRIMARY KEY,

    equipment_id INTEGER NOT NULL,

    transaction_type VARCHAR(30) NOT NULL,

    performed_by VARCHAR(150),

    notes TEXT,

    checkout_time TIMESTAMP,

    return_time TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_equipment_transaction_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES equipment(id)
        ON DELETE CASCADE
);