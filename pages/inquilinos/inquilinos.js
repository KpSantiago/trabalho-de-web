const { request } = window.AppHttp;
const { getLoggedOwner } = window.AppSession;
const { formatCurrency, escapeHtml } = window.AppUtils;
const { createFeedbackController, requireOwnerOrRedirect, confirmDeletion } = window.AppPage;

const state = {
    inquilinos: [],
    editingId: null,
    proprietario: null,
    isSubmitting: false,
    currentPage: 0,
    limit: 10,
    totalPages: 0,
    totalItems: 0,
};

const form = document.getElementById('inquilino-form');
const tbody = document.getElementById('inquilinos-tbody');
const feedback = document.getElementById('feedback');
const formTitle = document.getElementById('form-title');
const btnSalvar = document.getElementById('btn-salvar');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
const feedbackController = createFeedbackController(feedback);

const fields = {
    nome: document.getElementById('nome'),
    cpf: document.getElementById('cpf'),
    telefone: document.getElementById('telefone'),
    email: document.getElementById('email'),
    renda_mensal: document.getElementById('renda'),
};

function showFeedback(message, type = 'info') {
    feedbackController.show(message, type);
}

function clearFeedback() {
    feedbackController.clear();
}

function onlyDigits(value) {
    return value.replace(/\D/g, '');
}

function formatCpf(value) {
    const digits = onlyDigits(value).slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhone(value) {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 10) {
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    }

    return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function serializeForm() {
    return {
        nome: fields.nome.value.trim(),
        cpf: onlyDigits(fields.cpf.value),
        telefone: onlyDigits(fields.telefone.value),
        email: fields.email.value.trim(),
        renda_mensal: Number(fields.renda_mensal.value),
    };
}

function fillForm(inquilino) {
    fields.nome.value = inquilino.nome || '';
    fields.cpf.value = formatCpf(inquilino.cpf || '');
    fields.telefone.value = formatPhone(inquilino.telefone || '');
    fields.email.value = inquilino.email || '';
    fields.renda_mensal.value = inquilino.renda_mensal ?? '';
}

function setSubmitting(isSubmitting) {
    state.isSubmitting = isSubmitting;
    btnSalvar.disabled = isSubmitting;
    btnCancelarEdicao.disabled = isSubmitting;
}

function resetFormState() {
    form.reset();
    state.editingId = null;
    formTitle.textContent = 'Cadastrar Inquilino';
    btnSalvar.textContent = 'Salvar';
}

function setEditMode(inquilino) {
    state.editingId = inquilino.id;
    fillForm(inquilino);
    formTitle.textContent = 'Editar Inquilino';
    btnSalvar.textContent = 'Atualizar';
    showFeedback(`Editando: ${inquilino.nome}`, 'info');
}

function renderTable() {
    if (!state.inquilinos.length) {
        tbody.innerHTML = '<tr><td colspan="6">Nenhum inquilino cadastrado.</td></tr>';
        return;
    }

    tbody.innerHTML = state.inquilinos.map((inquilino) => `
        <tr>
            <td>${escapeHtml(inquilino.nome)}</td>
            <td>${escapeHtml(inquilino.cpf)}</td>
            <td>${escapeHtml(inquilino.email)}</td>
            <td>${escapeHtml(inquilino.telefone)}</td>
            <td>${formatCurrency(inquilino.renda_mensal)}</td>
            <td>
                <button class="btn btn-small btn-edit" data-action="edit" data-id="${inquilino.id}">Editar</button>
                <button class="btn btn-small btn-danger" data-action="delete" data-id="${inquilino.id}">Excluir</button>
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
        loadInquilinos(0, state.limit).catch((error) => {
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
    await loadInquilinos(skip, state.limit);
}

async function loadInquilinos(skip = 0, limit = state.limit) {
    const ownerId = state.proprietario?.id;
    if (!ownerId) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
    }

    const params = new URLSearchParams({ skip, limit });
    const data = await request(`/inquilinos/proprietario/${ownerId}?${params.toString()}`);

    state.inquilinos = data.content;
    state.currentPage = data.pages > 0 ? Math.floor(skip / limit) : 0;
    renderTable();
    renderPagination(data);
}

async function createInquilino(data) {
    return request('/inquilinos/', {
        method: 'POST',
        body: JSON.stringify({
            ...data,
            id_proprietario: state.proprietario.id,
        }),
    });
}

async function updateInquilino(id, data) {
    const params = new URLSearchParams({ id_proprietario: state.proprietario.id });
    return request(`/inquilinos/${id}?${params.toString()}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

async function deleteInquilino(id) {
    const params = new URLSearchParams({ id_proprietario: state.proprietario.id });
    return request(`/inquilinos/${id}?${params.toString()}`, {
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
            await updateInquilino(state.editingId, data);
            showFeedback('Inquilino atualizado com sucesso.', 'success');
        } else {
            await createInquilino(data);
            showFeedback('Inquilino cadastrado com sucesso.', 'success');
        }

        resetFormState();
        await loadInquilinos();
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
    const inquilino = state.inquilinos.find((item) => item.id === id);
    if (!inquilino) {
        return;
    }

    if (action === 'edit') {
        setEditMode(inquilino);
        return;
    }

    if (action === 'delete') {
        const confirmed = await confirmDeletion(`o inquilino "${inquilino.nome}"`);
        if (!confirmed) {
            return;
        }

        setSubmitting(true);

        try {
            await deleteInquilino(id);
            if (state.editingId === id) {
                resetFormState();
            }
            showFeedback('Inquilino excluído com sucesso.', 'success');
            await loadInquilinos();
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
    fields.cpf.addEventListener('input', () => {
        fields.cpf.value = formatCpf(fields.cpf.value);
    });
    fields.telefone.addEventListener('input', () => {
        fields.telefone.value = formatPhone(fields.telefone.value);
    });
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
        await loadInquilinos();
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

init();