const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

class DashboardController {
    constructor() {
        this.state = {
            proprietario: null,
        };
    }

    async initialize() {
        this.state.proprietario = getLoggedOwner();
        
        if (!requireOwnerOrRedirect(this.state.proprietario, '/login.html')) {
            return;
        }

        await Promise.all([
            this.loadStatistics(),
            this.loadRecentActivity(),
            this.loadRecentPayments()
        ]);
    }

    async loadStatistics() {
        try {
            const data = await window.AppHttp.request('/dashboard/estatisticas?id_proprietario=' + this.state.proprietario.id);
            this.renderStatistics(data);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    async loadRecentActivity() {
        try {
            const data = await window.AppHttp.request('/dashboard/atividade-recente?id_proprietario=' + this.state.proprietario.id);
            this.renderRecentActivity(data);
        } catch (error) {
            console.error('Erro ao carregar atividade recente:', error);
        }
    }

    async loadRecentPayments() {
        try {
            const params = new URLSearchParams({
                id_proprietario: this.state.proprietario.id,
                limit: 4,
                skip: 0,
                order_by: 'criado_em,numero_parcela',
                order_direction: 'desc'
            });
            const data = await window.AppHttp.request('/pagamentos?' + params.toString());
            this.renderPayments(data.content);
        } catch (error) {
            console.error('Erro ao carregar pagamentos:', error);
        }
    }

    renderStatistics(data) {
        document.querySelector('#imoveis_vagos').textContent = data.imoveis_disponiveis;
        document.querySelector('#imoveis_alugados').textContent = data.imoveis_alugados;
        document.querySelector('#pagamentos_pendentes').textContent = data.pagamentos_pendentes;
    }

    renderRecentActivity(data) {
        document.querySelector('#atividade_contrato').textContent = data.imovel_alugado;
        document.querySelector('#atividade_imovel').textContent = data.imovel_disponivel;
        document.querySelector('#atividade_inquilino').textContent = data.inquilino;
    }

    renderPayments(pagamentos) {
        const tbody = document.querySelector('#pagamentos-tbody');
        tbody.innerHTML = pagamentos.map(pagamento => {
            const badgeType = this.getBadgeType(pagamento.status);
            return `
                <tr>
                    <td>${pagamento.inquilino.nome}</td>
                    <td>${pagamento.imovel.apelido_imovel}</td>
                    <td>${window.AppUtils.formatCurrency(pagamento.valor_total)}</td>
                    <td><span class="badge ${badgeType}">${pagamento.status}</span></td>
                    <td><a class="btn btn-secondary btn-small" href="../pagamento/?id=${pagamento.id}">Acessar</a></td>
                </tr>
            `;
        }).join('');
    }

    getBadgeType(status) {
        const badgeMap = {
            'Pendente': 'warning',
            'Pago': 'success',
            'Atrasado': 'error'
        };
        return badgeMap[status] || 'error';
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    const dashboard = new DashboardController();
    await dashboard.initialize();
});

