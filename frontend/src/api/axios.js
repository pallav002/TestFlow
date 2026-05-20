const BASE_URL = window.location.hostname.includes('loca.lt')
    ? 'https://fluffy-toys-push.loca.lt/api/v1'
    : `http://${window.location.hostname}:8080/api/v1`;

const request = async (method, url, data = null, isForm = false, _retry = true) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (data && !isForm) headers['Content-Type'] = 'application/json';

    let res;
    try {
        res = await fetch(`${BASE_URL}${url}`, {
            method,
            headers,
            body: isForm ? data : data ? JSON.stringify(data) : undefined,
        });
    } catch (networkErr) {
        // "Failed to fetch" — retry once after a short delay
        if (_retry) {
            await new Promise(r => setTimeout(r, 800));
            return request(method, url, data, isForm, false);
        }
        throw networkErr;
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        const error = new Error(err.detail || 'Request failed');
        error.response = { status: res.status, data: err };
        throw error;
    }

    const text = await res.text();
    return { data: text ? JSON.parse(text) : null };
};

const api = {
    get: (url) => request('GET', url),
    delete: (url) => request('DELETE', url),
    post: (url, data, cfg) => {
        const isForm = cfg?.headers?.['Content-Type'] === 'application/x-www-form-urlencoded'
            || data instanceof FormData
            || data instanceof URLSearchParams;
        return request('POST', url, data, isForm);
    },
    put: (url, data) => request('PUT', url, data),
    patch: (url, data) => request('PATCH', url, data),
};

export default api;
