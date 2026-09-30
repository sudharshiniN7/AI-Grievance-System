/**
 * API Service
 * ------------
 * Central place for all calls to the Express backend. Every frontend
 * page/component that needs backend data should import from here rather
 * than calling fetch() directly — keeps the base URL and error handling
 * in one place.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Internal helper: performs a fetch call, parses JSON, and throws a
 * readable error if the backend responded with success: false or a
 * non-2xx status.
 */
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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

// ---------- Complaints ----------

/**
 * Creates a new complaint.
 * @param {object} payload - matches backend's expected body shape
 * (passengerName, email, phone, transportMode, routeFrom, routeTo,
 * travelDate, location, category, description, images, priority)
 */
export function createComplaint(payload) {
  return request("/complaints", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches all complaints, with optional filters.
 * @param {object} filters - { status, category, department, priority }
 */
export function getAllComplaints(filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => Boolean(value))
  ).toString();
  const query = params ? `?${params}` : "";
  return request(`/complaints${query}`);
}

/**
 * Fetches a single complaint by its complaintId (e.g. GR-20482).
 */
export function getComplaintById(id) {
  return request(`/complaints/${encodeURIComponent(id)}`);
}

// ---------- Dashboard ----------

/**
 * Fetches aggregate dashboard statistics.
 */
export function getDashboardStats() {
  return request("/dashboard/stats");
}

/**
 * Fetches the most recent complaints.
 * @param {number} limit
 */
export function getRecentComplaints(limit = 5) {
  return request(`/dashboard/recent?limit=${limit}`);
}