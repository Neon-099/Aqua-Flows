// e:\Aquaflow\web-client\src\utils\api.js
export const apiRequest = async (path, method = 'GET', body) => {
  const start = performance.now();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const token = localStorage.getItem('authToken');
  let res;
  try {
    res = await fetch(`${baseUrl}/api/v1${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
  } finally {
    const ms = Math.round(performance.now() - start);
    console.log(`[FE] ${method} ${path} ${ms}ms`);
  }

  let data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/auth/refresh') {
    try {
      const refreshRes = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (refreshRes.ok && refreshData?.token) {
        localStorage.setItem('authToken', refreshData.token);
        res = await fetch(`${baseUrl}/api/v1${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshData.token}`,
          },
          credentials: 'include',
          body: body ? JSON.stringify(body) : undefined,
        });
        data = await res.json().catch(() => ({}));
      } else {
        localStorage.removeItem('authToken');
      }
    } catch {
      localStorage.removeItem('authToken');
    }
  }

  if (!res.ok) {
    const err = new Error(data?.error || data?.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
};
