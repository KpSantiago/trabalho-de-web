const { request } = window.AppHttp;
const { setLoggedOwner } = window.AppSession;

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
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

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const senha = document.getElementById('password').value;
            const errorDiv = document.getElementById('login-error');

            errorDiv.style.display = 'none';

            try {
                const data = await request('/proprietarios/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, senha }),
                });

                setLoggedOwner(data);
                window.location.href = 'pages/dashboard/index.html';
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
            }
        });
    }
});