// Dashboard específico
class DashboardManager {
    constructor() {
        this.stats = {};
        this.init();
    }

    async init() {
        await this.loadStats();
        this.renderStats();
        this.renderChart();
        this.renderProximasProvas();
        this.renderProgressBar();
    }

    async loadStats() {
        try {
            const response = await ApiClient.get('/dashboard/stats');
            if (response.success) {
                this.stats = response.stats;
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            Utils.showMessage('Erro ao carregar dados do dashboard', 'error');
        }
    }

    renderStats() {
        const { tarefas, areas } = this.stats;

        // Cards de estatísticas
        document.getElementById('tarefasConcluidas').textContent = tarefas?.concluidas || 0;
        document.getElementById('tarefasPendentes').textContent = tarefas?.pendentes || 0;
        document.getElementById('totalAreas').textContent = areas?.total || 0;
        
        const areaMaisEstudada = areas?.maisEstudada?.nome || 'Nenhuma';
        document.getElementById('areaMaisEstudada').textContent = areaMaisEstudada;
    }

    renderChart() {
        const chartContainer = document.getElementById('chart');
        const { tarefasPorArea } = this.stats;

        if (!tarefasPorArea || tarefasPorArea.length === 0) {
            chartContainer.innerHTML = `
                <div class="empty-state">
                    <h3>📊 Nenhuma área ainda</h3>
                    <p>Crie suas primeiras áreas de estudo para ver as estatísticas</p>
                    <a href="areas.html" class="btn btn-primary">Criar Área</a>
                </div>
            `;
            return;
        }

        // Encontrar o valor máximo para normalização
        const maxTarefas = Math.max(...tarefasPorArea.map(area => area.total_tarefas));

        chartContainer.innerHTML = tarefasPorArea.map(area => `
            <div class="chart-bar">
                <div class="chart-label">${area.nome}</div>
                <div class="chart-progress">
                    <div class="chart-fill" style="width: ${(area.total_tarefas / maxTarefas) * 100}%"></div>
                </div>
                <div class="chart-value">${area.total_tarefas}</div>
            </div>
        `).join('');

        // Animar as barras
        setTimeout(() => {
            const fills = chartContainer.querySelectorAll('.chart-fill');
            fills.forEach(fill => {
                fill.style.width = fill.style.width;
            });
        }, 100);
    }

    renderProximasProvas() {
        const container = document.getElementById('proximasProvas');
        const { proximasProvas } = this.stats;

        if (!proximasProvas || proximasProvas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>📅 Nenhuma prova próxima</h3>
                    <p>Cadastre suas provas e prazos</p>
                    <a href="provas.html" class="btn btn-primary">Adicionar Prova</a>
                </div>
            `;
            return;
        }

        container.innerHTML = proximasProvas.map(prova => {
            const diasRestantes = Utils.getTimeUntil(prova.data);
            const isUrgente = diasRestantes === 'Hoje' || diasRestantes === 'Amanhã';
            
            return `
                <div class="prova-item ${isUrgente ? 'urgente' : ''}">
                    <h4>${prova.titulo}</h4>
                    <div class="prova-data">${diasRestantes}</div>
                    ${prova.descricao ? `<div class="prova-descricao">${prova.descricao}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    renderProgressBar() {
        const { tarefas } = this.stats;
        const total = tarefas?.total || 0;
        const concluidas = tarefas?.concluidas || 0;
        
        const percentage = total > 0 ? Math.round((concluidas / total) * 100) : 0;
        
        const progressBar = document.getElementById('progressBar');
        const progressPercentage = document.getElementById('progressPercentage');
        
        if (progressBar && progressPercentage) {
            progressPercentage.textContent = `${percentage}%`;
            
            // Animar a barra de progresso
            setTimeout(() => {
                progressBar.style.width = `${percentage}%`;
            }, 100);
        }
    }
}

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        new DashboardManager();
    }
});