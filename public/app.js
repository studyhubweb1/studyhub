class StudyHub {
  constructor() {
    this.API_URL = window.location.origin + '/api';
    this.currentUser = null;
    this.token = null;
    this.currentMode = 'login';
    this.currentSection = 'areas';
    this.areas = [];
    this.provas = [];
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAuth();
    this.setupNotifications();
  }

  bindEvents() {
    // Auth form
    const authForm = document.getElementById('auth-form');
    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (this.currentMode === 'login') {
          this.login();
        } else {
          this.register();
        }
      });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Modals - Área
    const addAreaBtn = document.getElementById('add-area-btn');
    if (addAreaBtn) {
      addAreaBtn.addEventListener('click', () => this.openAreaModal());
    }

    const closeAreaModal = document.getElementById('close-area-modal');
    if (closeAreaModal) {
      closeAreaModal.addEventListener('click', () => this.closeAreaModal());
    }

    const cancelArea = document.getElementById('cancel-area');
    if (cancelArea) {
      cancelArea.addEventListener('click', () => this.closeAreaModal());
    }

    // Modals - Prova
    const addProvaBtn = document.getElementById('add-prova-btn');
    if (addProvaBtn) {
      addProvaBtn.addEventListener('click', () => this.openProvaModal());
    }

    const closeProvaModal = document.getElementById('close-prova-modal');
    if (closeProvaModal) {
      closeProvaModal.addEventListener('click', () => this.closeProvaModal());
    }

    const cancelProva = document.getElementById('cancel-prova');
    if (cancelProva) {
      cancelProva.addEventListener('click', () => this.closeProvaModal());
    }

    // Forms
    const areaForm = document.getElementById('area-form');
    if (areaForm) {
      areaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createArea();
      });
    }

    const provaForm = document.getElementById('prova-form');
    if (provaForm) {
      provaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createProva();
      });
    }

    // Fechar modal clicando fora
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeAreaModal();
        this.closeProvaModal();
      }
    });
  }

  setupNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  checkAuth() {
    const savedToken = localStorage.getItem('studyhub_token');
    const savedUser = localStorage.getItem('studyhub_user');
    
    if (savedToken && savedUser) {
      try {
        this.token = savedToken;
        this.currentUser = JSON.parse(savedUser);
        this.showMainScreen();
      } catch (error) {
        this.logout();
      }
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
    this.loadProvas();
    this.checkProvasProximas();
    this.showSection('areas');
  }

  showSection(section) {
    this.currentSection = section;
    
    // Atualizar navegação
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    const navTab = document.getElementById(`${section}-nav`);
    if (navTab) navTab.classList.add('active');
    
    // Mostrar seção
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('hidden'));
    const sectionEl = document.getElementById(`${section}-section`);
    if (sectionEl) sectionEl.classList.remove('hidden');
    
    if (section === 'provas') {
      this.loadAreasForFilter();
    }
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
        this.areas = data.areas;
        this.displayAreas(this.areas);
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
        <h3>${this.escapeHtml(area.nome)}</h3>
        <p>${this.escapeHtml(area.descricao || 'Sem descrição')}</p>
      </div>
    `).join('');
  }

  async loadProvas() {
    const provasGrid = document.getElementById('provas-grid');
    if (!provasGrid) return;
    
    provasGrid.innerHTML = '<div class="loading">Carregando provas...</div>';

    try {
      const response = await fetch(`${this.API_URL}/provas?user_id=${this.currentUser.id}`, {
        headers: { Authorization: this.token }
      });

      const data = await response.json();

      if (data.success) {
        this.provas = data.provas;
        this.displayProvas(this.provas);
        this.updateStats();
      } else {
        provasGrid.innerHTML = '<div class="empty-state"><h3>Erro ao carregar provas</h3></div>';
      }
    } catch (error) {
      provasGrid.innerHTML = '<div class="empty-state"><h3>Erro de conexão</h3></div>';
    }
  }

  displayProvas(provas) {
    const provasGrid = document.getElementById('provas-grid');
    if (!provasGrid) return;
    
    if (provas.length === 0) {
      provasGrid.innerHTML = `
        <div class="empty-state">
          <h3>Nenhuma prova cadastrada</h3>
          <p>Crie sua primeira prova para começar!</p>
        </div>
      `;
      return;
    }

    provasGrid.innerHTML = provas.map(prova => {
      const diasRestantes = this.calcularDiasRestantes(prova.data_prova);
      const urgencia = this.getUrgencia(diasRestantes);
      
      return `
        <div class="prova-card ${urgencia}">
          <div class="prova-actions">
            <button class="delete-prova" onclick="app.deleteProva(${prova.id})" title="Excluir prova">
              ×
            </button>
          </div>
          
          <div class="prova-header">
            <div class="prova-title">
              <h3>${this.escapeHtml(prova.nome)}</h3>
              ${prova.area_nome ? `<span class="prova-area" style="background-color: ${prova.area_cor}">${this.escapeHtml(prova.area_nome)}</span>` : ''}
            </div>
          </div>
          
          <div class="prova-date ${urgencia}">
            📅 ${this.formatarData(prova.data_prova)}
          </div>
          
          <div class="dias-restantes ${urgencia}">
            ${this.getDiasRestantesTexto(diasRestantes)}
          </div>
          
          ${prova.descricao ? `<div class="prova-desc">${this.escapeHtml(prova.descricao)}</div>` : ''}
          
          <div class="prova-status">
            <select class="status-select" onchange="app.updateProvaStatus(${prova.id}, this.value)">
              <option value="nao_estudado" ${prova.status === 'nao_estudado' ? 'selected' : ''}>Não estudado</option>
              <option value="estudando" ${prova.status === 'estudando' ? 'selected' : ''}>Estudando</option>
              <option value="concluido" ${prova.status === 'concluido' ? 'selected' : ''}>Concluído</option>
            </select>
          </div>
        </div>
      `;
    }).join('');
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
        this.closeAreaModal();
        this.loadAreas();
        this.showNotification('Área criada com sucesso!', 'success');
      } else {
        alert('Erro ao criar área: ' + data.error);
      }
    } catch (error) {
      alert('Erro de conexão. Tente novamente.');
    }
  }

  async createProva() {
    const nome = document.getElementById('prova-name').value.trim();
    const descricao = document.getElementById('prova-desc').value.trim();
    const data_prova = document.getElementById('prova-date').value;
    const area_id = document.getElementById('prova-area').value || null;

    if (!nome || !data_prova) {
      alert('Nome e data da prova são obrigatórios');
      return;
    }

    try {
      const response = await fetch(`${this.API_URL}/provas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.token
        },
        body: JSON.stringify({
          nome,
          descricao,
          data_prova,
          area_id,
          user_id: this.currentUser.id
        })
      });

      const data = await response.json();

      if (data.success) {
        this.closeProvaModal();
        this.loadProvas();
        this.showNotification('Prova criada com sucesso!', 'success');
      } else {
        alert('Erro ao criar prova: ' + data.error);
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
        this.showNotification('Área excluída!', 'success');
      } else {
        alert('Erro ao excluir área: ' + data.error);
      }
    } catch (error) {
      alert('Erro de conexão. Tente novamente.');
    }
  }

  async deleteProva(provaId) {
    if (!confirm('Tem certeza que deseja excluir esta prova?')) return;

    try {
      const response = await fetch(`${this.API_URL}/provas/${provaId}`, {
        method: 'DELETE',
        headers: { Authorization: this.token }
      });

      const data = await response.json();

      if (data.success) {
        this.loadProvas();
        this.showNotification('Prova excluída!', 'success');
      } else {
        alert('Erro ao excluir prova: ' + data.error);
      }
    } catch (error) {
      alert('Erro de conexão. Tente novamente.');
    }
  }

  async updateProvaStatus(provaId, novoStatus) {
    try {
      const response = await fetch(`${this.API_URL}/provas/${provaId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.token
        },
        body: JSON.stringify({ status: novoStatus })
      });

      const data = await response.json();

      if (data.success) {
        this.loadProvas();
        this.showNotification('Status atualizado!', 'success');
      } else {
        alert('Erro ao atualizar status: ' + data.error);
      }
    } catch (error) {
      alert('Erro de conexão. Tente novamente.');
    }
  }

  updateStats() {
    const totalAreasEl = document.getElementById('total-areas');
    const totalProvasEl = document.getElementById('total-provas');
    const proximasEl = document.getElementById('provas-proximas');
    
    if (totalAreasEl) totalAreasEl.textContent = this.areas.length;
    if (totalProvasEl) totalProvasEl.textContent = this.provas.length;
    
    if (proximasEl) {
      const proximas = this.provas.filter(p => {
        const dias = this.calcularDiasRestantes(p.data_prova);
        return dias >= 0 && dias <= 7;
      });
      proximasEl.textContent = proximas.length;
    }
  }

  async loadAreasForFilter() {
    const areaFilter = document.getElementById('area-filter');
    if (!areaFilter) return;
    
    areaFilter.innerHTML = '<option value="">Todas as áreas</option>';
    this.areas.forEach(area => {
      areaFilter.innerHTML += `<option value="${area.id}">${this.escapeHtml(area.nome)}</option>`;
    });
  }

  filterProvas() {
    const statusFilter = document.getElementById('status-filter');
    const areaFilter = document.getElementById('area-filter');
    
    if (!statusFilter || !areaFilter) return;
    
    let provasFiltradas = [...this.provas];
    
    const statusSelecionado = statusFilter.value;
    const areaSelecionada = areaFilter.value;
    
    if (statusSelecionado) {
      provasFiltradas = provasFiltradas.filter(p => p.status === statusSelecionado);
    }
    
    if (areaSelecionada) {
      provasFiltradas = provasFiltradas.filter(p => p.area_id == areaSelecionada);
    }
    
    this.displayProvas(provasFiltradas);
  }

  async checkProvasProximas() {
    try {
      const response = await fetch(`${this.API_URL}/provas/proximas?user_id=${this.currentUser.id}&dias=7`, {
        headers: { Authorization: this.token }
      });

      const data = await response.json();

      if (data.success && data.provas.length > 0) {
        this.notificarProvasProximas(data.provas);
      }
    } catch (error) {
      console.log('Erro ao verificar provas próximas');
    }
  }

  notificarProvasProximas(provas) {
    provas.forEach(prova => {
      const dias = this.calcularDiasRestantes(prova.data_prova);
      if (dias <= 3 && dias >= 0) {
        this.showBrowserNotification(
          `Prova em ${dias} dia${dias !== 1 ? 's' : ''}!`,
          `${prova.nome} - ${this.formatarData(prova.data_prova)}`
        );
      }
    });
  }

  showBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  }

  openAreaModal() {
    document.getElementById('area-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('area-name').focus(), 100);
  }

  closeAreaModal() {
    document.getElementById('area-modal').classList.add('hidden');
    document.getElementById('area-form').reset();
  }

  openProvaModal() {
    // Carregar áreas no select
    const areaSelect = document.getElementById('prova-area');
    areaSelect.innerHTML = '<option value="">Selecione uma área</option>';
    this.areas.forEach(area => {
      areaSelect.innerHTML += `<option value="${area.id}">${this.escapeHtml(area.nome)}</option>`;
    });

    document.getElementById('prova-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('prova-name').focus(), 100);
  }

  closeProvaModal() {
    document.getElementById('prova-modal').classList.add('hidden');
    document.getElementById('prova-form').reset();
  }

  showMessage(text, type) {
    const messageEl = document.getElementById('auth-message');
    if (!messageEl) return;
    
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = 'message';
    }, 5000);
  }

  clearMessage() {
    const messageEl = document.getElementById('auth-message');
    if (!messageEl) return;
    
    messageEl.textContent = '';
    messageEl.className = 'message';
  }

  showNotification(text, type) {
    // Criar notificação temporária
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = text;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Funções utilitárias
  calcularDiasRestantes(dataProva) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prova = new Date(dataProva + 'T00:00:00');
    const diffTime = prova - hoje;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getUrgencia(diasRestantes) {
    if (diasRestantes < 0) return 'normal';
    if (diasRestantes <= 3) return 'urgente';
    if (diasRestantes <= 7) return 'proximo';
    return 'normal';
  }

  getDiasRestantesTexto(dias) {
    if (dias < 0) return 'Prova já passou';
    if (dias === 0) return '🔥 HOJE!';
    if (dias === 1) return '⚡ Amanhã!';
    if (dias <= 7) return `⏰ ${dias} dias`;
    return `📆 ${dias} dias`;
  }

  formatarData(data) {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Funções globais
window.switchTab = (mode) => app.switchTab(mode);
window.showSection = (section) => app.showSection(section);

// Inicializar app
const app = new StudyHub();
