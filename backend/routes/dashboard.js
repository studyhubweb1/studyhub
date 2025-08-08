const express = require('express');
const router = express.Router();

const { authenticateToken } = require('./auth'); // Corrigido aqui

// Exemplo de rota protegida
router.get('/', authenticateToken, async (req, res) => {
    try {
        // lógica para retornar dados do dashboard
        res.json({ success: true, message: 'Dashboard carregado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;
