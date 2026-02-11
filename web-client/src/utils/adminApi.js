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
  return apiRequest("/admin/users", "POST", payload);
};

export const updateAdminUser = async (id, payload) => {
  return apiRequest(`/admin/users/${id}`, "PUT", payload);
};

export const archiveAdminUser = async (id) => {
  return apiRequest(`/admin/users/${id}/archive`, "PATCH");
};

export const restoreAdminUser = async (id) => {
  return apiRequest(`/admin/users/${id}/restore`, "PATCH");
};
