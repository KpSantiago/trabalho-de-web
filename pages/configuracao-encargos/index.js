const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

class ConfiguracaoEncargosController {
    constructor() {
        this.state = {
            proprietario: null,
        };
        this.elements = {};
    }

    initialize() {
        this.state.proprietario = getLoggedOwner();
        
        if (!requireOwnerOrRedirect(this.state.proprietario, (message) => alert(message))) {
            return;
        }

        this.cacheElements();
        this.setupEventListeners();
    }

    cacheElements() {
        this.elements = {
            form: document.querySelector('form'),
            multaPercentual: document.querySelector('#multaPercentual'),
            jurosMora: document.querySelector('#jurosMora'),
            toleranciaDias: document.querySelector('#toleranciaDias'),
            valorMinimoMulta: document.querySelector('#valorMinimoMulta'),
        };
    }

    setupEventListeners() {
        this.elements.form?.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const data = this.getFormData();

        try {
            await window.AppHttp.request('/pagamentos/configurar-encargos/', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            alert('Erro ao salvar configurações!');
        }
    }

    getFormData() {
        return {
            multa_percentual: this.elements.multaPercentual.value,
            juros_mensal: this.elements.jurosMora.value,
            tolerancia_dias: this.elements.toleranciaDias.value,
            valor_minimo_multa: this.elements.valorMinimoMulta.value,
            id_proprietario: this.state.proprietario.id
        };
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const controller = new ConfiguracaoEncargosController();
    controller.initialize();
});
