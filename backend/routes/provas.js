const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const provas = await db.all('SELECT * FROM provas WHERE user_id = ? ORDER BY data ASC', [req.user.userId]);
        res.json({ success: true, provas });
    } catch (error) {
        console.error('Erro ao listar provas:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.get('/proximas', async (req, res) => {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        const emTrintaDias = new Date();
        emTrintaDias.setDate(emTrintaDias.getDate() + 30);
        const dataLimite = emTrintaDias.toISOString().split('T')[0];
        const provas = await db.all(
            `SELECT * FROM provas 
             WHERE user_id = ? AND data >= ? AND data <= ?
             ORDER BY data ASC LIMIT 5`,
            [req.user.userId, hoje, dataLimite]
        );
        res.json({ success: true, provas });
    } catch (error) {
        console.error('Erro ao listar próximas provas:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { titulo, data, descricao } = req.body;
        if (!titulo || !data) return res.status(400).json({ success: false, message: 'Título e data são obrigatórios' });
        const dataObj = new Date(data);
        if (isNaN(dataObj.getTime())) return res.status(400).json({ success: false, message: 'Data inválida' });
        const result = await db.run('INSERT INTO provas (titulo, data, descricao, user_id) VALUES (?, ?, ?, ?)', [titulo, data, descricao || '', req.user.userId]);
        const novaProva = await db.get('SELECT * FROM provas WHERE id = ?', [result.id]);
        res.status(201).json({ success: true, message: 'Prova criada com sucesso', prova: novaProva });
    } catch (error) {
        console.error('Erro ao criar prova:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, data, descricao } = req.body;
        if (!titulo || !data) return res.status(400).json({ success: false, message: 'Título e data são obrigatórios' });
        const prova = await db.get('SELECT id FROM provas WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        if (!prova) return res.status(404).json({ success: false, message: 'Prova não encontrada' });
        const dataObj = new Date(data);
        if (isNaN(dataObj.getTime())) return res.status(400).json({ success: false, message: 'Data inválida' });
        await db.run('UPDATE provas SET titulo = ?, data = ?, descricao = ? WHERE id = ?', [titulo, data, descricao || '', id]);
        const provaAtualizada = await db.get('SELECT * FROM provas WHERE id = ?', [id]);
        res.json({ success: true, message: 'Prova atualizada com sucesso', prova: provaAtualizada });
    } catch (error) {
        console.error('Erro ao atualizar prova:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const prova = await db.get('SELECT id FROM provas WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        if (!prova) return res.status(404).json({ success: false, message: 'Prova não encontrada' });
        await db.run('DELETE FROM provas WHERE id = ?', [id]);
        res.json({ success: true, message: 'Prova excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir prova:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;
