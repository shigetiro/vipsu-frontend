// Admin API client functions for Audit Log and Client Log management

const API_BASE = '/api/admin';

// ============================================================================
// Types
// ============================================================================

export type AuditActionType =
  | 'USER_BAN'
  | 'USER_UNBAN'
  | 'USER_ROLE_CHANGE'
  | 'BEATMAP_DELETE'
  | 'BEATMAP_RANK'
  | 'SCORE_DELETE'
  | 'TEAM_DISBAND'
  | 'SETTINGS_CHANGE';

export type TargetType = 'USER' | 'BEATMAP' | 'SCORE' | 'TEAM';

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_username: string;
  actor_avatar_url?: string;
  action_type: AuditActionType;
  target_type: TargetType;
  target_id: string;
  target_name: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  action_type?: AuditActionType;
  actor_id?: string;
  target_type?: TargetType;
  target_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Client Log with all fields
export interface ClientLog {
  id: string;
  user_id: string;
  username: string;
  user_avatar_url?: string;
  client_version: string;
  client_hash?: string;
  os_version: string;
  log_type: 'CRASH' | 'ERROR' | 'WARNING' | 'PERFORMANCE' | 'INFO';
  message: string;
  stack_trace?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ClientLogParams {
  page?: number;
  limit?: number;
  user_id?: string;
  client_version?: string;
  client_hash?: string;
  os_version?: string;
  log_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Unknown Hash Management
export interface UnknownHashEntry {
  hash: string;
  count: number;
  first_seen?: string;
  last_seen?: string;
  last_user_id?: number;
  last_user_agent?: string;
  last_detected_os?: string;
  last_source?: string;
}

export interface UnknownHashListResponse {
  total: number;
  hashes: UnknownHashEntry[];
}

export interface AddHashOverrideRequest {
  client_hash: string;
  client_name: string;
  version: string;
  os_name: string;
}

export interface MaintenanceModeScheduleRequest {
  enabled: boolean;
  message?: string;
  schedule_minutes?: number;
}

export interface MaintenanceModeScheduleResponse {
  enabled: boolean;
  scheduled: boolean;
  countdown_minutes?: number;
  message?: string;
  countdown_announcement_id?: number;
  maintenance_announcement_id?: number;
  updated_at?: string;
}

export interface MaintenanceModeStatusResponse {
  enabled: boolean;
  scheduled: boolean;
  countdown_active: boolean;
  countdown_minutes_remaining?: number;
  countdown_end_time?: string;
  message?: string;
  countdown_announcement_id?: number;
  maintenance_announcement_id?: number;
  updated_at?: string;
}

// Analytics types for client version overview
export interface ClientVersionStats {
  version: string;
  count: number;
  percentage: number;
  last_seen: string;
}

export interface ClientPlatformStats {
  os_version: string;
  count: number;
  percentage: number;
}

export interface ClientLogStats {
  total_users: number;
  unique_versions: number;
  version_distribution: ClientVersionStats[];
  platform_distribution: ClientPlatformStats[];
  adoption_trend: Array<{ date: string; versions: Record<string, number> }>;
}

export type TimeRangeFilter = '24h' | '7d' | '30d' | 'all';

// ============================================================================
// Helper Functions
// ============================================================================

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchWithAuth<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return handleResponse<T>(response);
}

// ============================================================================
// Audit Log API Functions
// ============================================================================

/**
 * Fetch paginated list of audit logs with optional filtering
 */
export async function fetchAuditLogs(
  params: AuditLogParams = {}
): Promise<PaginatedResponse<AuditLog>> {
  const queryString = buildQueryString(params);
  return fetchWithAuth<PaginatedResponse<AuditLog>>(`${API_BASE}/audit-logs${queryString}`);
}

/**
 * Fetch a single audit log by ID with full details
 */
export async function fetchAuditLogDetail(id: string): Promise<AuditLog> {
  return fetchWithAuth<AuditLog>(`${API_BASE}/audit-logs/${id}`);
}

/**
 * Export audit logs as CSV file
 * Returns a Blob that can be downloaded
 */
export async function exportAuditLogs(params: AuditLogParams = {}): Promise<Blob> {
  const queryString = buildQueryString(params);
  const response = await fetch(`${API_BASE}/audit-logs/export${queryString}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.blob();
}

// ============================================================================
// Client Log API Functions
// ============================================================================

/**
 * Fetch paginated list of client logs with optional filtering
 */
export async function fetchClientLogs(
  params: ClientLogParams = {}
): Promise<PaginatedResponse<ClientLog>> {
  const queryString = buildQueryString(params);
  return fetchWithAuth<PaginatedResponse<ClientLog>>(`${API_BASE}/client-logs${queryString}`);
}

/**
 * Fetch a single client log by ID with full details including stack trace
 */
/**
 * Fetch a single client log by ID
 */
export async function fetchClientLogDetail(id: string): Promise<ClientLog> {
  return fetchWithAuth<ClientLog>(`${API_BASE}/client-logs/${id}`);
}

/**
 * Fetch aggregated client version statistics for analytics dashboard
 */
export async function fetchClientVersionStats(
  timeRange: TimeRangeFilter = '7d'
): Promise<ClientLogStats> {
  return fetchWithAuth<ClientLogStats>(
    `${API_BASE}/client-logs/version-stats?time_range=${timeRange}`
  );
}

/**
 * Fetch client platform (OS) distribution statistics
 */
export async function fetchClientPlatformStats(
  timeRange: TimeRangeFilter = '7d'
): Promise<ClientPlatformStats[]> {
  return fetchWithAuth<ClientPlatformStats[]>(
    `${API_BASE}/client-logs/platform-stats?time_range=${timeRange}`
  );
}

/**
 * Delete a client log entry
 */
export async function deleteClientLog(id: string): Promise<void> {
  return fetchWithAuth<void>(`${API_BASE}/client-logs/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch client log statistics for dashboard
 */
export async function fetchClientLogStats(): Promise<ClientLogStats> {
  return fetchWithAuth<ClientLogStats>(`${API_BASE}/client-logs/stats`);
}

// ============================================================================
// Unknown Client Hash API Functions
// ============================================================================

/**
 * Fetch unknown client hashes with pagination and sorting
 */
export async function fetchUnknownClientHashes(
  params: {
    page?: number;
    per_page?: number;
    sort_by?: 'count' | 'first_seen' | 'last_seen' | 'hash';
    sort_desc?: boolean;
  } = {}
): Promise<UnknownHashListResponse> {
  const queryString = buildQueryString(params);
  return fetchWithAuth<UnknownHashListResponse>(`${API_BASE}/client-hashes/unknown${queryString}`);
}

/**
 * Add an unknown hash to the allow list
 */
export async function addHashOverride(data: AddHashOverrideRequest): Promise<{ message: string; hash: string }> {
  return fetchWithAuth<{ message: string; hash: string }>(`${API_BASE}/client-hashes/override`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Delete an unknown hash from the registry
 */
export async function deleteUnknownHash(hash: string): Promise<void> {
  return fetchWithAuth<void>(`${API_BASE}/client-hashes/unknown/${encodeURIComponent(hash)}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Maintenance Mode API Functions
// ============================================================================

/**
 * Get detailed maintenance mode status including countdown
 */
export async function fetchMaintenanceModeStatus(): Promise<MaintenanceModeStatusResponse> {
  return fetchWithAuth<MaintenanceModeStatusResponse>(`${API_BASE}/system/maintenance-mode/status`);
}

/**
 * Schedule or enable maintenance mode with optional countdown
 */
export async function scheduleMaintenanceMode(data: MaintenanceModeScheduleRequest): Promise<MaintenanceModeScheduleResponse> {
  return fetchWithAuth<MaintenanceModeScheduleResponse>(`${API_BASE}/system/maintenance-mode/schedule`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


// ============================================================================
// Action Type Helpers
// ============================================================================

export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  USER_BAN: 'User Banned',
  USER_UNBAN: 'User Unbanned',
  USER_ROLE_CHANGE: 'Role Changed',
  BEATMAP_DELETE: 'Beatmap Deleted',
  BEATMAP_RANK: 'Beatmap Ranked',
  SCORE_DELETE: 'Score Deleted',
  TEAM_DISBAND: 'Team Disbanded',
  SETTINGS_CHANGE: 'Settings Changed',
};

export const AUDIT_ACTION_COLORS: Record<AuditActionType, string> = {
  USER_BAN: 'red',
  USER_UNBAN: 'green',
  USER_ROLE_CHANGE: 'yellow',
  BEATMAP_DELETE: 'red',
  BEATMAP_RANK: 'green',
  SCORE_DELETE: 'orange',
  TEAM_DISBAND: 'red',
  SETTINGS_CHANGE: 'blue',
};

// Time range filter labels for client version analytics
export const TIME_RANGE_LABELS: Record<TimeRangeFilter, string> = {
  '24h': 'Last 24 Hours',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  'all': 'All Time',
};