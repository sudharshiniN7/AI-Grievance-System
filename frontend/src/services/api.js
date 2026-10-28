/**
 * API Service
 * ------------
 * Central place for all calls to the Express backend.
 */

const TOKEN_KEY = "grievance_auth_token";

function getResolvedApiUrl(path) {
  let base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").trim();

  // Strip trailing slashes
  base = base.replace(/\/+$/, "");
  // Ensure base ends with /api
  if (!base.endsWith("/api")) {
    base = `${base}/api`;
  }
  // If path already starts with /api/, strip that leading /api to avoid /api/api/...
  let cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath.startsWith("/api/")) {
    cleanPath = cleanPath.slice(4);
  } else if (cleanPath === "/api") {
    cleanPath = "";
  }
  return `${base}${cleanPath}`;
}

async function request(path, options = {}) {
  const url = getResolvedApiUrl(path);

  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    credentials: "include", // required for cookies when available
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Server returned an unexpected response.");
  }

  if (!response.ok || data.success === false) {
    if (response.status === 401 && typeof window !== "undefined") {
      if (path.includes("/auth/me")) {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
}

// ---------- Auth ----------

export async function registerUser({ fullName, email, password, phone }) {
  const data = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password, phone }),
  });
  if (data?.token && typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
  return data;
}

export async function loginUser({ identifier, password }) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
  if (data?.token && typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
  return data;
}

export async function logoutUser() {
  try {
    return await request("/auth/logout", { method: "POST" });
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}

export function fetchCurrentUser() {
  return request("/auth/me");
}

// ---------- Complaints ---------- (unchanged below)

export function createComplaint(payload) {
  return request("/complaints", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAllComplaints(filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => Boolean(value))
  ).toString();
  const query = params ? `?${params}` : "";
  return request(`/complaints${query}`);
}

export function getComplaintById(id) {
  return request(`/complaints/${encodeURIComponent(id)}`);
}

export function updateComplaintStatus(id, { status, note, resolutionSummary, resolvedBy }) {
  return request(`/complaints/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note, resolutionSummary, resolvedBy }),
  });
}

export function assignDepartment(id, { department }) {
  return request(`/complaints/${encodeURIComponent(id)}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ department }),
  });
}

export function updatePriority(id, { priority }) {
  return request(`/complaints/${encodeURIComponent(id)}/priority`, {
    method: "PATCH",
    body: JSON.stringify({ priority }),
  });
}

export function getOverdueComplaints() {
  return request("/complaints/sla/overdue");
}

export function escalateOverdueComplaints() {
  return request("/complaints/sla/escalate", {
    method: "POST",
  });
}

export function getSlaStatus(id) {
  return request(`/complaints/${encodeURIComponent(id)}/sla`);
}

// ---------- Dashboard & Analytics ----------

export function getDashboardStats() {
  return request("/dashboard/stats");
}

export function getRecentComplaints(limit = 5) {
  return request(`/dashboard/recent?limit=${limit}`);
}

export function getAdminAnalytics() {
  return request("/dashboard/analytics");
}