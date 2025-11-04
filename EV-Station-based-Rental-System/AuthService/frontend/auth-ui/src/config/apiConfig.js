const STORAGE_KEY = "app.apiBaseUrl";
const QUERY_PARAM = "apiBaseUrl";

const getDefaultOrigin = () => {
  return "http://localhost:8003";
};

const normalizeUrl = (raw) => {
  if (!raw || typeof raw !== "string") {
    return undefined;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  const candidate =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : new URL(trimmed, getDefaultOrigin()).href;

  try {
    const { origin, pathname, search } = new URL(candidate);
    const normalizedPath =
      pathname && pathname !== "/" ? pathname.replace(/\/+$/, "") : "";
    return `${origin}${normalizedPath}${search}`;
  } catch {
    return undefined;
  }
};

const readFromQuery = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  const params = new URLSearchParams(window.location.search);
  const candidate = params.get(QUERY_PARAM);

  if (!candidate) {
    return undefined;
  }

  const normalized = normalizeUrl(candidate);
  params.delete(QUERY_PARAM);

  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${
    nextQuery ? `?${nextQuery}` : ""
  }${window.location.hash}`;

  if (typeof window.history?.replaceState === "function") {
    window.history.replaceState({}, "", nextUrl);
  }

  if (normalized) {
    try {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      /* ignore storage errors */
    }
  }

  return normalized;
};

const readFromStorage = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return normalizeUrl(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return undefined;
  }
};

const readFromEnv = () =>
  normalizeUrl(
    import.meta.env.VITE_API_BASE_URL ??
      import.meta.env.VITE_API_URL ??
      import.meta.env.VITE_BACKEND_URL ??
      import.meta.env.VITE_APP_API
  );

let cachedBaseUrl;

const computeBaseUrl = () =>
  readFromQuery() ?? readFromStorage() ?? readFromEnv() ?? getDefaultOrigin();

export const getApiBaseUrl = () => {
  if (!cachedBaseUrl) {
    cachedBaseUrl = computeBaseUrl();
  }
  return cachedBaseUrl;
};

export const buildApiUrl = (path = "") => {
  const base = getApiBaseUrl();

  if (!path) {
    return base;
  }

  const normalizedPath = path.startsWith("/")
    ? path.replace(/\/+$/, "")
    : `/${path.replace(/\/+$/, "")}`;

  return `${base}${normalizedPath}`;
};

export const overrideApiBaseUrl = (url) => {
  const normalized = normalizeUrl(url);

  if (!normalized) {
    throw new Error("Invalid API base URL");
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      /* ignore storage errors */
    }
  }

  cachedBaseUrl = normalized;
  return normalized;
};

export const clearApiBaseUrlOverride = () => {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore storage errors */
    }
  }

  cachedBaseUrl = undefined;
  return getApiBaseUrl();
};
