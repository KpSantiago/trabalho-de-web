class PaginationManager {
    constructor(onPageChange) {
        this.state = {
            currentPage: 0,
            limit: 10,
            totalPages: 0,
            totalItems: 0,
        };
        this.onPageChange = onPageChange;
    }

    render(paginationData) {
        const paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer) return;

        this.state.totalPages = paginationData.pages || 0;
        this.state.totalItems = paginationData.total || 0;

        paginationContainer.innerHTML = this.getPaginationHTML(paginationData);
        this.attachEventListeners();
    }

    getPaginationHTML(paginationData) {
        const totalPages = paginationData.pages || 0;
        const totalItems = paginationData.total || 0;
        
        return `
            <div class="pagination-info">
                <span>Página ${this.state.currentPage + 1} de ${totalPages}</span>
                <span>Total: ${totalItems} itens</span>
            </div>
            <div class="pagination-controls">
                <select class="pagination-limit" id="pagination-limit">
                    <option value="10" ${this.state.limit === 10 ? 'selected' : ''}>10 por página</option>
                    <option value="20" ${this.state.limit === 20 ? 'selected' : ''}>20 por página</option>
                    <option value="50" ${this.state.limit === 50 ? 'selected' : ''}>50 por página</option>
                    <option value="100" ${this.state.limit === 100 ? 'selected' : ''}>100 por página</option>
                </select>
                <button class="btn btn-secondary btn-small" id="btn-first" ${!paginationData.previous ? 'disabled' : ''}>Primeira</button>
                <button class="btn btn-secondary btn-small" id="btn-previous" ${!paginationData.previous ? 'disabled' : ''}>Anterior</button>
                <button class="btn btn-secondary btn-small" id="btn-next" ${!paginationData.next ? 'disabled' : ''}>Próxima</button>
                <button class="btn btn-secondary btn-small" id="btn-last" ${!paginationData.next ? 'disabled' : ''}>Última</button>
            </div>
        `;
    }

    attachEventListeners() {
        const limitSelect = document.getElementById('pagination-limit');
        if (limitSelect) {
            limitSelect.addEventListener('change', (e) => this.handleLimitChange(e));
        }

        document.getElementById('btn-first')?.addEventListener('click', () => this.goToPage(0));
        document.getElementById('btn-previous')?.addEventListener('click', () => this.goToPage(this.state.currentPage - 1));
        document.getElementById('btn-next')?.addEventListener('click', () => this.goToPage(this.state.currentPage + 1));
        document.getElementById('btn-last')?.addEventListener('click', () => this.goToPage(this.state.totalPages - 1));
    }

    handleLimitChange(e) {
        this.state.limit = parseInt(e.target.value);
        this.state.currentPage = 0;
        this.onPageChange(0, this.state.limit);
    }

    goToPage(page) {
        if (page < 0 || page >= this.state.totalPages) return;
        this.state.currentPage = page;
        const skip = page * this.state.limit;
        this.onPageChange(skip, this.state.limit);
    }

    getSkip() {
        return this.state.currentPage * this.state.limit;
    }

    getLimit() {
        return this.state.limit;
    }
}
