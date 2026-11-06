
// ==========================================
// LabSync - API Type Definitions
// These interfaces match the Go backend models.
// ==========================================

// ---------- Laboratories ----------

export interface Laboratory {
  id: number;
  name: string;
  department: string;
  location: string;
}

export interface CreateLaboratoryInput {
  name: string;
  department: string;
  location: string;
}

// ---------- Materials ----------

export interface Material {
  id: number;
  laboratory_id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimum_quantity: number;
  expiry_date?: string | null;
}

export interface CreateMaterialInput {
  laboratory_id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimum_quantity: number;
  expiry_date?: string | null;
}

// ---------- Inventory Transactions ----------

export type InventoryTransactionType = 'USE' | 'RESTOCK';

export interface InventoryTransaction {
  id: number;
  material_id: number;
  transaction_type: InventoryTransactionType;
  quantity: number;
  performed_by: string;
  notes: string;
  created_at: string;
}

export interface CreateInventoryTransactionInput {
  material_id: number;
  transaction_type: InventoryTransactionType;
  quantity: number;
  performed_by: string;
  notes: string;
}

// ---------- Equipment ----------

export type EquipmentStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'MAINTENANCE';

export interface Equipment {
  id: number;
  laboratory_id: number;
  name: string;
  category: string;
  serial_number: string;
  status: EquipmentStatus;
  location: string;
  description: string;
  created_at: string;
}

export interface CreateEquipmentInput {
  laboratory_id: number;
  name: string;
  category: string;
  serial_number: string;
  status: EquipmentStatus;
  location: string;
  description: string;
}

// ---------- Equipment Transactions ----------

export type EquipmentTransactionType = 'CHECKOUT' | 'RETURN';

export interface EquipmentTransaction {
  id: number;
  equipment_id: number;
  transaction_type: EquipmentTransactionType;
  performed_by: string;
  notes: string;
  checkout_time?: string | null;
  return_time?: string | null;
  created_at: string;
}

export interface CreateEquipmentTransactionInput {
  equipment_id: number;
  transaction_type: EquipmentTransactionType;
  performed_by: string;
  notes: string;
}

// ---------- Experiments ----------

export type ExperimentStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Experiment {
  id: number;
  laboratory_id: number;
  name: string;
  description: string;
  started_by: string;
  status: ExperimentStatus;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export interface CreateExperimentInput {
  laboratory_id: number;
  name: string;
  description: string;
  started_by: string;
  status: ExperimentStatus;
}

// PUT requires the complete experiment fields,
// including laboratory_id and name.
export type UpdateExperimentInput = CreateExperimentInput;

// ---------- Experiment Records ----------

export interface ExperimentRecord {
  id: number;
  experiment_id: number;
  recorded_by: string;
  record_type: string;
  notes: string;
  created_at: string;
}

export interface CreateExperimentRecordInput {
  recorded_by: string;
  record_type: string;
  notes: string;
}
// ---------- Lab Entry Records ----------

export interface LabEntry {
  id: number;
  laboratory_id: number;
  laboratory_name?: string;
  researcher_name: string;
  check_in: string;
  check_out: string | null;
  notes: string;
  created_at: string;
}

export interface CreateLabEntryInput {
  laboratory_id: number;
  researcher_name: string;
  notes: string;
}

export interface Sample {
  id: number;
  laboratory_id: number;
  name: string;
  sample_type: string;
  description?: string | null;
  initial_quantity: number;
  available_quantity: number;
  unit: string;
  storage_location?: string | null;
  created_at: string;
}

export interface CreateSampleInput {
  laboratory_id: number;
  name: string;
  sample_type: string;
  description?: string;
  initial_quantity: number;
  unit: string;
  storage_location?: string;
}

export type SampleTransactionType = 'USE' | 'RESTOCK';

export interface SampleTransaction {
  id: number;
  sample_id: number;
  researcher_id?: number | null;
  transaction_type: SampleTransactionType;
  quantity: number;
  performed_by: string;
  notes: string;
  created_at: string;
}

export interface CreateSampleTransactionInput {
  sample_id: number;
  researcher_id?: number;
  performed_by?: string;
  transaction_type: SampleTransactionType;
  quantity: number;
  notes?: string;
}

export interface CreateSampleTransactionResponse {
  transaction: SampleTransaction;
  available_quantity: number;
}