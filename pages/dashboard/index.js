const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

const state = {
    imoveis: [],
    editingId: null,
    proprietario: null,
    isSubmitting: false,
};

async function loadStatistics(proprietarioId) {
    const data = await fetch(`http://127.0.0.1:8000/dashboard/estatisticas?id_proprietario=${proprietarioId}`);
    
    return data.json();    
}

async function loadAtividadeRecente(proprietarioId) {
    const data = await fetch(`http://127.0.0.1:8000/dashboard/atividade-recente?id_proprietario=${proprietarioId}`);
    
    return data.json();    
}

async function loadPagamentos(proprietarioId) {
    const data = await fetch(`http://127.0.0.1:8000/pagamentos?id_proprietario=${proprietarioId}&limit=4&skip=0&order_by=criado_em,numero_parcela&order_direction=desc`);
    
    return data.json();    
}

function setupStatistics(proprietarioId) {
    loadStatistics(proprietarioId).then(data => {
        document.querySelector('#imoveis_vagos').textContent = data.imoveis_disponiveis;
        document.querySelector('#imoveis_alugados').textContent = data.imoveis_alugados;
        document.querySelector('#pagamentos_pendentes').textContent = data.pagamentos_pendentes;
    }).catch(err => {
        console.error(err);
    });
}

function setupAtividadeRecente(proprietarioId) {
    loadAtividadeRecente(proprietarioId).then(data => {
        document.querySelector('#atividade_contrato').textContent = data.imovel_alugado;
        document.querySelector('#atividade_imovel').textContent = data.imovel_disponivel;
        document.querySelector('#atividade_inquilino').textContent = data.inquilino;
    }).catch(err => {
        console.error("Erro ao carregar atividade recente:", err);
    });
}

function setupPagamentos(proprietarioId) {
    loadPagamentos(proprietarioId).then(data => {
        const tbody = document.querySelector('#pagamentos-tbody');
        data.content.forEach(pagamento => {
            const row = document.createElement('tr');
            const badgeType = pagamento.status === 'Pendente' ? 'warning' : pagamento.status === 'Pago' ? 'success' : 'error';
            row.innerHTML = `
                <td>${pagamento.inquilino.nome}</td>
                <td>${pagamento.imovel.apelido_imovel}</td>
                <td>${pagamento.valor_total}</td>
                <td><span class="badge ${badgeType}">${pagamento.status}</span></td>
                <td><a class="btn btn-secondary btn-small" href="../pagamento/?id=${pagamento.id}">Acessar</a></td>
            `;
            tbody.appendChild(row);
        });
    }).catch(err => {
        console.error("Erro ao carregar pagamentos:", err);
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    state.proprietario = getLoggedOwner();
    
    requireOwnerOrRedirect(state.proprietario, '/login.html');

    setupStatistics(state.proprietario.id);
    setupAtividadeRecente(state.proprietario.id);
    setupPagamentos(state.proprietario.id);
});

