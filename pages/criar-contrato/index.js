const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

class CriarContratoController {
    constructor() {
        this.state = {
            proprietario: null,
            selectedInquilino: null,
            selectedImovel: null,
        };
        this.elements = {
            inquilinoSelect: null,
            imovelSelect: null,
            form: null,
            submitBtn: null,
            cpfInput: null,
            enderecoInput: null,
        };
    }

    async initialize() {
        this.state.proprietario = getLoggedOwner();
        
        if (!requireOwnerOrRedirect(this.state.proprietario)) {
            window.location.href = '../login/';
            return;
        }

        this.cacheElements();
        this.setupEventListeners();
        
        await Promise.all([
            this.loadInquilinos(),
            this.loadImoveis()
        ]);
    }

    cacheElements() {
        this.elements.inquilinoSelect = document.querySelector('select#inquilino');
        this.elements.imovelSelect = document.querySelector('select#imovel');
        this.elements.form = document.querySelector('form.contract-form');
        this.elements.submitBtn = document.querySelector('.submit-btn');
        this.elements.cpfInput = document.querySelector('#cpf');
        this.elements.enderecoInput = document.querySelector('#endereco');
    }

    setupEventListeners() {
        this.elements.inquilinoSelect.addEventListener('change', () => this.handleInquilinoChange());
        this.elements.imovelSelect.addEventListener('change', () => this.handleImovelChange());
        this.elements.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    async loadInquilinos() {
        try {
            const inquilinos = await window.AppHttp.request(`/inquilinos/proprietario/${this.state.proprietario.id}`);
            this.populateInquilinoSelect(inquilinos);
        } catch (error) {
            console.error('Erro ao carregar inquilinos:', error);
        }
    }

    async loadInquilinoById(id) {
        try {
            return await window.AppHttp.request(`/inquilinos/${id}/`);
        } catch (error) {
            console.error('Erro ao carregar inquilino:', error);
        }
    }

    populateInquilinoSelect(inquilinos) {
        this.elements.inquilinoSelect.innerHTML = inquilinos.map(inquilino => 
            `<option value="${inquilino.id}">${inquilino.nome}</option>`
        ).join('');
    }

    async handleInquilinoChange() {
        const inquilinoId = this.elements.inquilinoSelect.value;
        if (!inquilinoId) return;

        const inquilino = await this.loadInquilinoById(inquilinoId);
        if (inquilino) {
            this.elements.cpfInput.value = inquilino.cpf;
        }
    }

    async loadImoveis() {
        try {
            const imoveis = await window.AppHttp.request(`/imoveis/proprietario/${this.state.proprietario.id}`);
            this.populateImovelSelect(imoveis);
        } catch (error) {
            console.error('Erro ao carregar imóveis:', error);
        }
    }

    async loadImovelById(id) {
        try {
            return await window.AppHttp.request(`/imoveis/${id}/`);
        } catch (error) {
            console.error('Erro ao carregar imóvel:', error);
        }
    }

    populateImovelSelect(imoveis) {
        this.elements.imovelSelect.innerHTML = imoveis.map(imovel => 
            `<option value="${imovel.id}">${imovel.apelido_imovel}</option>`
        ).join('');
    }

    async handleImovelChange() {
        const imovelId = this.elements.imovelSelect.value;
        if (!imovelId) return;

        const imovel = await this.loadImovelById(imovelId);
        if (imovel) {
            this.elements.enderecoInput.value = imovel.endereco;
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        this.setSubmitting(true);

        const formData = this.getFormData();

        try {
            await window.AppHttp.request('/contratos', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            alert('Contrato criado com sucesso!');
        } catch (error) {
            console.error('Erro ao criar contrato:', error);
            alert('Erro ao criar contrato!');
        } finally {
            this.setSubmitting(false);
        }
    }

    getFormData() {
        return {
            id_inquilino: this.elements.inquilinoSelect.value,
            id_imovel: this.elements.imovelSelect.value,
            data_inicio: document.querySelector('#dataInicio').value,
            data_fim: document.querySelector('#dataVencimento').value,
            valor_aluguel: parseFloat(document.querySelector('#valorAluguel').value),
            dia_vencimento: parseInt(document.querySelector('#diaVencimento').value),
            id_proprietario: this.state.proprietario.id
        };
    }

    setSubmitting(isSubmitting) {
        if (isSubmitting) {
            this.elements.submitBtn.setAttribute('disabled', 'true');
        } else {
            this.elements.submitBtn.removeAttribute('disabled');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const controller = new CriarContratoController();
    controller.initialize();
});
