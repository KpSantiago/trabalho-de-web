const { request } = window.AppHttp;
const { setLoggedOwner } = window.AppSession;

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');

    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePasswordBtn.textContent = type === 'password' ? 'ver' : 'ocultar';
        });
    }

    const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    if (toggleConfirmPasswordBtn && confirmPasswordInput) {
        toggleConfirmPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            toggleConfirmPasswordBtn.textContent = type === 'password' ? 'ver' : 'ocultar';
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('password').value;
            const confirmSenha = document.getElementById('confirm-password').value;

            const errorDiv = document.getElementById('signup-error');

            errorDiv.style.display = 'none';

            if (senha !== confirmSenha) {
                errorDiv.textContent = 'As senhas não coincidem!';
                errorDiv.style.display = 'block';
                return;
            }

            try {
                await request('/proprietarios/', {
                    method: 'POST',
                    body: JSON.stringify({ nome, email, senha }),
                });

                const loggedOwner = await request('/proprietarios/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, senha }),
                });

                setLoggedOwner(loggedOwner);
                window.location.href = '../dashboard/index.html';
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
            }
        });
    }
});