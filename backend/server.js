const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar rotas
const authRoutes = require('./routes/auth');
const areasRoutes = require('./routes/areas');
const tarefasRoutes = require('./routes/tarefas');
const provasRoutes = require('./routes/provas');
const dashboardRoutes = require('./routes/dashboard');

// Importar utilitários
const emailService = require('./utils/mailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: false, // Desabilitar CSP para desenvolvimento
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo 100 requests por IP
});
app.use(limiter);

// CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Parser de JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/tarefas', tarefasRoutes);
app.use('/api/provas', provasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota raiz serve o frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    
    // Iniciar serviço de lembretes
    emailService.startReminderService();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏳ Encerrando servidor...');
    process.exit(0);
});