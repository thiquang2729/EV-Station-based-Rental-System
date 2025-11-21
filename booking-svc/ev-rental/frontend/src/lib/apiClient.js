/**
 * API client with automatic JWT token injection
 */
export async function api(path, { method = 'GET', body, headers } = {}) {
  // Lấy access token từ localStorage
  const accessToken = localStorage.getItem('accessToken');
  
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  };
  
  // Tự động thêm Authorization header nếu có token
  if (accessToken && !opts.headers['Authorization']) {
    opts.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(path, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

