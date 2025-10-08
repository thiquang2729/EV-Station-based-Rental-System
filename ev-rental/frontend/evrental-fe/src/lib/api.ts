export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost';


export async function api(path:string, opts:RequestInit = {}) {
const token = localStorage.getItem('token') || '';
const headers = new Headers(opts.headers || {});
if (token) headers.set('Authorization', `Bearer ${token}`);
headers.set('Content-Type', 'application/json');
const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
const json = await res.json();
if (!res.ok || json.success === false) throw new Error(json.message || 'Request failed');
return json;
}