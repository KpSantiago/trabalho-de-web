const API_BASE_URL = 'http://localhost:8000';

window.AppHttp = {
    API_BASE_URL,
    async request(path, options = {}) {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
            ...options,
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload.detail || 'Erro ao comunicar com o servidor.');
        }

        return payload;
    },
};