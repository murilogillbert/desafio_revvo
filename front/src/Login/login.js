// Script específico da página de login
document.addEventListener('DOMContentLoaded', function () {
    // Aguarda o authManager ser carregado
    function waitForAuthManager() {
        return new Promise((resolve) => {
            if (window.authManager) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.authManager) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    async function initLoginPage() {
        await waitForAuthManager();

        // Verifica se veio de um cadastro bem-sucedido
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('registered') === 'true') {
            const successMessage = document.getElementById('successMessage');
            if (successMessage) {
                successMessage.classList.add('show');

                // Remove o parâmetro da URL sem recarregar
                window.history.replaceState({}, document.title, window.location.pathname);

                // Remove a mensagem após 5 segundos
                setTimeout(() => {
                    successMessage.classList.remove('show');
                }, 5000);
            }
        }

        // Se o usuário já estiver logado, redireciona para a home
        if (window.authManager.isAuthenticated()) {
            const user = window.authManager.getCurrentUser();
            if (user.role === 'admin') {
                window.location.href = 'http://localhost:8000/front/src/Admin/Admin.html';
            } else {
                window.location.href = 'http://localhost:8000/front/src/Home/Home.html';
            }
            return;
        }

        setupLoginForm();
    }

    function setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.getElementById('loginBtn');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');
        const loginError = document.getElementById('loginError');

        if (!loginForm || !emailInput || !passwordInput) {
            console.error('Elementos do formulário não encontrados');
            return;
        }

        // Validação em tempo real
        emailInput.addEventListener('input', function () {
            if (this.value && this.checkValidity()) {
                this.classList.remove('error');
                if (emailError) emailError.classList.remove('show');
            }
        });

        passwordInput.addEventListener('input', function () {
            if (this.value) {
                this.classList.remove('error');
                if (passwordError) passwordError.classList.remove('show');
                if (loginError) loginError.classList.remove('show');
            }
        });

        // Submissão do formulário
        loginForm.addEventListener('submit', async function (e) {
            console.log('Tentando login...');
            console.log('Email:', emailInput.value);
            console.log('Senha:', passwordInput.value ? '[presente]' : '[ausente]');
            e.preventDefault();

            // Reset dos erros
            if (emailError) emailError.classList.remove('show');
            if (passwordError) passwordError.classList.remove('show');
            if (loginError) loginError.classList.remove('show');
            if (emailInput) emailInput.classList.remove('error');
            if (passwordInput) passwordInput.classList.remove('error');

            // Validação básica
            let isValid = true;

            if (!emailInput.value || !emailInput.checkValidity()) {
                emailInput.classList.add('error');
                if (emailError) emailError.classList.add('show');
                isValid = false;
            }

            if (!passwordInput.value) {
                passwordInput.classList.add('error');
                if (passwordError) passwordError.classList.add('show');
                isValid = false;
            }

            if (!isValid) return;

            // Desabilita o botão e mostra loading
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.classList.add('loading');
                loginBtn.textContent = '';
            }

            try {
                // Usa o authManager para fazer login
                const result = await window.authManager.login(
                    emailInput.value,
                    passwordInput.value
                );

                if (result.success) {
                    // Login bem-sucedido - redireciona
                    if (result.user.role === 'admin') {
                        window.location.href = 'http://localhost:8000/front/src/Admin/Admin.html';
                    } else {
                        window.location.href = 'http://localhost:8000/front/src/Home/Home.html';
                    }
                } else {
                    // Mostra erro de login
                    if (loginError) {
                        loginError.textContent = result.error || 'E-mail ou senha incorretos';
                        loginError.classList.add('show');
                    }
                    if (passwordInput) passwordInput.classList.add('error');

                    // Reativa o botão
                    if (loginBtn) {
                        loginBtn.disabled = false;
                        loginBtn.classList.remove('loading');
                        loginBtn.textContent = 'Entrar';
                    }
                }
            } catch (error) {
                console.error('Erro no login:', error);
                if (loginError) {
                    loginError.textContent = 'Erro ao conectar com o servidor. Tente novamente.';
                    loginError.classList.add('show');
                }

                // Reativa o botão
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.classList.remove('loading');
                    loginBtn.textContent = 'Entrar';
                }
            }
        });


        // Foco automático no campo de email
        if (emailInput) {
            emailInput.focus();
        }
    }

    // Inicializa a página de login
    initLoginPage();
});