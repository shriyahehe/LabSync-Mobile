
import type {
  CreateEquipmentInput,
  CreateEquipmentTransactionInput,
  CreateExperimentInput,
  CreateExperimentRecordInput,
  CreateInventoryTransactionInput,
  CreateLabEntryInput,
  CreateLaboratoryInput,
  CreateMaterialInput,
  CreateSampleInput,
  CreateSampleTransactionInput,
  CreateSampleTransactionResponse,
  CreateResearcherInput,
  Equipment,
  EquipmentTransaction,
  Experiment,
  ExperimentRecord,
  InventoryTransaction,
  LabEntry,
  Laboratory,
  Material,
  Sample,
  SampleTransaction,
  Researcher,
  ResearcherActivityResponse,
  UpdateResearcherInput,
  UpdateExperimentInput,
} from './types';

// ==========================================
// LabSync - API Configuration
// ==========================================

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? ''
).replace(/\/+$/, '');

// ==========================================
// Common API Request Handler
// ==========================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      'API URL is missing. Configure EXPO_PUBLIC_API_URL in your .env file.'
    );
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'Unable to connect to LabSync backend. Check your network and backend server.'
    );
  }

  const responseText = await response.text();

  let data: unknown = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Invalid response from server (HTTP ${response.status}).`
      );
    }
  }

  if (!response.ok) {
    const errorData = data as {
      error?: unknown;
      message?: unknown;
    } | null;

    const message =
      errorData &&
      (typeof errorData.error === 'string'
        ? errorData.error
        : typeof errorData.message === 'string'
          ? errorData.message
          : null);

    throw new Error(
      message || `API request failed with status ${response.status}.`
    );
  }

  return data as T;
}

// ==========================================
// GET Helper
// Normalizes null list responses to []
// ==========================================

async function getList<T>(endpoint: string): Promise<T[]> {
  const data = await request<T[] | null>(endpoint, {
    method: 'GET',
  });

  return data ?? [];
}

// ==========================================
// POST Helper
// ==========================================

function post<T>(
  endpoint: string,
  body: unknown
): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ==========================================
// LABORATORIES
// ==========================================

export const getLaboratories = (): Promise<Laboratory[]> =>
  getList<Laboratory>('/api/laboratories');

export const createLaboratory = (
  input: CreateLaboratoryInput
): Promise<Laboratory> =>
  post<Laboratory>('/api/laboratories', input);

// ==========================================
// MATERIALS
// ==========================================

export const getMaterials = (): Promise<Material[]> =>
  getList<Material>('/api/materials');

export const createMaterial = (
  input: CreateMaterialInput
): Promise<Material> =>
  post<Material>('/api/materials', input);

// ==========================================
// INVENTORY TRANSACTIONS
// ==========================================

export const getInventoryTransactions = (): Promise<
  InventoryTransaction[]
> =>
  getList<InventoryTransaction>('/api/inventory-transactions');

export const createInventoryTransaction = (
  input: CreateInventoryTransactionInput
): Promise<InventoryTransaction> =>
  post<InventoryTransaction>('/api/inventory-transactions', input);

// ==========================================
// EQUIPMENT
// ==========================================

export const getEquipment = (): Promise<Equipment[]> =>
  getList<Equipment>('/api/equipment');

export const createEquipment = (
  input: CreateEquipmentInput
): Promise<Equipment> =>
  post<Equipment>('/api/equipment', input);

// ==========================================
// EQUIPMENT TRANSACTIONS
// ==========================================

export const getEquipmentTransactions = (): Promise<
  EquipmentTransaction[]
> =>
  getList<EquipmentTransaction>('/api/equipment-transactions');

export const createEquipmentTransaction = (
  input: CreateEquipmentTransactionInput
): Promise<EquipmentTransaction> =>
  post<EquipmentTransaction>('/api/equipment-transactions', input);

// ==========================================
// EXPERIMENTS
// ==========================================

export async function getExperiments(): Promise<Experiment[]> {
  const response = await request<{
    experiments: Experiment[] | null;
    message: string;
  }>('/api/experiments', {
    method: 'GET',
  });

  return response.experiments ?? [];
}

export async function getExperiment(id: number): Promise<Experiment> {
  const response = await request<{ experiment: Experiment }>(
    `/api/experiments/${id}`,
    { method: 'GET' }
  );

  return response.experiment;
}

export async function createExperiment(
  input: CreateExperimentInput
): Promise<Experiment> {
  const response = await post<{ experiment: Experiment }>(
    '/api/experiments',
    input
  );

  return response.experiment;
}

export async function updateExperiment(
  id: number,
  input: UpdateExperimentInput
): Promise<Experiment> {
  const response = await request<{ experiment: Experiment }>(
    `/api/experiments/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    }
  );

  return response.experiment;
}

