const { request } = window.AppHttp;
const { getLoggedOwner, setLoggedOwner } = window.AppSession;
const { createFeedbackController, requireOwnerOrRedirect, setTopbarGreeting } = window.AppPage;

const state = {
    owner: null,
    initialValues: null,
    isSubmitting: false,
};

const form = document.getElementById('perfil-form');
const feedback = document.getElementById('feedback');
const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar');
const feedbackController = createFeedbackController(feedback);

const fields = {
    nome: document.getElementById('nome'),
    email: document.getElementById('email'),
    senha: document.getElementById('senha'),
    senhaConfirm: document.getElementById('senhaConfirm'),
};

function showFeedback(message, type = 'info') {
    feedbackController.show(message, type);
}

function clearFeedback() {
    feedbackController.clear();
}

function setSubmitting(isSubmitting) {
    state.isSubmitting = isSubmitting;
    btnSalvar.disabled = isSubmitting;
    btnCancelar.disabled = isSubmitting;
}

function fillForm(owner) {
    fields.nome.value = owner?.nome || '';
    fields.email.value = owner?.email || '';
    fields.senha.value = '';
    fields.senhaConfirm.value = '';
}

function snapshotInitialValues(owner) {
    state.initialValues = {
        nome: owner?.nome || '',
        email: owner?.email || '',
    };
}

function resetFormToInitialValues() {
    fields.nome.value = state.initialValues?.nome || '';
    fields.email.value = state.initialValues?.email || '';
    fields.senha.value = '';
    fields.senhaConfirm.value = '';
}

function getOwnerId(owner) {
    return owner?.id || owner?._id || null;
}

function buildPayload() {
    const nome = fields.nome.value.trim();
    const email = fields.email.value.trim();
    const senha = fields.senha.value;
    const senhaConfirm = fields.senhaConfirm.value;

    if (!nome || !email) {
        throw new Error('Nome e e-mail são obrigatórios.');
    }

    if (senha || senhaConfirm) {
        if (senha.length < 8) {
            throw new Error('A nova senha deve ter no mínimo 8 caracteres.');
        }
        if (senha !== senhaConfirm) {
            throw new Error('A confirmação de senha não confere.');
        }
    }

    const payload = {
        nome,
        email,
    };

    if (senha) {
        payload.senha = senha;
    }

    return payload;
}

async function loadOwnerProfile() {
    state.owner = getLoggedOwner();

    if (!requireOwnerOrRedirect(state.owner, (message) => showFeedback(message, 'error'))) {
        return false;
    }

    const ownerId = getOwnerId(state.owner);
    const owner = await request(`/proprietarios/${ownerId}`);
    const normalizedOwner = {
        ...owner,
        id: getOwnerId(owner),
    };

    state.owner = normalizedOwner;
    fillForm(normalizedOwner);
    snapshotInitialValues(normalizedOwner);
    setLoggedOwner({
        id: normalizedOwner.id,
        nome: normalizedOwner.nome,
        email: normalizedOwner.email,
    });
    setTopbarGreeting(normalizedOwner);

    return true;
}

async function handleSubmit(event) {
    event.preventDefault();

    if (state.isSubmitting) {
        return;
    }

    clearFeedback();
    setSubmitting(true);

    try {
        const payload = buildPayload();
        const ownerId = getOwnerId(state.owner);
        const updatedOwner = await request(`/proprietarios/${ownerId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        const normalizedOwner = {
            ...updatedOwner,
            id: getOwnerId(updatedOwner) || ownerId,
        };

        state.owner = normalizedOwner;
        fillForm(normalizedOwner);
        snapshotInitialValues(normalizedOwner);
        setLoggedOwner({
            id: normalizedOwner.id,
            nome: normalizedOwner.nome,
            email: normalizedOwner.email,
        });
        setTopbarGreeting(normalizedOwner);
        showFeedback('Perfil atualizado com sucesso.', 'success');
    } catch (error) {
        showFeedback(error.message, 'error');
    } finally {
        setSubmitting(false);
    }
}

function handleCancel() {
    if (state.isSubmitting) {
        return;
    }

    resetFormToInitialValues();
    clearFeedback();
}

function setupEvents() {
    form.addEventListener('submit', handleSubmit);
    btnCancelar.addEventListener('click', handleCancel);
}

async function init() {
    setupEvents();

    try {
        const loaded = await loadOwnerProfile();
        if (!loaded) {
            return;
        }
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

init();