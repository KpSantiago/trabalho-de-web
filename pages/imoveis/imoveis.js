const { request } = window.AppHttp;
const { getLoggedOwner } = window.AppSession;
const { formatCurrency, escapeHtml } = window.AppUtils;
const { createFeedbackController, requireOwnerOrRedirect, confirmDeletion } = window.AppPage;

const state = {
    imoveis: [],
    editingId: null,
    proprietario: null,
    isSubmitting: false,
    currentPage: 0,
    limit: 10,
    totalPages: 0,
    totalItems: 0,
};

const form = document.getElementById('imovel-form');
const tbody = document.getElementById('imoveis-tbody');
const feedback = document.getElementById('feedback');
const formTitle = document.getElementById('form-title');
const btnSalvar = document.getElementById('btn-salvar');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
const feedbackController = createFeedbackController(feedback);

const fields = {
    apelido_imovel: document.getElementById('apelido-imovel'),
    tipo_imovel: document.getElementById('tipo-imovel'),
    valor_aluguel_base: document.getElementById('valor-aluguel'),
    endereco: document.getElementById('endereco'),
    status: document.getElementById('status'),
    descricao: document.getElementById('descricao'),
};


function getStatusBadgeClass(status) {
    return status === 'Alugado' ? 'success' : 'warning';
}

function showFeedback(message, type = 'info') {
    feedbackController.show(message, type);
}

function clearFeedback() {
    feedbackController.clear();
}


function serializeForm() {
    return {
        apelido_imovel: fields.apelido_imovel.value.trim(),
        tipo_imovel: fields.tipo_imovel.value,
        valor_aluguel_base: Number(fields.valor_aluguel_base.value),
        endereco: fields.endereco.value.trim(),
        status: fields.status.value,
        descricao: fields.descricao.value.trim() || null,
    };
}

function fillForm(imovel) {
    fields.apelido_imovel.value = imovel.apelido_imovel || '';
    fields.tipo_imovel.value = imovel.tipo_imovel || 'Apartamento';
    fields.valor_aluguel_base.value = imovel.valor_aluguel_base ?? '';
    fields.endereco.value = imovel.endereco || '';
    fields.status.value = imovel.status || 'Disponivel';
    fields.descricao.value = imovel.descricao || '';
}

function setSubmitting(isSubmitting) {
    state.isSubmitting = isSubmitting;
    btnSalvar.disabled = isSubmitting;
    btnCancelarEdicao.disabled = isSubmitting;
}

function resetFormState() {
    form.reset();
    state.editingId = null;
    formTitle.textContent = 'Cadastrar Imóvel';
    btnSalvar.textContent = 'Salvar';
}

function setEditMode(imovel) {
    state.editingId = imovel.id;
    fillForm(imovel);
    formTitle.textContent = 'Editar Imóvel';
    btnSalvar.textContent = 'Atualizar';
    showFeedback(`Editando: ${imovel.apelido_imovel}`, 'info');
}

function renderTable() {
    if (!state.imoveis.length) {
        tbody.innerHTML = '<tr><td colspan="5">Nenhum imóvel cadastrado.</td></tr>';
        return;
    }

    tbody.innerHTML = state.imoveis.map((imovel) => `
        <tr>
            <td>${escapeHtml(imovel.apelido_imovel)}</td>
            <td>${escapeHtml(imovel.tipo_imovel)}</td>
            <td>${formatCurrency(imovel.valor_aluguel_base)}</td>
            <td><span class="badge ${getStatusBadgeClass(imovel.status)}">${escapeHtml(imovel.status)}</span></td>
            <td>
                <button class="btn btn-small btn-edit" data-action="edit" data-id="${imovel.id}">Editar</button>
                <button class="btn btn-small btn-danger" data-action="delete" data-id="${imovel.id}">Excluir</button>
            </td>
        </tr>
    `).join('');
}


