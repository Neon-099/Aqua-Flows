// e:\Aquaflow\web-client\src\utils\api.js
export const apiRequest = async (path, method = 'GET', body) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
};
