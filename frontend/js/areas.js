// Gerenciador de Áreas
class AreasManager {
    constructor() {
        this.areas = [];
        this.currentAreaId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAreas();
    }

    setupEventListeners() {
        // Botão nova área
        document.getElementById('novaAreaBtn')?.addEventListener('click', () => {
            this.openModal();
        });

        // Formulário de área
        document.getElementById('areaForm')?.addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        // Botões do modal
        document.getElementById('cancelarBtn')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Modal de confirmação
        document.getElementById('confirmarExclusao')?.addEventListener('click', () => {
            this.deleteArea();
        });

        document.getElementById('cancelarExclusao')?.addEventListener('click', () => {
            Utils.showModal('confirmModal', false);
        });
    }

    async loadAreas() {
        try {
            const container = document.getElementById('areasGrid');
            container.innerHTML = '<div class="loading">Carregando áreas...</div>';

            const response = await ApiClient.get('/areas');
            if (response.success) {
                this.areas = response.areas;
                this.renderAreas();
            }
        } catch (error) {
            console.error('Erro ao carregar áreas:', error);
            Utils.showMessage('Erro ao carregar áreas', 'error');
        }
    }

    renderAreas() {
        const container = document.getElementById('areasGrid');

        if (this.areas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>📖 Nenhuma área ainda</h3>
                    <p>Crie sua primeira área de estudo para começar a organizar seus estudos</p>
                    <button class="btn btn-primary" onclick="areasManager.openModal()">
                        + Criar Primeira Área
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.areas.map(area => `
            <div class="area-card fade-in">
                <div class="area-header">
                    <div>
                        <h3 class="area-title">${area.nome}</h3>
                        <p class="area-description">${area.descricao || 'Sem descrição'}</p>
                    </div>
                    <div class="area-actions">
                        <button onclick="areasManager.editArea(${area.id})" title="Editar">
                            ✏️
                        </button>
                        <button onclick="areasManager.confirmDelete(${area.id})" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="area-stats">
                    <div class="area-stat">
                        <div class="area-stat-value">${area.total_tarefas || 0}</div>
                        <div class="area-stat-label">Total</div>
                    </div>
                    <div class="area-stat">
                        <div class="area-stat-value">${area.tarefas_concluidas || 0}</div>
                        <div class="area-stat-label">Concluídas</div>
                    </div>
                    <div class="area-stat">
                        <div class="area-stat-value">${(area.total_tarefas || 0) - (area.tarefas_concluidas || 0)}</div>
                        <div class="area-stat-label">Pendentes</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    openModal(area = null) {
        this.currentAreaId = area ? area.id : null;
        
        const modal = document.getElementById('areaModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('areaForm');

        modalTitle.textContent = area ? 'Editar Área' : 'Nova Área de Estudo';

        if (area) {
            document.getElementById('areaNome').value = area.nome;
            document.getElementById('areaDescricao').value = area.descricao || '';
        } else {
            form.reset();
        }

        Utils.showModal('areaModal', true);
        document.getElementById('areaNome').focus();
    }

    closeModal() {
        Utils.showModal('areaModal', false);
        this.currentAreaId = null;
    }

    async handleSubmit(e) {
        e.preventDefault();

        const nome = document.getElementById('areaNome').value.trim();
        const descricao = document.getElementById('areaDescricao').value.trim();
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (!nome) {
            Utils.showMessage('Nome da área é obrigatório', 'warning');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Salvando...';

            const data = { nome, descricao };
            let response;

            if (this.currentAreaId) {
                response = await ApiClient.put(`/areas/${this.currentAreaId}`, data);
            } else {
                response = await ApiClient.post('/areas', data);
            }

            if (response.success) {
                Utils.showMessage(response.message, 'success');
                this.closeModal();
                this.loadAreas();
            }

        } catch (error) {
            console.error('Erro ao salvar área:', error);
            Utils.showMessage(error.message || 'Erro ao salvar área', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
        }
    }

    editArea(id) {
        const area = this.areas.find(a => a.id === id);
        if (area) {
            this.openModal(area);
        }
    }

    confirmDelete(id) {
        this.currentAreaId = id;
        Utils.showModal('confirmModal', true);
    }

    async deleteArea() {
        if (!this.currentAreaId) return;

        try {
            const response = await ApiClient.delete(`/areas/${this.currentAreaId}`);
            if (response.success) {
                Utils.showMessage(response.message, 'success');
                Utils.showModal('confirmModal', false);
                this.loadAreas();
            }
        } catch (error) {
            console.error('Erro ao excluir área:', error);
            Utils.showMessage(error.message || 'Erro ao excluir área', 'error');
        }

        this.currentAreaId = null;
    }
}

// Instância global
let areasManager;

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('areas.html')) {
        areasManager = new AreasManager();
    }
});