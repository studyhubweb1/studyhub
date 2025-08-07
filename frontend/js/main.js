// Configuração global da API
const API_BASE_URL = 'http://localhost:3000/api';

// Utilitários globais
class Utils {
    static showModal(modalId, show = true) {
        const modal = document.getElementById(modalId);
        if (modal) {
            if (show) {
                modal.classList.add('show');
                modal.style.display = 'flex';
            } else {
                modal.classList.remove('show');
                modal.style.display = 'none';
            }
        }
    }

    static showMessage(message, type = 'info') {
        const modal = document.getElementById('modal') || document.getElementById('feedbackModal');
        const messageDiv = document.getElementById('modalMessage');
        
        if (modal && messageDiv) {
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };

            const colors = {
                success: '#059669',
                error: '#dc2626',
                warning: '#d97706',
                info: '#2563eb'
            };

            messageDiv.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 3rem; margin-bottom: 16px;">${icons[type] || icons.info}</div>
                    <p style="font-size: 1.1rem; color: ${colors[type] || colors.info}; margin: 0;">${message}</p>
                </div>
            `;

            this.showModal(modal.id, true);

            // Auto-fechar após 3 segundos para mensagens de sucesso
            if (type === 'success') {
                setTimeout(() => {
                    this.showModal(modal.id, false);
                }, 3000);
            }
        }
    }

    static formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    static formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    }

    static getTimeUntil(dateString) {
        const now = new Date();
        const target = new Date(dateString);
        const diffTime = target - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return 'Vencido';
        } else if (diffDays === 0) {
            return 'Hoje';
        } else if (diffDays === 1) {
            return 'Amanhã';
        } else if (diffDays <= 7) {
            return `${diffDays} dias`;
        } else {
            return this.formatDate(dateString);
        }
    }
}

// Gerenciador de autenticação
class AuthManager {
    static TOKEN_KEY = 'studyhub_token'; // Renomeado
    static USER_KEY = 'studyhub_user';   // Renomeado

    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    static getUser() {
        const userJson = localStorage.getItem(this.USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    }

    static setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    static logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        window.location.href = 'index.html';
    }

    static async verifyAuth() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const response = await ApiClient.get('/auth/verify');
            return response.success;
        } catch (error) {
            console.error('Auth verification failed:', error);
            return false;
        }
    }
}

// Cliente API
class ApiClient {
    static async request(endpoint, options = {}) {
        const token = AuthManager.getToken();
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            if (error.message.includes('Token') || error.message.includes('Unauthorized')) {
                AuthManager.logout();
            }
            throw error;
        }
    }

    static get(endpoint) {
        return this.request(endpoint);
    }

    static post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    static put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    static delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Inicialização global
document.addEventListener('DOMContentLoaded', async () => {
    const token = AuthManager.getToken();
    const isAuthPage = window.location.pathname.includes('index.html') || 
                      window.location.pathname === '/';

    if (token && !isAuthPage) {
        try {
            const isValid = await AuthManager.verifyAuth();
            if (!isValid) {
                AuthManager.logout();
            }
        } catch (error) {
            console.error('Verification error:', error);
            AuthManager.logout();
        }
    } else if (!token && !isAuthPage) {
        window.location.href = 'index.html';
    }
});

function setupMobileNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });

        // Fechar menu ao clicar em um link
        navMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                navMenu.classList.remove('show');
            }
        });
    }
}

function setupModalClosing() {
    // Fechar modais ao clicar no X ou fora do modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                Utils.showModal(modal.id, false);
            }
        }

        if (e.target.classList.contains('modal')) {
            Utils.showModal(e.target.id, false);
        }
    });

    // Fechar modais com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal.show');
            openModals.forEach(modal => {
                Utils.showModal(modal.id, false);
            });
        }
    });
}

function updateUserInfo() {
    const user = AuthManager.getUser();
    const userNameElements = document.querySelectorAll('#userName');
    if (user && userNameElements.length > 0) {
        userNameElements.forEach(element => {
            element.textContent = user.nome;
        });
    }
}

function setupLogout() {
    const logoutBtns = document.querySelectorAll('#logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Tem certeza que deseja sair?')) {
                AuthManager.logout();
            }
        });
    });
}

function setupEditAccount() {
    const editAccountBtn = document.getElementById('editAccountBtn');
    if (editAccountBtn) {
        editAccountBtn.addEventListener('click', () => {
            const user = AuthManager.getUser();
            if (user) {
                const newName = prompt('Digite seu novo nome:', user.nome);
                if (newName && newName.trim() !== '') {
                    user.nome = newName.trim();
                    AuthManager.setUser(user);
                    updateUserInfo();
                    Utils.showMessage('Conta atualizada com sucesso!', 'success');
                }
            }
        });
    }
}

// Funções específicas para página de login
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', () => {
        setupLoginPage();
        setupRegisterForm();
    });
}

function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('registerNome').value;
            const email = document.getElementById('registerEmail').value;
            const senha = document.getElementById('registerSenha').value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Cadastrando...';
                const response = await ApiClient.post('/auth/register', { nome, email, senha });
                if (response.success) {
                    AuthManager.setToken(response.token);
                    AuthManager.setUser(response.user);
                    Utils.showMessage('Cadastro realizado com sucesso!', 'success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }
            } catch (error) {
                Utils.showMessage(error.message || 'Erro ao criar conta', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Cadastrar';
            }
        });
    }
}

// Funções específicas para página de login
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', () => {
        setupLoginPage();
    });
}

function setupLoginPage() {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Tabs
    loginTab?.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });

    registerTab?.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    // Forms
    loginForm?.addEventListener('submit', handleLogin);
    registerForm?.addEventListener('submit', handleRegister);

    // Verificar se já está logado
    if (AuthManager.getToken()) {
        window.location.href = 'dashboard.html';
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Entrando...';

        const response = await ApiClient.post('/auth/login', {
            email,
            senha
        });

        if (response.success) {
            AuthManager.setToken(response.token);
            AuthManager.setUser(response.user);
            Utils.showMessage('Login realizado com sucesso!', 'success');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        }

    } catch (error) {
        Utils.showMessage(error.message || 'Erro no login', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const nome = document.getElementById('registerNome').value;
    const email = document.getElementById('registerEmail').value;
    const senha = document.getElementById('registerSenha').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Cadastrando...';

        const response = await ApiClient.post('/auth/register', {
            nome,
            email,
            senha
        });

        if (response.success) {
            AuthManager.setToken(response.token);
            AuthManager.setUser(response.user);
            Utils.showMessage('Cadastro realizado com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }

    } catch (error) {
        Utils.showMessage(error.message || 'Erro no cadastro', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cadastrar';
    }
}