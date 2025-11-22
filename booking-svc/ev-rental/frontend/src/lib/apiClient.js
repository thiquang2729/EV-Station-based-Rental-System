/**
 * API client with automatic cookie-based authentication (SSO)
 */
export async function api(path, { method = 'GET', body, headers } = {}) {
  const opts = {
    method,
    credentials: 'include', // Quan trọng: gửi cookie để SSO hoạt động
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  };
  
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(path, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

