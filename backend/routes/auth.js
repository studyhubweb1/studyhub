const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const emailService = require('../utils/mailer');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'estudohub-secret-key-2024';
if (!process.env.JWT_SECRET) {
    console.warn('Aviso: Usando chave JWT padrão. Configure JWT_SECRET no ambiente para produção.');
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token de acesso requerido' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Token inválido' });
        req.user = user;
        next();
    });
};

router.post('/register', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
        }
        if (senha.length < 6) {
            return res.status(400).json({ success: false, message: 'A senha deve ter pelo menos 6 caracteres' });
        }
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'E-mail já cadastrado' });
        }
        const hashedPassword = await bcrypt.hash(senha, 10);
        const result = await db.run('INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)', [nome, email, hashedPassword]);
        const token = jwt.sign({ userId: result.id, email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso', token, user: { id: result.id, nome, email } });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios' });
        }
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).json({ success: false, message: 'E-mail ou senha incorretos' });
        }
        const validPassword = await bcrypt.compare(senha, user.senha);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'E-mail ou senha incorretos' });
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, message: 'Login realizado com sucesso', token, user: { id: user.id, nome: user.nome, email: user.email } });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const user = await db.get('SELECT id, nome, email FROM users WHERE id = ?', [req.user.userId]);
        if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        res.json({ success: true, user });
    } catch (error) {
        console.error('Erro na verificação:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'E-mail é obrigatório' });
    try {
        const user = await db.get('SELECT id, email, nome FROM users WHERE email = ?', [email]);
        if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;
        await emailService.sendReminderEmail(user.email, user.nome, { titulo: 'Redefinição de Senha', descricao: `Clique no link para redefinir sua senha: <a href="${resetLink}">${resetLink}</a>`, data: '' });
        res.json({ success: true, message: 'E-mail de redefinição de senha enviado com sucesso' });
    } catch (error) {
        console.error('Erro ao solicitar redefinição de senha:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) return res.status(400).json({ success: false, message: 'Token e nova senha são obrigatórios' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const hashedPassword = await bcrypt.hash(novaSenha, 10);
        await db.run('UPDATE users SET senha = ? WHERE id = ?', [hashedPassword, decoded.userId]);
        res.json({ success: true, message: 'Senha redefinida com sucesso' });
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(400).json({ success: false, message: 'Token inválido ou expirado' });
    }
});

module.exports = { router, authenticateToken };
