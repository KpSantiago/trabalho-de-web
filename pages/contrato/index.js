class ContratoController {
    constructor() {
        this.state = {
            contratoId: null,
            contrato: null,
        };
        this.elements = {};
    }

    async initialize() {
        this.state.contratoId = this.getContractIdFromUrl();
        
        if (!this.state.contratoId) {
            this.handleMissingId();
            return;
        }

        this.cacheElements();
        this.setupEventListeners();
        await this.loadContrato();
    }

    getContractIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    handleMissingId() {
        console.error('ID do contrato não fornecido');
        alert('ID do contrato não fornecido');
        window.location.href = '/trabalho-de-web/pages/contratos';
    }

    cacheElements() {
        this.elements = {
            valueRent: document.querySelector('.value-rent'),
            dueDay: document.querySelector('.due-day'),
            startDate: document.querySelector('.start-date'),
            endDate: document.querySelector('.end-date'),
            idContract: document.querySelector('.id-contract'),
            nameTenant: document.querySelector('.name-tenant'),
            cpfTenant: document.querySelector('.cpf-tenant'),
            phoneTenant: document.querySelector('.phone-tenant'),
            nameProperty: document.querySelector('.name-property'),
            addressProperty: document.querySelector('.address-property'),
            statusProperty: document.querySelector('.status-property'),
            badge: document.querySelector('.badge'),
            daysLeft: document.querySelector('.days-left'),
            btnEncerrar: document.getElementById('btn-encerrar'),
        };
    }

    setupEventListeners() {
        this.elements.btnEncerrar?.addEventListener('click', () => this.handleEncerrarContrato());
    }

    async loadContrato() {
        try {
            const contrato = await window.AppHttp.request(`/contratos/${this.state.contratoId}`);
            this.state.contrato = contrato;
            this.renderContrato(contrato);
        } catch (error) {
            console.error('Erro ao carregar contrato:', error);
        }
    }

    renderContrato(contrato) {
        const diasRestantes = this.calculateDaysRemaining(contrato.data_fim);
        
        this.elements.valueRent.textContent = window.AppUtils.formatCurrency(contrato.valor_aluguel);
        this.elements.dueDay.textContent = contrato.dia_vencimento;
        this.elements.startDate.textContent = this.formatDate(contrato.data_inicio);
        this.elements.endDate.textContent = this.formatDate(contrato.data_fim);
        this.elements.idContract.textContent = contrato.id;
        this.elements.nameTenant.textContent = contrato.inquilino.nome;
        this.elements.cpfTenant.textContent = contrato.inquilino.cpf;
        this.elements.phoneTenant.textContent = contrato.inquilino.telefone;
        this.elements.nameProperty.textContent = contrato.imovel.apelido_imovel;
        this.elements.addressProperty.textContent = contrato.imovel.endereco;
        this.elements.statusProperty.textContent = contrato.imovel.status;
        this.elements.badge.textContent = contrato.status;

        this.updateStatusDisplay(contrato, diasRestantes);
    }

    calculateDaysRemaining(dataFim) {
        const dataAtual = new Date();
        const dataFimDate = new Date(dataFim);
        let diasRestantes = Math.ceil((dataFimDate - dataAtual) / (1000 * 60 * 60 * 24));
        return diasRestantes < 0 ? 0 : diasRestantes;
    }

    updateStatusDisplay(contrato, diasRestantes) {
        const statusUpper = contrato.status.toUpperCase();
        
        if (diasRestantes <= 30 || statusUpper === 'ENCERRADO') {
            this.elements.badge.className = 'badge warning';
            if (statusUpper === 'ENCERRADO') {
                this.elements.daysLeft.textContent = 'Contrato Encerrado';
            } else {
                this.elements.daysLeft.textContent = `Vence em ${diasRestantes} dias`;
            }
            this.elements.daysLeft.style.color = 'var(--warning)';
        } else if (diasRestantes <= 0 || statusUpper === 'CANCELADO') {
            this.elements.badge.className = 'badge error';
            if (statusUpper === 'CANCELADO') {
                this.elements.daysLeft.textContent = 'Contrato Cancelado';
            } else {
                this.elements.daysLeft.textContent = `Vence em ${diasRestantes} dias`;
            }
            this.elements.daysLeft.style.color = 'var(--error)';
        } else {
            this.elements.badge.className = 'badge success';
            this.elements.daysLeft.textContent = `Vence em ${diasRestantes} dias`;
            this.elements.daysLeft.style.color = 'var(--success)';
        }
    }

    async handleEncerrarContrato() {
        try {
            await window.AppHttp.request(`/contratos/${this.state.contratoId}/encerrar`, {
                method: 'POST',
                body: JSON.stringify({})
            });
            window.location.href = '/trabalho-de-web/pages/contratos';
        } catch (error) {
            console.error('Erro ao encerrar contrato:', error);
            alert('Erro ao encerrar contrato');
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const controller = new ContratoController();
    controller.initialize();
});


