const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('towit_access');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error?.message ?? 'Hata'), { code: data?.error?.code, status: res.status });
  return data as T;
}

export const api = {
  get:    <T>(path: string, auth = true) => request<T>('GET', path, undefined, auth),
  post:   <T>(path: string, body: unknown, auth = true) => request<T>('POST', path, body, auth),
  put:    <T>(path: string, body: unknown, auth = true) => request<T>('PUT', path, body, auth),
  patch:  <T>(path: string, body: unknown, auth = true) => request<T>('PATCH', path, body, auth),
};

// ── Auth ────────────────────────────────────────────────────────────────────────
export interface AuthUser { id: string; email: string; role: 'customer' | 'operator' }

export async function login(email: string, password: string): Promise<AuthUser> {
  const r = await api.post<{ user: AuthUser; accessToken: string; refreshToken: string }>(
    '/auth/login', { email, password }, false
  );
  localStorage.setItem('towit_access', r.accessToken);
  localStorage.setItem('towit_refresh', r.refreshToken);
  return r.user;
}

export async function register(email: string, password: string, role: 'customer' | 'operator'): Promise<AuthUser> {
  const r = await api.post<{ user: AuthUser; accessToken: string; refreshToken: string }>(
    '/auth/register', { email, password, role }, false
  );
  localStorage.setItem('towit_access', r.accessToken);
  localStorage.setItem('towit_refresh', r.refreshToken);
  return r.user;
}

export function logout() {
  localStorage.removeItem('towit_access');
  localStorage.removeItem('towit_refresh');
}

export function storedUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return { id: payload.sub, email: payload.email ?? '', role: payload.role };
  } catch { return null; }
}

// ── Me ──────────────────────────────────────────────────────────────────────────
export interface CustomerProfile {
  name: string; phone: string | null;
  savedVehicleBrand: string | null; savedVehicleModel: string | null; savedVehiclePlate: string | null;
}
export async function getMe() { return api.get<{ id: string; email: string; role: string; customerProfile: CustomerProfile | null; operatorProfile: unknown }>('/me'); }
export async function updateCustomerProfile(data: Partial<CustomerProfile>) { return api.put<CustomerProfile>('/me', data); }

// ── Operators ───────────────────────────────────────────────────────────────────
export interface OperatorResult {
  operatorProfileId: string; businessName: string;
  vehicleType: string; vehicleModel: string; vehicleYear: number | null; capacityNote: string | null;
  distanceToPickupKm: number; etaMinutes: number;
  previewTotal: string; baseFee: string; perKmFee: string; jobDistanceKm: number;
  rating: number | null; ratingCount: number;
}
export async function searchOperators(body: {
  cityCode: string; pickup: { lat: number; lng: number }; destination: { lat: number; lng: number };
  sort?: 'price' | 'distance'; customerVehicleCategory?: string;
}) { return api.post<{ operators: OperatorResult[]; jobDistanceKm: number }>('/operators/search', body); }

export async function updateOperatorProfile(data: unknown) { return api.put('/operators/me', data); }

// ── Jobs ────────────────────────────────────────────────────────────────────────
export interface JobSummary {
  id: string; status: string; priceSnapshot: string; distanceKm: number; createdAt: string;
  breakdownType: string;
  customerVehicleBrand: string | null; customerVehicleModel: string | null; customerVehiclePlate: string | null;
  operator?: { businessName: string; vehicleType: string; vehicleModel: string; vehicleYear: number | null };
  customerEmail?: string;
  pickup?: { lat: number; lng: number }; destination?: { lat: number; lng: number };
}
export interface JobDetail extends JobSummary {
  cityCode: string;
  pickup: { lat: number; lng: number }; destination: { lat: number; lng: number };
  operator: { businessName: string; vehicleType: string; vehicleModel: string; vehicleYear: number | null; phone: string | null };
  customerPhone: string | null;
  customerVehicleCategory: string;
  operatorLocation: { lat: number; lng: number; updatedAt: string } | null;
  updatedAt: string;
}

export async function getJobs() { return api.get<{ jobs: JobSummary[] }>('/jobs'); }
export async function getJob(id: string) { return api.get<JobDetail>(`/jobs/${id}`); }
export async function createJob(body: unknown) { return api.post<{ id: string; status: string; priceSnapshot: string }>('/jobs', body); }
export async function patchJob(id: string, action: string) { return api.patch(`/jobs/${id}`, { action }); }
export async function createReview(jobId: string, rating: number, comment?: string) {
  return api.post(`/jobs/${jobId}/review`, { rating, comment: comment || null });
}
