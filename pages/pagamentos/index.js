const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

const state = {
    currentPage: 0,
    limit: 10,
    totalPages: 0,
    totalItems: 0,
};

// METRICAS DE PAGAMENTOS
async function loadMetrics() {
    const proprietario = getLoggedOwner();
    
    if (!requireOwnerOrRedirect(proprietario, (message) => console.error(message))) {
        return;
    }

    const response = await fetch(`http://127.0.0.1:8000/pagamentos/metrics/geral?id_proprietario=${proprietario.id}`);
    
    return response.json();
}

loadMetrics().then(data => {
    document.getElementById('pending-count').textContent = data.pendentes;
    document.getElementById('paid-this-month').textContent = data.pagos_mes;
    document.getElementById('overdue-count').textContent = data.atrasados;
}).catch(error => {
    console.error('Erro ao carregar métricas:', error);
});

// TABELA DE PAGAMENTOS
async function loadPayments(skip = 0, limit = 10) {
    const proprietario = getLoggedOwner();
    
    if (!requireOwnerOrRedirect(proprietario, (message) => console.error(message))) {
        return;
    }

    const params = new URLSearchParams({
        id_proprietario: proprietario.id,
        skip: skip,
        limit: limit,
        order_by: 'numero_percela',
        order_direction: 'desc'
    });
    const response = await fetch(`http://127.0.0.1:8000/pagamentos?${params.toString()}`);
    
    return response.json();
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
        loadPayments(skip, state.limit).then(data => {
            renderTable(data.content);
            renderPagination(data);
        }).catch(error => {
            console.error("Erro ao carregar pagamentos: ", error);
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
    loadPayments(skip, state.limit).then(data => {
        renderTable(data.content);
        renderPagination(data);
    }).catch(error => {
        console.error("Erro ao carregar pagamentos: ", error);
    });
}

function renderTable(pagamentos) {
    const tbody = document.querySelector('.pagamentos-tboy');

    if (!pagamentos || pagamentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10">Nenhum pagamento encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = pagamentos.map(pagamento => `
        <tr>
            <td>${pagamento.numero_parcela}</td>
            <td>${pagamento.inquilino.nome}</td>
            <td>${pagamento.imovel.apelido_imovel} - ${pagamento.imovel.endereco}</td>
            <td>${new Date(pagamento.data_vencimento).toLocaleDateString('pt-BR')}</td>
            <td>${pagamento.valor_original.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${pagamento.multa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${pagamento.juros.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${pagamento.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td><span class="badge ${pagamento.status === 'Pago' ? 'success' : pagamento.status === 'Atrasado' ? 'error' : 'warning'}">${pagamento.status}</span></td>
            <td><a class="btn btn-secondary btn-small" href="../pagamento/?id=${pagamento.id}">Acessar</a></td>
        </tr>
    `).join('');
}

loadPayments(0, state.limit).then(data => {
    renderTable(data.content);
    renderPagination(data);
}).catch(error => {
    console.error('Erro ao carregar pagamentos:', error);
});

