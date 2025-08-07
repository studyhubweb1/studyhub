const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Middleware para verificar se o usuário é administrador
const isAdmin = async (req, res, next) => {
    const user = await db.get('SELECT email FROM users WHERE id = ?', [req.user.userId]);
    if (user && user.email === 'admin@studyhub.com') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Acesso negado' });
    }
};

// Listar todos os usuários
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Excluir usuário por ID
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const userId = req.params.id;

    try {
        if (req.user.userId === parseInt(userId)) {
            return res.status(400).json({ success: false, message: 'Você não pode excluir sua própria conta' });
        }

        await db.deleteUserById(userId);
        res.json({ success: true, message: 'Usuário excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;
