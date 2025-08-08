class StudyHub {
  constructor() {
    this.API_URL = window.location.origin + '/api';
    this.currentUser = null;
    this.token = null;
    this.currentMode = 'login';
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAuth();
  }

  bindEvents() {
    // Auth form
    document.getElementById('auth-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.currentMode === 'login') {
        this.login();
      } else {
        this.register();
      }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.logout();
    });

    // Modal
    document.getElementById('add-area-btn').addEventListener('click', () => {
      this.openModal();
    });

    document.getElementById('close-modal').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('cancel-area').addEventListener('click', () => {
      this.closeModal();
    });

    // Area form
    document.getElementById('area-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.createArea();
    });
  }

  checkAuth() {
    const savedToken = localStorage.getItem('studyhub_token');
    const savedUser = localStorage.getItem('studyhub_user');
    
    if (savedToken && savedUser) {
      this.token = savedToken;
      this.currentUser = JSON.parse(savedUser);
      this.showMainScreen();
    } else {
      this.showLoginScreen();
    }
  }

  switchTab(mode) {
    this.currentMode = mode;
    
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`${mode}-tab`).classList.add('active');
    
    const authBtn = document.getElementById('auth-btn');
    authBtn.textContent = mode === 'login' ? 'Entrar' : 'Registrar';
    
    this.clearMessage();
  }

  async register() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
      this.showMessage('Preencha todos os campos', 'error');
      return;
    }

    try {
      const response = await fetch(`${this.API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        this.showMessage('Usuário registrado com sucesso! Faça login.', 'success');
        this.switchTab('login');
        document.getElementById('auth-form').reset();
      } else {
        this.showMessage(data.error, 'error');
      }
    } catch (error) {
      this.showMessage('Erro de conexão. Tente novamente.', 'error');
    }
  }

  async login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
      this.showMessage('Preencha todos os campos', 'error');
      return;
    }

    try {
      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        this.token = data.token;
        this.currentUser = data.user;
        
        localStorage.setItem('studyhub_token', this.token);
        localStorage.setItem('studyhub_user', JSON.stringify(this.currentUser));
        
        this.showMainScreen();
      } else {
        this.showMessage(data.error, 'error');
      }
    } catch (error) {
      this.showMessage('Erro de conexão. Tente novamente.', 'error');
    }
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('studyhub_token');
    localStorage.removeItem('studyhub_user');
    this.showLoginScreen();
  }

  showLoginScreen() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('auth-form').reset();
    this.clearMessage();
  }

  showMainScreen() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    
    document.getElementById('welcome-user').textContent = `Olá, ${this.currentUser.username}!`;
    
    this.loadAreas();
  }

  async loadAreas() {
    const areasGrid = document.getElementById('areas-grid');
    areasGrid.innerHTML = '<div class="loading">Carregando áreas...</div>';

    try {
      const response = await fetch(`${this.API_URL}/areas?user_id=${this.currentUser.id}`, {
        headers: { Authorization: this.token }
      });

      const data = await response.json();

      if (data.success) {
        this.displayAreas(data.areas);
        this.updateStats(data.areas.length);
      } else {
        areasGrid.innerHTML = '<div class="empty-state"><h3>Erro ao carregar áreas</h3></div>';
      }
    } catch (error) {
      areasGrid.innerHTML = '<div class="empty-state"><h3>Erro de conexão</h3></div>';
    }
  }

  displayAreas(areas) {
    const areasGrid = document.getElementById('areas-grid');
    
    if (areas.length === 0) {
      areasGrid.innerHTML = `
        <div class="empty-state">
          <h3>Nenhuma área criada</h3>
          <p>Crie sua primeira área de estudo para começar!</p>
        </div>
      `;
      return;
    }

    areasGrid.innerHTML = areas.map(area => `
      <div class="area-card" style="border-left-color: ${area.cor}">
        <div class="area-actions">
          <button class="delete-area" onclick="app.deleteArea(${area.id})" title="Excluir área">
            ×
          </button>
        </div>
        <h3>${area.nome}</h3>
        <p>${area.descricao || 'Sem descrição'}</p>
      </div>
    `).join('');
  }

  updateStats(totalAreas) {
    document.getElementById('total-areas').textContent = totalAreas;
  }

  openModal() {
    document.getElementById('area-modal').classList.remove('hidden');
    document.getElementById('area-name').focus();
  }

  closeModal() {
    document.getElementById('area-modal').classList.add('hidden');
    document.getElementById('area-form').reset();
  }

  async createArea() {
    const nome = document.getElementById('area-name').value.trim();
    const descricao = document.getElementById('area-desc').value.trim();
    const cor = document.getElementById('area-color').value;

    if (!nome) {
      alert('Nome da área é obrigatório');
      return;
    }

    try {
      const response = await fetch(`${this.API_URL}/areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.token
        },
        body: JSON.stringify({
          nome,
          descricao,
          cor,
          user_id: this.currentUser.id
        })
      });

      const data = await response.json();

      if (data.success) {
        this.closeModal();
        this.loadAreas();
      } else {
        alert('Erro ao criar área: ' + data.error);
      }
    } catch (error) {
      alert('Erro de conexão. Tente novamente.');
    }
  }

  async deleteArea(areaId) {
    if (!confirm('Tem certeza que deseja excluir esta área?')) return;

    try {
      const response = await fetch(`${this.API_URL}/areas/${areaId}`, {
        method: 'DELETE',
        headers: { Authorization: this.token }
      });

      const data = await response.json();

      if (data.success) {
        this.loadAreas();
      } else {
        alert('Erro ao excluir área: ' + data.error);
      }
    } catch (error) {
      alert('Erro de conexão. Tente novamente.');
    }
  }

  showMessage(text, type) {
    const messageEl = document.getElementById('auth-message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
  }

  clearMessage() {
    document.getElementById('auth-message').textContent = '';
    document.getElementById('auth-message').className = 'message';
  }
}

// Função global para acessar o app
window.switchTab = (mode) => app.switchTab(mode);

// Inicializar app
const app = new StudyHub();
