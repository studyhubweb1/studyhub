// Gerenciador de Tarefas
class TarefasManager {
    constructor() {
        this.tarefas = [];
        this.areas = [];
        this.currentTarefaId = null;
        this.filtros = {
            area: '',
            status: ''
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAreas();
        this.loadTarefas();
    }

    setupEventListeners() {
        // Botão nova tarefa
        document.getElementById('novaTarefaBtn')?.addEventListener('click', () => {
            this.openModal();
        });

        // Formulário de tarefa
        document.getElementById('tarefaForm')?.addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        // Botões do modal
        document.getElementById('cancelarTarefa')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Filtros
        document.getElementById('filtroArea')?.addEventListener('change', (e) => {
            this.filtros.area = e.target.value;
            this.filterTarefas();
        });

        document.getElementById('filtroStatus')?.addEventListener('change', (e) => {
            this.filtros.status = e.target.value;
            this.filterTarefas();
        });

        // Modal de confirmação
        document.getElementById('confirmarExclusao')?.addEventListener('click', () => {
            this.deleteTarefa();
        });

        document.getElementById('cancelarExclusao')?.addEventListener('click', () => {
            Utils.showModal('confirmModal', false);
        });
    }

    async loadAreas() {
        try {
            const response = await ApiClient.get('/areas');
            if (response.success) {
                this.areas = response.areas;
                this.renderAreaOptions();
            }
        } catch (error) {
            console.error('Erro ao carregar áreas:', error);
        }
    }

    renderAreaOptions() {
        const selectArea = document.getElementById('tarefaArea');
        const filtroArea = document.getElementById('filtroArea');

        if (selectArea) {
            selectArea.innerHTML = '<option value="">Selecione uma área</option>' +
                this.areas.map(area => `<option value="${area.id}">${area.nome}</option>`).join('');
        }

        if (filtroArea) {
            filtroArea.innerHTML = '<option value="">Todas as áreas</option>' +
                this.areas.map(area => `<option value="${area.id}">${area.nome}</option>`).join('');
        }
    }

    async loadTarefas() {
        try {
            const container = document.getElementById('tarefasList');
            container.innerHTML = '<div class="loading">Carregando tarefas...</div>';

            const response = await ApiClient.get('/tarefas');
            if (response.success) {
                this.tarefas = response.tarefas;
                this.renderTarefas();
            }
        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
            Utils.showMessage('Erro ao carregar tarefas', 'error');
        }
    }

    renderTarefas(tarefasFiltradas = null) {
        const container = document.getElementById('tarefasList');
        const tarefasToRender = tarefasFiltradas || this.tarefas;

        if (tarefasToRender.length === 0) {
            if (this.tarefas.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>✅ Nenhuma tarefa ainda</h3>
                        <p>Crie suas primeiras tarefas para organizar seus estudos</p>
                        <button class="btn btn-primary" onclick="tarefasManager.openModal()">
                            + Criar Primeira Tarefa
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>🔍 Nenhuma tarefa encontrada</h3>
                        <p>Tente ajustar os filtros</p>
                    </div>
                `;
            }
            return;
        }

        container.innerHTML = tarefasToRender.map(tarefa => `
            <div class="tarefa-item fade-in">
                <div class="tarefa-checkbox ${tarefa.concluida ? 'concluida' : ''}" 
                     onclick="tarefasManager.toggleTarefa(${tarefa.id})">
                    ${tarefa.concluida ? '✓' : ''}
                </div>
                
                <div class="tarefa-content">
                    <div class="tarefa-titulo ${tarefa.concluida ? 'concluida' : ''}">
                        ${tarefa.titulo}
                    </div>
                    <div class="tarefa-area">${tarefa.area_nome}</div>
                </div>
                
                <div class="tarefa-actions">
                    <button onclick="tarefasManager.confirmDelete(${tarefa.id})" title="Excluir">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterTarefas() {
        let tarefasFiltradas = [...this.tarefas];

        // Filtrar por área
        if (this.filtros.area) {
            tarefasFiltradas = tarefasFiltradas.filter(tarefa => 
                tarefa.area_id == this.filtros.area
            );
        }

        // Filtrar por status
        if (this.filtros.status === 'concluidas') {
            tarefasFiltradas = tarefasFiltradas.filter(tarefa => tarefa.concluida);
        } else if (this.filtros.status === 'pendentes') {
            tarefasFiltradas = tarefasFiltradas.filter(tarefa => !tarefa.concluida);
        }

        this.renderTarefas(tarefasFiltradas);
    }

    openModal() {
        if (this.areas.length === 0) {
            Utils.showMessage('Crie pelo menos uma área de estudo antes de adicionar tarefas', 'warning');
            return;
        }

        const form = document.getElementById('tarefaForm');
        form.reset();
        
        Utils.showModal('tarefaModal', true);
        document.getElementById('tarefaTitulo').focus();
    }

    closeModal() {
        Utils.showModal('tarefaModal', false);
    }

    async handleSubmit(e) {
        e.preventDefault();

        const titulo = document.getElementById('tarefaTitulo').value.trim();
        const area_id = document.getElementById('tarefaArea').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (!titulo || !area_id) {
            Utils.showMessage('Título e área são obrigatórios', 'warning');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Criando...';

            const response = await ApiClient.post('/tarefas', {
                titulo,
                area_id: parseInt(area_id)
            });

            if (response.success) {
                Utils.showMessage(response.message, 'success');
                this.closeModal();
                this.loadTarefas();
            }

        } catch (error) {
            console.error('Erro ao criar tarefa:', error);
            Utils.showMessage(error.message || 'Erro ao criar tarefa', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Criar Tarefa';
        }
    }

    async toggleTarefa(id) {
        try {
            const response = await ApiClient.put(`/tarefas/${id}/toggle`);
            if (response.success) {
                // Atualizar localmente
                const tarefa = this.tarefas.find(t => t.id === id);
                if (tarefa) {
                    tarefa.concluida = !tarefa.concluida;
                    this.filterTarefas();
                }
                
                // Mostrar feedback
                const message = response.tarefa.concluida ? 
                    '✅ Tarefa concluída!' : 
                    '⏳ Tarefa marcada como pendente';
                Utils.showMessage(message, 'success');
            }
        } catch (error) {
            console.error('Erro ao alterar status da tarefa:', error);
            Utils.showMessage('Erro ao alterar status da tarefa', 'error');
        }
    }

    confirmDelete(id) {
        this.currentTarefaId = id;
        Utils.showModal('confirmModal', true);
    }

    async deleteTarefa() {
        if (!this.currentTarefaId) return;

        try {
            const response = await ApiClient.delete(`/tarefas/${this.currentTarefaId}`);
            if (response.success) {
                Utils.showMessage(response.message, 'success');
                Utils.showModal('confirmModal', false);
                this.loadTarefas();
            }
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
            Utils.showMessage(error.message || 'Erro ao excluir tarefa', 'error');
        }

        this.currentTarefaId = null;
    }
}

// Instância global
let tarefasManager;

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('tarefas.html')) {
        tarefasManager = new TarefasManager();
    }
});