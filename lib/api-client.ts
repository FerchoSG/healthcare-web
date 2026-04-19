import type { ApiError } from "@/types/api";

// ─── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ─── Token / Clinic Storage ───────────────────────────────────────────────────

let accessToken: string | null = null;
let clinicId: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    if (typeof window !== "undefined") localStorage.setItem("access_token", token);
  } else {
    if (typeof window !== "undefined") localStorage.removeItem("access_token");
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("access_token");
  }
  return accessToken;
}

export function setClinicId(id: string | null) {
  clinicId = id;
  if (id) {
    if (typeof window !== "undefined") localStorage.setItem("clinic_id", id);
  } else {
    if (typeof window !== "undefined") localStorage.removeItem("clinic_id");
  }
}

export function getClinicId(): string | null {
  if (clinicId) return clinicId;
  if (typeof window !== "undefined") {
    clinicId = localStorage.getItem("clinic_id");
  }
  return clinicId;
}

export function clearAuth() {
  setAccessToken(null);
  setClinicId(null);
}

// ─── Custom Error ─────────────────────────────────────────────────────────────

export class HttpError extends Error {
  constructor(
    public status: number,
    public body: ApiError,
  ) {
    const msg = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    super(msg);
    this.name = "HttpError";
  }
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip injecting auth headers (for public endpoints) */
  skipAuth?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const clinic = getClinicId();
    if (clinic) headers["x-clinic-id"] = clinic;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    // Auto-clear auth on 401
    if (res.status === 401) clearAuth();
    throw new HttpError(res.status, data as ApiError);
  }

  return data as T;
}

// ─── Public API (convenience wrappers) ────────────────────────────────────────

export const api = {
  get<T>(endpoint: string, opts?: Omit<RequestOptions, "body">) {
    return request<T>(endpoint, { method: "GET", ...opts });
  },

  post<T>(endpoint: string, body?: unknown, opts?: Omit<RequestOptions, "body">) {
    return request<T>(endpoint, { method: "POST", body, ...opts });
  },

  patch<T>(endpoint: string, body?: unknown, opts?: Omit<RequestOptions, "body">) {
    return request<T>(endpoint, { method: "PATCH", body, ...opts });
  },

  delete<T>(endpoint: string, opts?: Omit<RequestOptions, "body">) {
    return request<T>(endpoint, { method: "DELETE", ...opts });
  },
};
