export async function api(path, { method = 'GET', body, headers } = {}) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(headers || {}),
        },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(path, opts);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status} ${res.statusText} - ${text}`);
    }

    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
}