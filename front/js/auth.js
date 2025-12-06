/**
 * Sistema de Autenticação para Plataforma de Cursos
 * Gerencia login, logout e verificação de sessão
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.API_BASE_URL = 'http://localhost:8000/back/api';
        this.init();
    }

    /**
     * Inicializa o gerenciador de autenticação
     */
    async init() {
        // Tenta recuperar a sessão do usuário
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                // Verifica se o token/sessão ainda é válido
                await this.validateSession();
            } catch (error) {
                console.log('Sessão inválida, fazendo logout...');
                this.logout();
            }
        }
        
        // Atualiza o header conforme o estado do usuário
        this.updateHeader();
    }

    /**
     * Valida a sessão atual com o servidor
     */
    async validateSession() {
        if (!this.currentUser || !this.currentUser.email) {
            return false;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/auth.php?action=validate`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token || ''}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Sessão inválida');
            }

            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    /**
     * Realiza o login do usuário
     * @param {string} email - Email do usuário
     * @param {string} senha - Senha do usuário
     */
    async login(email, senha) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    senha: senha
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Salva o usuário na sessão
            this.currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // Atualiza o header
            this.updateHeader();
            
            return { success: true, user: this.currentUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Realiza o logout do usuário
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateHeader();
        window.location.href = 'http://localhost:8000/front/src/Home/Home.html';
    }

    /**
     * Verifica se o usuário está autenticado
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Verifica se o usuário é admin
     */
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    /**
     * Verifica se o usuário é aluno
     */
    isStudent() {
        return this.currentUser && this.currentUser.role === 'aluno';
    }

    /**
     * Obtém o usuário atual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Atualiza o header conforme o estado do usuário
     */
    updateHeader() {
        const headerContainer = document.querySelector('.header-container');
        if (!headerContainer) return;

        // Remove elementos antigos de autenticação
        const oldAuthElements = document.querySelectorAll('.auth-actions, .user-menu, .admin-link');
        oldAuthElements.forEach(el => el.remove());

        // Adiciona elementos conforme o estado
        if (this.isAuthenticated()) {
            this.addAuthenticatedElements(headerContainer);
        } else {
            this.addGuestElements(headerContainer);
        }
    }

    /**
     * Adiciona elementos para usuários autenticados
     */
    addAuthenticatedElements(container) {
        // Cria container de ações do usuário
        const userActions = document.createElement('div');
        userActions.className = 'auth-actions';
        userActions.style.display = 'flex';
        userActions.style.alignItems = 'center';
        userActions.style.gap = '15px';

        // Adiciona link para admin se for administrador
        if (this.isAdmin()) {
            const adminLink = document.createElement('a');
            adminLink.href = 'http://localhost:8000/front/src/Admin/Admin.html';
            adminLink.className = 'admin-link';
            adminLink.textContent = 'Painel Admin';
            adminLink.style.padding = '8px 15px';
            adminLink.style.backgroundColor = '#007bff';
            adminLink.style.color = 'white';
            adminLink.style.borderRadius = '4px';
            adminLink.style.textDecoration = 'none';
            adminLink.style.fontWeight = '500';
            adminLink.style.transition = 'background-color 0.3s';
            adminLink.onmouseover = () => adminLink.style.backgroundColor = '#0056b3';
            adminLink.onmouseout = () => adminLink.style.backgroundColor = '#007bff';
            userActions.appendChild(adminLink);
        }

        // Cria menu de usuário
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.style.position = 'relative';
        userMenu.style.cursor = 'pointer';

        // Ícone do perfil com nome
        userMenu.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; padding: 5px 10px; border-radius: 20px; background-color: rgba(0,0,0,0.05);">
                <div class="profile-icon" style="width: 35px; height: 35px; border-radius: 50%; background-color: #007bff; display: flex; align-items: center; justify-content: center; color: white;">
                    ${this.currentUser.nome.charAt(0).toUpperCase()}
                </div>
                <span style="font-weight: 500; color: #333;">${this.currentUser.nome}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
            <div class="dropdown-menu" style="display: none; position: absolute; top: 100%; right: 0; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 180px; z-index: 1000; margin-top: 5px;">
                <div style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 500; color: #666;">
                    ${this.currentUser.email}
                </div>
                <a href="http://localhost:8000/front/src/Profile/Profile.html" style="display: block; padding: 10px 16px; text-decoration: none; color: #333; transition: background-color 0.2s;">Meu Perfil</a>
                <a href="http://localhost:8000/front/src/Courses/Courses.html" style="display: block; padding: 10px 16px; text-decoration: none; color: #333; transition: background-color 0.2s;">Meus Cursos</a>
                <div class="dropdown-divider" style="height: 1px; background-color: #eee;"></div>
                <button class="logout-btn" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; color: #dc3545; cursor: pointer; transition: background-color 0.2s;">Sair</button>
            </div>
        `;

        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = userMenu.querySelector('.dropdown-menu');
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        // Fecha dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                const dropdowns = document.querySelectorAll('.dropdown-menu');
                dropdowns.forEach(dropdown => {
                    dropdown.style.display = 'none';
                });
            }
        });

        // Adiciona evento de logout
        userMenu.querySelector('.logout-btn').addEventListener('click', () => {
            this.logout();
        });

        userActions.appendChild(userMenu);
        
        // Insere após a caixa de busca
        const searchBox = container.querySelector('.search-box');
        if (searchBox) {
            searchBox.parentNode.insertBefore(userActions, searchBox.nextSibling);
        } else {
            // Se não houver caixa de busca, insere antes do perfil
            const profile = container.querySelector('.profile');
            container.insertBefore(userActions, profile);
        }

        // Remove o perfil padrão se existir
        const defaultProfile = container.querySelector('.profile');
        if (defaultProfile) {
            defaultProfile.style.display = 'none';
        }
    }

    /**
     * Adiciona elementos para visitantes
     */
    addGuestElements(container) {
        const guestActions = document.createElement('div');
        guestActions.className = 'auth-actions';
        guestActions.style.display = 'flex';
        guestActions.style.alignItems = 'center';
        guestActions.style.gap = '10px';

        guestActions.innerHTML = `
            <a href="http://localhost:8000/front/src/Login/Login.html" style="padding: 8px 20px; background-color: #f8f9fa; color: #333; border-radius: 4px; text-decoration: none; font-weight: 500; transition: all 0.3s; border: 1px solid #ddd;">
                Entrar
            </a>
            <a href="http://localhost:8000/front/src/Register/Register.html" style="padding: 8px 20px; background-color: #007bff; color: white; border-radius: 4px; text-decoration: none; font-weight: 500; transition: background-color 0.3s;">
                Cadastrar
            </a>
        `;

        // Adiciona efeitos hover
        const loginBtn = guestActions.querySelector('a[href*="Login"]');
        const registerBtn = guestActions.querySelector('a[href*="Register"]');
        
        loginBtn.onmouseover = () => loginBtn.style.backgroundColor = '#e9ecef';
        loginBtn.onmouseout = () => loginBtn.style.backgroundColor = '#f8f9fa';
        
        registerBtn.onmouseover = () => registerBtn.style.backgroundColor = '#0056b3';
        registerBtn.onmouseout = () => registerBtn.style.backgroundColor = '#007bff';

        // Insere após a caixa de busca
        const searchBox = container.querySelector('.search-box');
        if (searchBox) {
            searchBox.parentNode.insertBefore(guestActions, searchBox.nextSibling);
        } else {
            // Se não houver caixa de busca, insere antes do perfil
            const profile = container.querySelector('.profile');
            container.insertBefore(guestActions, profile);
        }

        // Mostra o perfil padrão
        const defaultProfile = container.querySelector('.profile');
        if (defaultProfile) {
            defaultProfile.style.display = 'block';
        }
    }
}

// Inicializa o gerenciador de autenticação
window.authManager = new AuthManager();