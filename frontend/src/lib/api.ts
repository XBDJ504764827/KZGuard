export const API_BASE_URL =
    process.env.NODE_ENV === 'development'
        ? 'http://192.168.0.132:8080'
        : process.env.NEXT_PUBLIC_API_URL || '';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Try to retrieve token from local storage to append in headers
    const headers = new Headers(options.headers || {});
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    return response;
}
