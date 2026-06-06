const STORAGE_KEY = 'proprietario';

window.AppSession = {
    getLoggedOwner() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    },
    setLoggedOwner(owner) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(owner));
    },
    clearLoggedOwner() {
        localStorage.removeItem(STORAGE_KEY);
    },
};