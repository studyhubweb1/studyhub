const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { router: authRoutes } = require('./routes/auth');
const areasRoutes = require('./routes/areas');
const tarefasRoutes = require('./routes/tarefas');
const provasRoutes = require('./routes/provas');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

const emailService = require('./utils/mailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Muitas requisições deste IP, por favor tente novamente mais tarde',
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/auth', limiter);

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/tarefas', tarefasRoutes);
app.use('/api/provas', provasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dashboard.html'));
});

app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err.stack);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    emailService.startReminderService();
});

process.on('SIGINT', () => {
    console.log('\n⏳ Encerrando servidor...');
    process.exit(0);
});
