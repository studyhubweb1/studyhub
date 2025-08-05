const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// Listar áreas do usuário
router.get('/', async (req, res) => {
    try {
        const areas = await db.all(
            `SELECT a.*, 
                    COUNT(t.id) as total_tarefas,
                    COUNT(CASE WHEN t.concluida = 1 THEN 1 END) as tarefas_concluidas
             FROM areas a
             LEFT JOIN tarefas t ON a.id = t.area_id
             WHERE a.user_id = ?
             GROUP BY a.id
             ORDER BY a.created_at DESC`,
            [req.user.userId]
        );

        res.json({
            success: true,
            areas
        });

    } catch (error) {
        console.error('Erro ao listar áreas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Criar nova área
router.post('/', async (req, res) => {
    try {
        const { nome, descricao } = req.body;

        if (!nome) {
            return res.status(400).json({
                success: false,
                message: 'Nome da área é obrigatório'
            });
        }

        const result = await db.run(
            'INSERT INTO areas (nome, descricao, user_id) VALUES (?, ?, ?)',
            [nome, descricao || '', req.user.userId]
        );

        const novaArea = await db.get(
            'SELECT * FROM areas WHERE id = ?',
            [result.id]
        );

        res.status(201).json({
            success: true,
            message: 'Área criada com sucesso',
            area: novaArea
        });

    } catch (error) {
        console.error('Erro ao criar área:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Editar área
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao } = req.body;

        if (!nome) {
            return res.status(400).json({
                success: false,
                message: 'Nome da área é obrigatório'
            });
        }

        // Verificar se a área pertence ao usuário
        const area = await db.get(
            'SELECT id FROM areas WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );

        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Área não encontrada'
            });
        }

        await db.run(
            'UPDATE areas SET nome = ?, descricao = ? WHERE id = ?',
            [nome, descricao || '', id]
        );

        const areaAtualizada = await db.get(
            'SELECT * FROM areas WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Área atualizada com sucesso',
            area: areaAtualizada
        });

    } catch (error) {
        console.error('Erro ao atualizar área:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Excluir área
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se a área pertence ao usuário
        const area = await db.get(
            'SELECT id FROM areas WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );

        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Área não encontrada'
            });
        }

        // Excluir área (as tarefas serão excluídas automaticamente pelo CASCADE)
        await db.run('DELETE FROM areas WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Área excluída com sucesso'
        });

    } catch (error) {
        console.error('Erro ao excluir área:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;