// ==========================================
// EXPERIMENT RECORDS
// ==========================================

export async function getExperimentRecords(
  experimentId: number
): Promise<ExperimentRecord[]> {
  const response = await request<{
    experiment_id: number;
    records: ExperimentRecord[] | null;
  }>(`/api/experiments/${experimentId}/records`, {
    method: 'GET',
  });

  return response.records ?? [];
}

export async function createExperimentRecord(
  experimentId: number,
  input: CreateExperimentRecordInput
): Promise<ExperimentRecord> {
  const response = await post<{ record: ExperimentRecord }>(
    `/api/experiments/${experimentId}/records`,
    input
  );

  return response.record;
}

// ==========================================
// LAB ENTRY RECORDS
// ==========================================

// Get all lab entry records.
// Optionally filter by laboratory ID.
export const getLabEntries = (
  laboratoryId?: number
): Promise<LabEntry[]> => {
  const query =
    laboratoryId !== undefined
      ? `?laboratory_id=${encodeURIComponent(String(laboratoryId))}`
      : '';

  return getList<LabEntry>(`/api/lab-entries${query}`);
};

// Get researchers currently inside laboratories.
export const getActiveLabEntries = (): Promise<LabEntry[]> =>
  getList<LabEntry>('/api/lab-entries/active');

// Check a researcher into a laboratory.
export const checkInResearcher = (
  input: CreateLabEntryInput
): Promise<LabEntry> =>
  post<LabEntry>('/api/lab-entries/check-in', input);

// Check a researcher out of a laboratory.
export const checkOutResearcher = (
  entryId: number
): Promise<LabEntry> =>
  post<LabEntry>(
    `/api/lab-entries/${encodeURIComponent(String(entryId))}/check-out`,
    {}
  );
export const getSamples = (): Promise<Sample[]> =>
  getList<Sample>('/api/samples');

export const getSample = (id: number): Promise<Sample> =>
  request<Sample>(`/api/samples/${encodeURIComponent(String(id))}`, {
    method: 'GET',
  });

export const createSample = (
  input: CreateSampleInput
): Promise<Sample> =>
  post<Sample>('/api/samples', input);

export const getSampleTransactions = (): Promise<SampleTransaction[]> =>
  getList<SampleTransaction>('/api/sample-transactions');

export const createSampleTransaction = (
  input: CreateSampleTransactionInput
): Promise<CreateSampleTransactionResponse> =>
  post<CreateSampleTransactionResponse>('/api/sample-transactions', input);


// ==========================================
// RESEARCHERS
// ==========================================

export const getResearchers = (
  filters: {
    search?: string;
    type?: Researcher['researcher_type'];
    status?: Researcher['status'];
    laboratory_id?: number;
  } = {}
): Promise<Researcher[]> => {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.laboratory_id !== undefined) {
    params.set('laboratory_id', String(filters.laboratory_id));
  }
  const query = params.toString();
  return getList<Researcher>(`/api/researchers${query ? `?${query}` : ''}`);
};

export const getResearcher = (id: number): Promise<Researcher> =>
  request<Researcher>(`/api/researchers/${encodeURIComponent(String(id))}`, {
    method: 'GET',
  });

export const createResearcher = (
  input: CreateResearcherInput
): Promise<Researcher> =>
  post<Researcher>('/api/researchers', input);

export const updateResearcher = (
  id: number,
  input: UpdateResearcherInput
): Promise<Researcher> =>
  request<Researcher>(`/api/researchers/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

export const getResearcherActivity = (
  id: number
): Promise<ResearcherActivityResponse> =>
  request<ResearcherActivityResponse>(
    `/api/researchers/${encodeURIComponent(String(id))}/activity`,
    { method: 'GET' }
  );