function renderPagination(paginationData) {
    const paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) {
        return;
    }

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

    document.getElementById('pagination-limit').addEventListener('change', (event) => {
        state.limit = parseInt(event.target.value, 10);
        state.currentPage = 0;
        loadImoveis(0, state.limit).catch((error) => {
            showFeedback(error.message, 'error');
        });
    });

    document.getElementById('btn-first').addEventListener('click', () => goToPage(0));
    document.getElementById('btn-previous').addEventListener('click', () => goToPage(state.currentPage - 1));
    document.getElementById('btn-next').addEventListener('click', () => goToPage(state.currentPage + 1));
    document.getElementById('btn-last').addEventListener('click', () => goToPage(state.totalPages - 1));
}

async function goToPage(page) {
    if (page < 0 || page >= state.totalPages) {
        return;
    }

    state.currentPage = page;
    const skip = page * state.limit;
    await loadImoveis(skip, state.limit);
}

async function loadImoveis(skip = 0, limit = state.limit) {
    const ownerId = state.proprietario?.id;
    if (!ownerId) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
    }

    const params = new URLSearchParams({ skip, limit });
    const data = await request(`/imoveis/proprietario/${ownerId}?${params.toString()}`);

    state.imoveis = data.content;
    state.currentPage = data.pages > 0 ? Math.floor(skip / limit) : 0;
    renderTable();
    renderPagination(data);
}

async function createImovel(data) {
    return request('/imoveis/', {
        method: 'POST',
        body: JSON.stringify({
            ...data,
            id_proprietario: state.proprietario.id,
        }),
    });
}

async function updateImovel(id, data) {
    const params = new URLSearchParams({ id_proprietario: state.proprietario.id });
    return request(`/imoveis/${id}?${params.toString()}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

async function deleteImovel(id) {
    const params = new URLSearchParams({ id_proprietario: state.proprietario.id });
    return request(`/imoveis/${id}?${params.toString()}`, {
        method: 'DELETE',
    });
}

async function handleSubmit(event) {
    event.preventDefault();

    if (state.isSubmitting) {
        return;
    }

    clearFeedback();
    setSubmitting(true);

    try {
        const data = serializeForm();

        if (state.editingId) {
            await updateImovel(state.editingId, data);
            showFeedback('Imóvel atualizado com sucesso.', 'success');
        } else {
            await createImovel(data);
            showFeedback('Imóvel cadastrado com sucesso.', 'success');
        }

        resetFormState();
        await loadImoveis();
    } catch (error) {
        showFeedback(error.message, 'error');
    } finally {
        setSubmitting(false);
    }
}

async function handleTableClick(event) {
    if (state.isSubmitting) {
        return;
    }

    const button = event.target.closest('button[data-action]');
    if (!button) {
        return;
    }

    const { action, id } = button.dataset;
    const imovel = state.imoveis.find((item) => item.id === id);
    if (!imovel) {
        return;
    }

    if (action === 'edit') {
        setEditMode(imovel);
        return;
    }

    if (action === 'delete') {
        const confirmed = await confirmDeletion(`o imóvel "${imovel.apelido_imovel}"`);
        if (!confirmed) {
            return;
        }

        setSubmitting(true);

        try {
            await deleteImovel(id);
            if (state.editingId === id) {
                resetFormState();
            }
            showFeedback('Imóvel excluído com sucesso.', 'success');
            await loadImoveis();
        } catch (error) {
            showFeedback(error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    }
}

function setupEvents() {
    form.addEventListener('submit', handleSubmit);
    tbody.addEventListener('click', handleTableClick);
    btnCancelarEdicao.addEventListener('click', () => {
        if (state.isSubmitting) {
            return;
        }
        resetFormState();
        clearFeedback();
    });
}

async function init() {
    state.proprietario = getLoggedOwner();

    if (!requireOwnerOrRedirect(state.proprietario, (message) => showFeedback(message, 'error'))) {
        return;
    }

    setupEvents();

    try {
        await loadImoveis();
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

init();