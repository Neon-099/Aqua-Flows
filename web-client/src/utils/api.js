const normalizeBaseUrl = (url) => (url || "").trim().replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS || 12000);

const getApiBaseUrl = () => {
  const envBase = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (envBase) return envBase;
  if (import.meta.env.DEV) return "";
  throw new Error("Missing VITE_API_BASE_URL in production");
};

export const apiRequest = async (path, method = "GET", body, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const token = localStorage.getItem("authToken");
  const controller = new AbortController();
  const requestTimeoutMs = Number(options?.timeoutMs || REQUEST_TIMEOUT_MS);
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  let res;
  try {
    res = await fetch(`${baseUrl}/api/v1${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      const timeoutErr = new Error(`Request timeout after ${requestTimeoutMs}ms`);
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
};
