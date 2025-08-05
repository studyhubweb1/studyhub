// Gerenciador de Provas
class ProvasManager {
    constructor() {
        this.provas = [];
        this.currentProvaId = null;
        this.currentView = 'lista';
        this.currentDate = new Date();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProvas();
    }

    setupEventListeners() {
        // Botão nova prova
        document.getElementById('novaProvaBtn')?.addEventListener('click', () => {
            this.openModal();
        });

        // Tabs de visualização
        document.getElementById('listaTab')?.addEventListener('click', () => {
            this.switchView('lista');
        });

        document.getElementById('calendarioTab')?.addEventListener('click', () => {
            this.switchView('calendario');
        });

        // Formulário de prova
        document.getElementById('provaForm')?.addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        // Botões do modal
        document.getElementById('cancelarProva')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Navegação do calendário
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.navigateCalendar(-1);
        });

        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.navigateCalendar(1);
        });

        // Modal de confirmação
        document.getElementById('confirmarExclusao')?.addEventListener('click', () => {
            this.deleteProva();
        });

        document.getElementById('cancelarExclusao')?.addEventListener('click', () => {
            Utils.showModal('confirmModal', false);
        });
    }

    switchView(view) {
        this.currentView = view;
        
        // Atualizar tabs
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(view + 'Tab').classList.add('active');

        // Atualizar views
        document.querySelectorAll('.view-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(view + 'View').classList.add('active');

        if (view === 'calendario') {
            this.renderCalendar();
        }
    }

    async loadProvas() {
        try {
            const containers = [
                document.getElementById('provasList'),
                document.getElementById('calendar')
            ];
            
            containers.forEach(container => {
                if (container) {
                    container.innerHTML = '<div class="loading">Carregando provas...</div>';
                }
            });

            const response = await ApiClient.get('/provas');
            if (response.success) {
                this.provas = response.provas;
                this.renderProvas();
                if (this.currentView === 'calendario') {
                    this.renderCalendar();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar provas:', error);
            Utils.showMessage('Erro ao carregar provas', 'error');
        }
    }

    renderProvas() {
        const container = document.getElementById('provasList');

        if (this.provas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>📅 Nenhuma prova ainda</h3>
                    <p>Cadastre suas provas e prazos para organizar seu cronograma de estudos</p>
                    <button class="btn btn-primary" onclick="provasManager.openModal()">
                        + Cadastrar Primeira Prova
                    </button>
                </div>
            `;
            return;
        }

        // Ordenar por data
        const provasOrdenadas = [...this.provas].sort((a, b) => new Date(a.data) - new Date(b.data));

        container.innerHTML = provasOrdenadas.map(prova => {
            const diasRestantes = Utils.getTimeUntil(prova.data);
            const isUrgente = diasRestantes === 'Hoje' || diasRestantes === 'Vencido';
            const isProxima = diasRestantes === 'Amanhã' || diasRestantes.includes('dias');

            return `
                <div class="prova-card fade-in ${isUrgente ? 'urgente' : isProxima ? 'proxima' : ''}">
                    <div class="prova-header">
                        <div>
                            <h3 class="prova-title">${prova.titulo}</h3>
                            <div class="prova-data">
                                📅 ${Utils.formatDate(prova.data)} - ${diasRestantes}
                            </div>
                        </div>
                        <div class="prova-actions">
                            <button onclick="provasManager.editProva(${prova.id})" title="Editar">
                                ✏️
                            </button>
                            <button onclick="provasManager.confirmDelete(${prova.id})" title="Excluir">
                                🗑️
                            </button>
                        </div>
                    </div>
                    
                    ${prova.descricao ? `
                        <div class="prova-description">${prova.descricao}</div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const currentMonth = document.getElementById('currentMonth');

        // Atualizar título do mês
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        currentMonth.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        // Cabeçalho dos dias da semana
        const dayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        // Calcular dias do mês
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        let calendarHTML = '';

        // Cabeçalhos dos dias
        dayHeaders.forEach(day => {
            calendarHTML += `<div class="calendar-day-header">${day}</div>`;
        });

        // Dias vazios do mês anterior
        for (let i = 0; i < startingDayOfWeek; i++) {
            const prevMonthDay = new Date(firstDay);
            prevMonthDay.setDate(prevMonthDay.getDate() - (startingDayOfWeek - i));
            calendarHTML += `
                <div class="calendar-day other-month">
                    <div class="calendar-day-number">${prevMonthDay.getDate()}</div>
                </div>
            `;
        }

        // Dias do mês atual
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDayDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const dateString = currentDayDate.toISOString().split('T')[0];
            const isToday = dateString === new Date().toISOString().split('T')[0];
            
            // Encontrar provas neste dia
            const provasNoDia = this.provas.filter(prova => prova.data === dateString);

            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''}">
                    <div class="calendar-day-number">${day}</div>
                    <div class="calendar-events">
                        ${provasNoDia.map(prova => `
                            <div class="calendar-event" title="${prova.titulo}">
                                ${prova.titulo}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Dias do próximo mês para completar a grade
        const totalCells = 42; // 6 semanas x 7 dias
        const cellsUsed = startingDayOfWeek + daysInMonth;
        const remainingCells = totalCells - cellsUsed;

        for (let i = 1; i <= remainingCells; i++) {
            calendarHTML += `
                <div class="calendar-day other-month">
                    <div class="calendar-day-number">${i}</div>
                </div>
            `;
        }

        calendar.innerHTML = calendarHTML;
    }

    navigateCalendar(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    openModal(prova = null) {
        this.currentProvaId = prova ? prova.id : null;
        
        const modal = document.getElementById('provaModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('provaForm');

        modalTitle.textContent = prova ? 'Editar Prova' : 'Nova Prova';

        if (prova) {
            document.getElementById('provaTitulo').value = prova.titulo;
            document.getElementById('provaData').value = prova.data;
            document.getElementById('provaDescricao').value = prova.descricao || '';
        } else {
            form.reset();
            // Definir data mínima como hoje
            const hoje = new Date().toISOString().split('T')[0];
            document.getElementById('provaData').min = hoje;
        }

        Utils.showModal('provaModal', true);
        document.getElementById('provaTitulo').focus();
    }

    closeModal() {
        Utils.showModal('provaModal', false);
        this.currentProvaId = null;
    }

    async handleSubmit(e) {
        e.preventDefault();

        const titulo = document.getElementById('provaTitulo').value.trim();
        const data = document.getElementById('provaData').value;
        const descricao = document.getElementById('provaDescricao').value.trim();
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (!titulo || !data) {
            Utils.showMessage('Título e data são obrigatórios', 'warning');
            return;
        }

        // Validar se a data não é no passado (apenas para novas provas)
        if (!this.currentProvaId) {
            const hoje = new Date().toISOString().split('T')[0];
            if (data < hoje) {
                Utils.showMessage('A data da prova não pode ser no passado', 'warning');
                return;
            }
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Salvando...';

            const dadosProva = { titulo, data, descricao };
            let response;

            if (this.currentProvaId) {
                response = await ApiClient.put(`/provas/${this.currentProvaId}`, dadosProva);
            } else {
                response = await ApiClient.post('/provas', dadosProva);
            }

            if (response.success) {
                Utils.showMessage(response.message, 'success');
                this.closeModal();
                this.loadProvas();
            }

        } catch (error) {
            console.error('Erro ao salvar prova:', error);
            Utils.showMessage(error.message || 'Erro ao salvar prova', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
        }
    }

    editProva(id) {
        const prova = this.provas.find(p => p.id === id);
        if (prova) {
            this.openModal(prova);
        }
    }

    confirmDelete(id) {
        this.currentProvaId = id;
        Utils.showModal('confirmModal', true);
    }

    async deleteProva() {
        if (!this.currentProvaId) return;

        try {
            const response = await ApiClient.delete(`/provas/${this.currentProvaId}`);
            if (response.success) {
                Utils.showMessage(response.message, 'success');
                Utils.showModal('confirmModal', false);
                this.loadProvas();
            }
        } catch (error) {
            console.error('Erro ao excluir prova:', error);
            Utils.showMessage(error.message || 'Erro ao excluir prova', 'error');
        }

        this.currentProvaId = null;
    }
}

// Instância global
let provasManager;

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('provas.html')) {
        provasManager = new ProvasManager();
    }
});