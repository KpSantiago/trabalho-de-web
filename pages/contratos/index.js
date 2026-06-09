const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

const state = {
    currentPage: 0,
    limit: 10,
    totalPages: 0,
    totalItems: 0,
};

// Métricas
async function loadMetricas() {
    const proprietario = getLoggedOwner();
    
    if (!requireOwnerOrRedirect(proprietario, (message) => console.error(message))) {
        return;
    }

    const data = await fetch(`http://127.0.0.1:8000/contratos/metrics/geral?id_proprietario=${proprietario.id}`);
    
    return await data.json();
}

loadMetricas().then(metricas => {
    document.querySelector('.ativos .number').textContent = metricas.contratos_ativos;
    document.querySelector('.disponiveis .number').textContent = metricas.imoveis_disponiveis;
    document.querySelector('.vencendo .number').textContent = metricas.contratos_vencendo;
}).catch(error => {
    document.querySelector('.ativos .number').textContent = '0';
    document.querySelector('.disponiveis .number').textContent = '0';
    document.querySelector('.vencendo .number').textContent = '0';

    console.error("Erro ao carregar métricas: ", error);
});

// TABELA - listagem de contratos
async function loadContratos(skip = 0, limit = 10) {
    const proprietario = getLoggedOwner();
    
    if (!requireOwnerOrRedirect(proprietario, (message) => console.error(message))) {
        return;
    }

    const params = new URLSearchParams({
        id_proprietario: proprietario.id,
        skip: skip,
        limit: limit
    });
    const data = await fetch(`http://127.0.0.1:8000/contratos?${params.toString()}`);

    return await data.json();
}

function renderPagination(paginationData) {
    const paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) return;

    state.totalPages = paginationData.pages;
    state.totalItems = paginationData.total;

    paginationContainer.innerHTML = `
        <div class="pagination-info">
            <span>Página ${state.currentPage + 1} de ${state.totalPages}</span>
            <span>Total: ${state.totalItems} itens</span>
        </div>
        <div class="pagination-controls">
            <select class="pagination-limit" id="pagination-limit">
                <option value="10" ${state.limit === 10 ? 'selected' : ''}>10 por página</option>
                <option value="20" ${state.limit === 20 ? 'selected' : ''}>20 por página</option>
                <option value="50" ${state.limit === 50 ? 'selected' : ''}>50 por página</option>
                <option value="100" ${state.limit === 100 ? 'selected' : ''}>100 por página</option>
            </select>
            <button class="btn btn-secondary btn-small" id="btn-first" ${!paginationData.previous ? 'disabled' : ''}>Primeira</button>
            <button class="btn btn-secondary btn-small" id="btn-previous" ${!paginationData.previous ? 'disabled' : ''}>Anterior</button>
            <button class="btn btn-secondary btn-small" id="btn-next" ${!paginationData.next ? 'disabled' : ''}>Próxima</button>
            <button class="btn btn-secondary btn-small" id="btn-last" ${!paginationData.next ? 'disabled' : ''}>Última</button>
        </div>
    `;

    document.getElementById('pagination-limit').addEventListener('change', (e) => {
        state.limit = parseInt(e.target.value);
        state.currentPage = 0;
        const skip = 0;
        loadContratos(skip, state.limit).then(data => {
            renderTable(data.content);
            renderPagination(data);
        }).catch(error => {
            console.error("Erro ao carregar contratos: ", error);
        });
    });

    document.getElementById('btn-first').addEventListener('click', () => goToPage(0));
    document.getElementById('btn-previous').addEventListener('click', () => goToPage(state.currentPage - 1));
    document.getElementById('btn-next').addEventListener('click', () => goToPage(state.currentPage + 1));
    document.getElementById('btn-last').addEventListener('click', () => goToPage(state.totalPages - 1));
}

function goToPage(page) {
    if (page < 0 || page >= state.totalPages) return;
    state.currentPage = page;
    const skip = page * state.limit;
    loadContratos(skip, state.limit).then(data => {
        renderTable(data.content);
        renderPagination(data);
    }).catch(error => {
        console.error("Erro ao carregar contratos: ", error);
    });
}

function renderTable(contratos) {
    const tbody = document.querySelector('.contratos-tbody');

    if (!contratos || contratos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Nenhum contrato fechado</td></tr>';
        return;
    }
    
    tbody.innerHTML = contratos.map(contrato => `
        <tr>
            <td>${contrato.id}</td>
            <td>${contrato.inquilino.nome}</td>
            <td>${contrato.imovel.apelido_imovel} - ${contrato.imovel.endereco}</td>
            <td>${contrato.valor_aluguel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${new Date(contrato.data_inicio).toLocaleDateString('pt-BR')}</td>
            <td>${new Date(contrato.data_fim).toLocaleDateString('pt-BR')}</td>
            <td><span class="badge ${contrato.status === 'Ativo' ? 'success' : contrato.status === 'Encerrado' ? 'warning' : 'error'}">${contrato.status}</span></td>
            <td><a class="btn btn-secondary btn-small" href="../contrato/?id=${contrato.id}">Acessar</a>
            </td>
        </tr>
    `).join('');
}

loadContratos(0, state.limit).then(data => {
    renderTable(data.content);
    renderPagination(data);
}).catch(error => {
    document.querySelector('.contratos-tbody').innerHTML = '<tr><td colspan="8">Erro ao carregar contratos</td></tr>';
    
    console.error("Erro ao carregar contratos: ", error);
});
