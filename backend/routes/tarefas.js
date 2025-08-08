const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/area/:areaId', async (req, res) => {
    try {
        const { areaId } = req.params;
        const area = await db.get('SELECT id FROM areas WHERE id = ? AND user_id = ?', [areaId, req.user.userId]);
        if (!area) return res.status(404).json({ success: false, message: 'Área não encontrada' });
        const tarefas = await db.all('SELECT * FROM tarefas WHERE area_id = ? ORDER BY concluida ASC, created_at DESC', [areaId]);
        res.json({ success: true, tarefas });
    } catch (error) {
        console.error('Erro ao listar tarefas:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.get('/', async (req, res) => {
    try {
        const tarefas = await db.all(
            `SELECT t.*, a.nome as area_nome 
             FROM tarefas t
             INNER JOIN areas a ON t.area_id = a.id
             WHERE a.user_id = ?
             ORDER BY t.concluida ASC, t.created_at DESC`,
            [req.user.userId]
        );
        res.json({ success: true, tarefas });
    } catch (error) {
        console.error('Erro ao listar tarefas:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { titulo, area_id } = req.body;
        if (!titulo || !area_id) return res.status(400).json({ success: false, message: 'Título e área são obrigatórios' });
        const area = await db.get('SELECT id FROM areas WHERE id = ? AND user_id = ?', [area_id, req.user.userId]);
        if (!area) return res.status(404).json({ success: false, message: 'Área não encontrada' });
        const result = await db.run('INSERT INTO tarefas (titulo, area_id) VALUES (?, ?)', [titulo, area_id]);
        const novaTarefa = await db.get('SELECT * FROM tarefas WHERE id = ?', [result.id]);
        res.status(201).json({ success: true, message: 'Tarefa criada com sucesso', tarefa: novaTarefa });
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.put('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const tarefa = await db.get(
            `SELECT t.*, a.user_id 
             FROM tarefas t
             INNER JOIN areas a ON t.area_id = a.id
             WHERE t.id = ? AND a.user_id = ?`,
            [id, req.user.userId]
        );
        if (!tarefa) return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        const novoConcluida = !tarefa.concluida;
        const completed_at = novoConcluida ? new Date().toISOString() : null;
        await db.run('UPDATE tarefas SET concluida = ?, completed_at = ? WHERE id = ?', [novoConcluida, completed_at, id]);
        const tarefaAtualizada = await db.get('SELECT * FROM tarefas WHERE id = ?', [id]);
        res.json({ success: true, message: `Tarefa ${novoConcluida ? 'concluída' : 'marcada como pendente'}`, tarefa: tarefaAtualizada });
    } catch (error) {
        console.error('Erro ao alterar status da tarefa:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tarefa = await db.get(
            `SELECT t.id 
             FROM tarefas t
             INNER JOIN areas a ON t.area_id = a.id
             WHERE t.id = ? AND a.user_id = ?`,
            [id, req.user.userId]
        );
        if (!tarefa) return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        await db.run('DELETE FROM tarefas WHERE id = ?', [id]);
        res.json({ success: true, message: 'Tarefa excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;
