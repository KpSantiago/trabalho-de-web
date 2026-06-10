const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

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

        this.state.totalPages = paginationData.pages;
        this.state.totalItems = paginationData.total;

        paginationContainer.innerHTML = this.getPaginationHTML(paginationData);
        this.attachEventListeners();
    }

    getPaginationHTML(paginationData) {
        return `
            <div class="pagination-info">
                <span>Página ${this.state.currentPage + 1} de ${this.state.totalPages}</span>
                <span>Total: ${this.state.totalItems} itens</span>
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

class ContratosController {
    constructor() {
        this.state = {
            proprietario: null,
        };
        this.pagination = new PaginationManager((skip, limit) => this.loadContratos(skip, limit));
    }

    async initialize() {
        this.state.proprietario = getLoggedOwner();
        
        if (!requireOwnerOrRedirect(this.state.proprietario, (message) => console.error(message))) {
            return;
        }

        await Promise.all([
            this.loadMetrics(),
            this.loadContratos(0, this.pagination.getLimit())
        ]);
    }

    async loadMetrics() {
        try {
            const metrics = await window.AppHttp.request('/contratos/metrics/geral?id_proprietario=' + this.state.proprietario.id);
            this.renderMetrics(metrics);
        } catch (error) {
            this.renderMetricsError();
            console.error('Erro ao carregar métricas:', error);
        }
    }

    renderMetrics(metrics) {
        document.querySelector('.ativos .number').textContent = metrics.contratos_ativos;
        document.querySelector('.disponiveis .number').textContent = metrics.imoveis_disponiveis;
        document.querySelector('.vencendo .number').textContent = metrics.contratos_vencendo;
    }

    renderMetricsError() {
        document.querySelector('.ativos .number').textContent = '0';
        document.querySelector('.disponiveis .number').textContent = '0';
        document.querySelector('.vencendo .number').textContent = '0';
    }

    async loadContratos(skip, limit) {
        try {
            const params = new URLSearchParams({
                id_proprietario: this.state.proprietario.id,
                skip: skip,
                limit: limit
            });
            const data = await window.AppHttp.request('/contratos?' + params.toString());
            this.renderTable(data.content);
            this.pagination.render(data);
        } catch (error) {
            this.renderTableError();
            console.error('Erro ao carregar contratos:', error);
        }
    }

    renderTable(contratos) {
        const tbody = document.querySelector('.contratos-tbody');

        if (!contratos || contratos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">Nenhum contrato fechado</td></tr>';
            return;
        }
        
        tbody.innerHTML = contratos.map(contrato => this.getContractRow(contrato)).join('');
    }

    getContractRow(contrato) {
        return `
            <tr>
                <td>${contrato.id}</td>
                <td>${contrato.inquilino.nome}</td>
                <td>${contrato.imovel.apelido_imovel} - ${contrato.imovel.endereco}</td>
                <td>${window.AppUtils.formatCurrency(contrato.valor_aluguel)}</td>
                <td>${this.formatDate(contrato.data_inicio)}</td>
                <td>${this.formatDate(contrato.data_fim)}</td>
                <td><span class="badge ${this.getStatusBadgeClass(contrato.status)}">${contrato.status}</span></td>
                <td><a class="btn btn-secondary btn-small" href="../contrato/?id=${contrato.id}">Acessar</a></td>
            </tr>
        `;
    }

    renderTableError() {
        document.querySelector('.contratos-tbody').innerHTML = '<tr><td colspan="8">Erro ao carregar contratos</td></tr>';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    getStatusBadgeClass(status) {
        const statusMap = {
            'Ativo': 'success',
            'Encerrado': 'warning',
            'Cancelado': 'error'
        };
        return statusMap[status] || 'error';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const controller = new ContratosController();
    controller.initialize();
});
