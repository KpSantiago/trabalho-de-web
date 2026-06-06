let confirmDialogElement = null;
let confirmDialogTextElement = null;
let confirmDialogResolve = null;

function ensureConfirmDialog() {
    if (confirmDialogElement) {
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'confirm-dialog-overlay';
    wrapper.innerHTML = `
        <div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
            <h3 id="confirm-dialog-title" class="confirm-dialog-title">Confirmar exclusão</h3>
            <p class="confirm-dialog-text"></p>
            <div class="confirm-dialog-actions">
                <button type="button" class="btn btn-secondary" data-confirm-action="cancel">Cancelar</button>
                <button type="button" class="btn btn-danger" data-confirm-action="confirm">Excluir</button>
            </div>
        </div>
    `;

    confirmDialogElement = wrapper;
    confirmDialogTextElement = wrapper.querySelector('.confirm-dialog-text');

    wrapper.addEventListener('click', (event) => {
        if (event.target === wrapper) {
            closeConfirmDialog(false);
        }
    });

    wrapper.querySelector('[data-confirm-action="cancel"]').addEventListener('click', () => {
        closeConfirmDialog(false);
    });

    wrapper.querySelector('[data-confirm-action="confirm"]').addEventListener('click', () => {
        closeConfirmDialog(true);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && confirmDialogElement?.classList.contains('show')) {
            closeConfirmDialog(false);
        }
    });

    document.body.appendChild(wrapper);
}

function closeConfirmDialog(confirmed) {
    if (!confirmDialogElement) {
        return;
    }

    confirmDialogElement.classList.remove('show');
    document.body.classList.remove('dialog-open');

    if (confirmDialogResolve) {
        confirmDialogResolve(confirmed);
        confirmDialogResolve = null;
    }
}

window.AppPage = {
    createFeedbackController(element) {
        return {
            show(message, type = 'info') {
                element.className = `feedback ${type}`;
                element.textContent = message;
            },
            clear() {
                element.className = 'feedback';
                element.textContent = '';
            },
        };
    },
    confirmDeletion(label) {
        ensureConfirmDialog();
        confirmDialogTextElement.textContent = `Deseja excluir ${label}?`;
        confirmDialogElement.classList.add('show');
        document.body.classList.add('dialog-open');

        return new Promise((resolve) => {
            confirmDialogResolve = resolve;
        });
    },
    setTopbarGreeting(owner) {
        const greetingElement = document.querySelector('.user-info span');
        if (!greetingElement) {
            return;
        }

        const nome = owner?.nome?.trim();
        greetingElement.textContent = nome ? `Olá, ${nome}` : 'Olá, Administrador';
    },
    initTopbarGreeting() {
        const owner = window.AppSession?.getLoggedOwner?.();
        this.setTopbarGreeting(owner);
        return owner;
    },
    requireOwnerOrRedirect(owner, onError) {
        if (owner?.id) {
            return true;
        }

        onError('Sessão expirada. Faça login novamente.');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 1200);
        return false;
    },
};

document.addEventListener('DOMContentLoaded', () => {
    window.AppPage.initTopbarGreeting();
});
