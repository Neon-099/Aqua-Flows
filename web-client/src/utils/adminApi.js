import { apiRequest } from "./api";

export const fetchAdminUsers = async (params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return apiRequest(`/admin/users${query ? `?${query}` : ""}`);
};

export const createAdminUser = async (payload) => {
  return apiRequest("/admin/users", "POST", payload, { timeoutMs: 30000 });
};

export const updateAdminUser = async (id, payload) => {
  return apiRequest(`/admin/users/${id}`, "PUT", payload, { timeoutMs: 30000 });
};

export const archiveAdminUser = async (id) => {
  return apiRequest(`/admin/users/${id}/archive`, "PATCH");
};

export const restoreAdminUser = async (id) => {
  return apiRequest(`/admin/users/${id}/restore`, "PATCH");
};

export const deleteAdminUser = async (id) => {
  return apiRequest(`/admin/users/${id}`, "DELETE");
};

export const fetchAdminConfig = async () => {
  return apiRequest("/admin/config");
};

export const fetchAdminOverviewToday = async (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiRequest(`/admin/overview/today${query ? `?${query}` : ""}`);
};

export const fetchAdminOrders = async (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiRequest(`/admin/orders${query ? `?${query}` : ""}`);
};

export const fetchAdminPayments = async (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiRequest(`/admin/payments${query ? `?${query}` : ""}`);
};

export const fetchAdminExceptions = async (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiRequest(`/admin/exceptions${query ? `?${query}` : ""}`);
};

export const recheckAdminPayment = async (id, payload) => {
  return apiRequest(`/admin/payments/${id}/recheck`, "POST", payload || {});
};

export const resolveAdminPayment = async (id, payload) => {
  return apiRequest(`/admin/payments/${id}/resolve`, "POST", payload || {});
};

export const cancelAdminOrder = async (id, payload) => {
  return apiRequest(`/admin/orders/${id}/cancel`, "POST", payload || {});
};

export const reopenAdminOrder = async (id, payload) => {
  return apiRequest(`/admin/orders/${id}/reopen`, "POST", payload || {});
};
