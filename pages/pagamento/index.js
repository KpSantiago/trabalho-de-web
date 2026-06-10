const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

class PagamentoController {
    constructor() {
        this.state = {
            proprietario: null,
            pagamentoId: null,
            pagamento: null,
        };
        this.elements = {};
    }

    async initialize() {
        this.state.proprietario = getLoggedOwner();
        
        if (!requireOwnerOrRedirect(this.state.proprietario)) {
            return;
        }

        this.state.pagamentoId = this.getPagamentoIdFromUrl();
        
        if (!this.state.pagamentoId) {
            this.handleMissingId();
            return;
        }

        this.cacheElements();
        this.setupEventListeners();
        await this.loadPagamento();
    }

    getPagamentoIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    handleMissingId() {
        window.location.href = '../pagamentos/';
        alert('ID do pagamento não fornecido');
    }

    cacheElements() {
        this.elements = {
            nomeInquilino: document.querySelector('#nome-inquilino'),
            cpfInquilino: document.querySelector('#cpf-inquilino'),
            telefoneInquilino: document.querySelector('#telefone-inquilino'),
            imovel: document.querySelector('#imovel'),
            endereco: document.querySelector('#endereco'),
            parcela: document.querySelector('#parcela'),
            vencimento: document.querySelector('#vencimento'),
            valorOriginal: document.querySelector('#valor-original'),
            multa: document.querySelector('#multa'),
            juros: document.querySelector('#juros'),
            valorTotal: document.querySelector('#valor-total'),
            status: document.querySelector('#status'),
            diasAtraso: document.querySelector('#dias-atraso'),
            btnConfirm: document.querySelector('.btn-confirm'),
        };
    }

    setupEventListeners() {
        this.elements.btnConfirm?.addEventListener('click', () => this.handleConfirmarPagamento());
    }

    async loadPagamento() {
        try {
            const pagamento = await window.AppHttp.request(`/pagamentos/${this.state.pagamentoId}`);
            this.state.pagamento = pagamento;
            this.renderPagamento(pagamento);
        } catch (error) {
            console.error('Erro ao carregar pagamento:', error);
        }
    }

    renderPagamento(pagamento) {
        const diasAtraso = this.calculateDaysOverdue(pagamento.data_vencimento);
        
        this.elements.nomeInquilino.textContent = pagamento.inquilino.nome;
        this.elements.cpfInquilino.textContent = pagamento.inquilino.cpf;
        this.elements.telefoneInquilino.textContent = pagamento.inquilino.telefone;
        this.elements.imovel.textContent = pagamento.imovel.apelido_imovel;
        this.elements.endereco.textContent = pagamento.imovel.endereco;
        this.elements.parcela.textContent = pagamento.numero_parcela;
        this.elements.vencimento.textContent = this.formatDate(pagamento.data_vencimento);
        this.elements.valorOriginal.textContent = window.AppUtils.formatCurrency(pagamento.valor_original);
        this.elements.multa.textContent = window.AppUtils.formatCurrency(pagamento.multa);
        this.elements.juros.textContent = window.AppUtils.formatCurrency(pagamento.juros);
        this.elements.valorTotal.textContent = window.AppUtils.formatCurrency(pagamento.valor_total);
        
        this.elements.status.textContent = pagamento.status.toUpperCase();
        this.updateStatusDisplay(pagamento, diasAtraso);
    }

    calculateDaysOverdue(dataVencimento) {
        return Math.floor((new Date() - new Date(dataVencimento)) / (1000 * 60 * 60 * 24));
    }

    updateStatusDisplay(pagamento, diasAtraso) {
        this.elements.diasAtraso.textContent = diasAtraso > 0 
            ? `${diasAtraso} dias de atraso` 
            : `${Math.abs(diasAtraso)} dias até a data de vencimento`;

        if (diasAtraso > 0) {
            this.elements.status.classList.add('error');
            this.elements.diasAtraso.style.color = 'var(--error)';
        } else {
            this.elements.status.classList.add('warning');
            this.elements.diasAtraso.style.color = 'var(--warning)';
        }

        if (pagamento.status.toLowerCase() === 'pago') {
            this.elements.btnConfirm.setAttribute('disabled', 'true');
            this.elements.btnConfirm.style.opacity = '0.5';

            this.elements.status.classList.remove('warning');
            this.elements.status.classList.remove('error');
            this.elements.status.classList.add('success');
        }
    }

    async handleConfirmarPagamento() {
        try {
            await window.AppHttp.request(`/pagamentos/${this.state.pagamentoId}/confirmar`, {
                method: 'PUT',
                body: JSON.stringify({})
            });
            window.location.reload();
        } catch (error) {
            console.error('Erro ao confirmar pagamento:', error);
            alert('Erro ao confirmar pagamento');
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const controller = new PagamentoController();
    controller.initialize();
});