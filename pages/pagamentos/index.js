const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

class PagamentosController {
    constructor() {
        this.state = {
            proprietario: null,
        };
        this.pagination = new PaginationManager((skip, limit) => this.loadPayments(skip, limit));
    }

    async initialize() {
        this.state.proprietario = getLoggedOwner();
        
        if (!requireOwnerOrRedirect(this.state.proprietario, (message) => console.error(message))) {
            return;
        }

        await Promise.all([
            this.loadMetrics(),
            this.loadPayments(0, this.pagination.getLimit())
        ]);
    }

    async loadMetrics() {
        try {
            const metrics = await window.AppHttp.request('/pagamentos/metrics/geral?id_proprietario=' + this.state.proprietario.id);
            this.renderMetrics(metrics);
        } catch (error) {
            console.error('Erro ao carregar métricas:', error);
        }
    }

    renderMetrics(metrics) {
        document.getElementById('pending-count').textContent = metrics.pendentes;
        document.getElementById('paid-this-month').textContent = metrics.pagos_mes;
        document.getElementById('overdue-count').textContent = metrics.atrasados;
    }

    async loadPayments(skip, limit) {
        try {
            const params = new URLSearchParams({
                id_proprietario: this.state.proprietario.id,
                skip: skip,
                limit: limit
            });
            const data = await window.AppHttp.request('/pagamentos?' + params.toString());
            this.renderTable(data.content);
            this.pagination.render(data);
        } catch (error) {
            console.error('Erro ao carregar pagamentos:', error);
        }
    }

    renderTable(pagamentos) {
        const tbody = document.querySelector('.pagamentos-tboy');

        if (!pagamentos || pagamentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10">Nenhum pagamento encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = pagamentos.map(pagamento => this.getPaymentRow(pagamento)).join('');
    }

    getPaymentRow(pagamento) {
        return `
            <tr>
                <td>${pagamento.numero_parcela}</td>
                <td>${pagamento.inquilino.nome}</td>
                <td>${pagamento.imovel.apelido_imovel} - ${pagamento.imovel.endereco}</td>
                <td>${this.formatDate(pagamento.data_vencimento)}</td>
                <td>${window.AppUtils.formatCurrency(pagamento.valor_original)}</td>
                <td>${window.AppUtils.formatCurrency(pagamento.multa)}</td>
                <td>${window.AppUtils.formatCurrency(pagamento.juros)}</td>
                <td>${window.AppUtils.formatCurrency(pagamento.valor_total)}</td>
                <td><span class="badge ${this.getStatusBadgeClass(pagamento.status)}">${pagamento.status}</span></td>
                <td><a class="btn btn-secondary btn-small" href="../pagamento/?id=${pagamento.id}">Acessar</a></td>
            </tr>
        `;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    getStatusBadgeClass(status) {
        const statusMap = {
            'Pago': 'success',
            'Atrasado': 'error',
            'Pendente': 'warning'
        };
        return statusMap[status] || 'warning';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const controller = new PagamentosController();
    controller.initialize();
});

