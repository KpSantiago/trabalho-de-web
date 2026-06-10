const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

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
        } else {
            tbody.innerHTML = contratos.map(contrato => this.getContractRow(contrato)).join('');
        }
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
