const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Middleware de autenticação
router.use(authenticateToken);

// Estatísticas do dashboard
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.userId;

        // Total de tarefas concluídas e pendentes
        const tarefasStats = await db.get(`
            SELECT 
                COUNT(*) as total_tarefas,
                COUNT(CASE WHEN concluida = 1 THEN 1 END) as tarefas_concluidas,
                COUNT(CASE WHEN concluida = 0 THEN 1 END) as tarefas_pendentes
            FROM tarefas t
            INNER JOIN areas a ON t.area_id = a.id
            WHERE a.user_id = ?
        `, [userId]);

        // Área mais estudada (com mais tarefas concluídas)
        const areaMaisEstudada = await db.get(`
            SELECT 
                a.nome,
                COUNT(CASE WHEN t.concluida = 1 THEN 1 END) as tarefas_concluidas
            FROM areas a
            LEFT JOIN tarefas t ON a.id = t.area_id
            WHERE a.user_id = ?
            GROUP BY a.id, a.nome
            ORDER BY tarefas_concluidas DESC
            LIMIT 1
        `, [userId]);

        // Próximas 3 provas
        const hoje = new Date().toISOString().split('T')[0];
        const proximasProvas = await db.all(`
            SELECT titulo, data, descricao
            FROM provas
            WHERE user_id = ? AND data >= ?
            ORDER BY data ASC
            LIMIT 3
        `, [userId, hoje]);

        // Tarefas por área para o gráfico
        const tarefasPorArea = await db.all(`
            SELECT 
                a.nome,
                COUNT(*) as total_tarefas,
                COUNT(CASE WHEN t.concluida = 1 THEN 1 END) as tarefas_concluidas,
                COUNT(CASE WHEN t.concluida = 0 THEN 1 END) as tarefas_pendentes
            FROM areas a
            LEFT JOIN tarefas t ON a.id = t.area_id
            WHERE a.user_id = ?
            GROUP BY a.id, a.nome
            ORDER BY total_tarefas DESC
        `, [userId]);

        // Total de áreas
        const totalAreas = await db.get(`
            SELECT COUNT(*) as total_areas
            FROM areas
            WHERE user_id = ?
        `, [userId]);

        res.json({
            success: true,
            stats: {
                tarefas: {
                    total: tarefasStats.total_tarefas || 0,
                    concluidas: tarefasStats.tarefas_concluidas || 0,
                    pendentes: tarefasStats.tarefas_pendentes || 0
                },
                areas: {
                    total: totalAreas.total_areas || 0,
                    maisEstudada: areaMaisEstudada ? {
                        nome: areaMaisEstudada.nome,
                        tarefasConcluidas: areaMaisEstudada.tarefas_concluidas
                    } : null
                },
                proximasProvas,
                tarefasPorArea
            }
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;