const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('./database');

const authRoutes = require('./routes/auth');
const areasRoutes = require('./routes/areas');
const provasRoutes = require('./routes/provas');

const app = express();
const PORT = process.env.PORT || 3000; // Railway define PORT automaticamente

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/provas', provasRoutes);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// IMPORTANTE: Railway precisa do 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 StudyHub rodando na porta ${PORT}`);
});
