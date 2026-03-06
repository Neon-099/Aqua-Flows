// // e:\Aquaflow\web-client\src\utils\api.js
// export const apiRequest = async (path, method = 'GET', body) => {
//   const start = performance.now();
//   const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://aqua-flow-v5f6.onrender.com' || window.location.origin;
//   const token = localStorage.getItem('authToken');
//   let res;
//   try {
//     res = await fetch(`${baseUrl}/api/v1${path}`, {
//       method,
//       headers: {
//         'Content-Type': 'application/json',
//         ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       },
//       credentials: 'include',
//       body: body ? JSON.stringify(body) : undefined,
//     });
//   } finally {
//     const ms = Math.round(performance.now() - start);
//     console.log(`[FE] ${method} ${path} ${ms}ms`);
//   }

//   const data = await res.json().catch(() => ({}));
//   if (!res.ok) {
//     const err = new Error(data?.error || data?.message || 'Request failed');
//     err.status = res.status;
//     throw err;
//   }
//   return data;
// };

// web-client/src/utils/api.js
const getApiBaseUrl = () => {
  const raw = (import.meta.env.VITE_API_BASE_URL || '').trim();
  const base = raw.replace(/\/+$/, '');

  // In production, do not silently fall back to same-origin.
  if (import.meta.env.PROD && !base) {
    throw new Error('Missing VITE_API_BASE_URL in production environment');
  }

  // In local dev, allow Vite proxy by returning empty string.
  return base;
};

export const apiRequest = async (path, method = 'GET', body) => {
  const start = performance.now();
  const baseUrl = getApiBaseUrl();
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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || 'Request failed');
    err.status = res.status;
    throw err;
  }

  return data;
};
