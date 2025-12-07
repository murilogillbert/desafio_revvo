// Script específico da página de registro
document.addEventListener('DOMContentLoaded', function() {
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

    async function initRegisterPage() {
        await waitForAuthManager();
        
        // Se o usuário já estiver logado, redireciona para a home
        if (window.authManager.isAuthenticated()) {
            window.location.href = 'http://localhost:8000/front/src/Home/Home.html';
            return;
        }
        
        setupRegisterForm();
    }
    
    function setupRegisterForm() {
        const registerForm = document.getElementById('registerForm');
        const nomeInput = document.getElementById('nome');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const termsInput = document.getElementById('terms');
        const registerBtn = document.getElementById('registerBtn');
        const successMessage = document.getElementById('successMessage');
        const registerError = document.getElementById('registerError');
        
        if (!registerForm) {
            console.error('Formulário de registro não encontrado');
            return;
        }
        
        // Validação em tempo real
        function setupValidation() {
            // Validação do nome
            if (nomeInput) {
                nomeInput.addEventListener('input', function() {
                    if (this.value.trim().length >= 2) {
                        this.classList.remove('error');
                        hideError('nomeError');
                    }
                });
            }
            
            // Validação do email
            if (emailInput) {
                emailInput.addEventListener('input', function() {
                    if (this.value && this.checkValidity()) {
                        this.classList.remove('error');
                        hideError('emailError');
                        hideError('emailExistsError');
                    }
                });
            }
            
            // Validação da senha
            if (passwordInput) {
                passwordInput.addEventListener('input', function() {
                    if (this.value.length >= 6) {
                        this.classList.remove('error');
                        hideError('passwordError');
                    }
                    validatePasswordMatch();
                });
            }
            
            // Validação da confirmação de senha
            if (confirmPasswordInput) {
                confirmPasswordInput.addEventListener('input', function() {
                    validatePasswordMatch();
                });
            }
            
            // Validação dos termos
            if (termsInput) {
                termsInput.addEventListener('change', function() {
                    if (this.checked) {
                        hideError('termsError');
                    }
                });
            }
        }
        
        // Valida se as senhas coincidem
        function validatePasswordMatch() {
            if (!passwordInput || !confirmPasswordInput) return;
            
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const errorElement = document.getElementById('confirmPasswordError');
            
            if (password && confirmPassword && password !== confirmPassword) {
                confirmPasswordInput.classList.add('error');
                if (errorElement) {
                    errorElement.textContent = 'As senhas não coincidem';
                    errorElement.classList.add('show');
                }
                return false;
            } else if (confirmPassword) {
                confirmPasswordInput.classList.remove('error');
                if (errorElement) errorElement.classList.remove('show');
                return true;
            }
        }
        
        // Oculta mensagem de erro
        function hideError(errorId) {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.classList.remove('show');
            }
        }
        
        // Mostra mensagem de erro
        function showError(errorId, message) {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.add('show');
            }
        }
        
        // Validação do formulário
        function validateForm() {
            let isValid = true;
            
            // Nome
            if (!nomeInput || !nomeInput.value.trim()) {
                nomeInput.classList.add('error');
                showError('nomeError', 'O nome é obrigatório');
                isValid = false;
            } else if (nomeInput.value.trim().length < 2) {
                nomeInput.classList.add('error');
                showError('nomeError', 'O nome deve ter pelo menos 2 caracteres');
                isValid = false;
            }
            
            // Email
            if (!emailInput || !emailInput.value || !emailInput.checkValidity()) {
                emailInput.classList.add('error');
                showError('emailError', 'Por favor, insira um e-mail válido');
                isValid = false;
            }
            
            // Senha
            if (!passwordInput || !passwordInput.value) {
                passwordInput.classList.add('error');
                showError('passwordError', 'A senha é obrigatória');
                isValid = false;
            } else if (passwordInput.value.length < 6) {
                passwordInput.classList.add('error');
                showError('passwordError', 'A senha deve ter no mínimo 6 caracteres');
                isValid = false;
            }
            
            // Confirmação de senha
            if (!validatePasswordMatch()) {
                isValid = false;
            }
            
            // Termos
            if (!termsInput || !termsInput.checked) {
                showError('termsError', 'Você deve aceitar os termos');
                isValid = false;
            }
            
            return isValid;
        }
        
        // Submissão do formulário
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Limpa mensagens anteriores
            if (registerError) {
                registerError.classList.remove('show');
                registerError.textContent = '';
            }
            
            if (successMessage) {
                successMessage.classList.remove('show');
                successMessage.textContent = '';
            }
            
            // Valida o formulário
            if (!validateForm()) {
                return;
            }
            
            // Prepara os dados - role padrão 'aluno'
            const userData = {
                nome: nomeInput.value.trim(),
                email: emailInput.value,
                senha: passwordInput.value,
                role: 'aluno' // Valor padrão fixo
            };
            
            // Desabilita o botão e mostra loading
            if (registerBtn) {
                registerBtn.disabled = true;
                registerBtn.classList.add('loading');
                registerBtn.textContent = '';
            }
            
            try {
                // Envia para a API via authManager
                const result = await registerUser(userData);
                
                if (result.success) {
                    // Sucesso - mostra mensagem e redireciona
                    if (successMessage) {
                        successMessage.textContent = 'Cadastro realizado com sucesso! Redirecionando para login...';
                        successMessage.classList.add('show');
                    }
                    
                    // Redireciona para login após 2 segundos
                    setTimeout(() => {
                        window.location.href = 'http://localhost:8000/front/src/Login/Login.html?registered=true';
                    }, 2000);
                } else {
                    // Erro
                    if (registerError) {
                        registerError.textContent = result.error || 'Erro ao criar conta';
                        registerError.classList.add('show');
                    }
                    
                    // Trata erros específicos
                    if (result.error && result.error.includes('já cadastrado')) {
                        emailInput.classList.add('error');
                        showError('emailExistsError', 'Este e-mail já está cadastrado');
                    }
                    
                    // Reativa o botão
                    if (registerBtn) {
                        registerBtn.disabled = false;
                        registerBtn.classList.remove('loading');
                        registerBtn.textContent = 'Criar Conta';
                    }
                }
            } catch (error) {
                console.error('Erro no cadastro:', error);
                
                if (registerError) {
                    registerError.textContent = 'Erro ao conectar com o servidor. Tente novamente.';
                    registerError.classList.add('show');
                }
                
                // Reativa o botão
                if (registerBtn) {
                    registerBtn.disabled = false;
                    registerBtn.classList.remove('loading');
                    registerBtn.textContent = 'Criar Conta';
                }
            }
        });
        
        // Configura a validação
        setupValidation();
        
        // Foco automático no primeiro campo
        if (nomeInput) {
            nomeInput.focus();
        }
    }
    
    // Função para registrar usuário
    async function registerUser(userData) {
        try {
            // Usa o mesmo endpoint que o login, mas com ação 'register'
            const response = await fetch(`${window.authManager.API_BASE_URL}/auth.php?action=register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (data.error) {
                return { success: false, error: data.error };
            }
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Erro na requisição de registro:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }
    
    // Inicializa a página de registro
    initRegisterPage();
});