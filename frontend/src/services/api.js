/**
 * API Service
 * ------------
 * Central place for all calls to the Express backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://resolvex-yroo.onrender.com/";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include", // <-- ADDED: required so the HTTP-only auth cookie is sent/stored
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Server returned an unexpected response.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
}

// ---------- Auth ---------- // <-- ADDED section

export function registerUser({ fullName, email, password, phone }) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password, phone }),
  });
}

export function loginUser({ identifier, password }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export function logoutUser() {
  return request("/auth/logout", { method: "POST" });
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