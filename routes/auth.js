const express = require('express');
const router = express.Router();
const db = require('../database');
const { md5Hash } = require('../utils');

// Registro
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Username e password são obrigatórios' 
    });
  }

  if (password.length < 4) {
    return res.status(400).json({ 
      success: false, 
      error: 'Senha deve ter pelo menos 4 caracteres' 
    });
  }

  const password_hash = md5Hash(password);
  const sql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
  
  db.run(sql, [username, password_hash], function(err) {
    if (err && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ 
        success: false, 
        error: 'Usuário já existe' 
      });
    } else if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Usuário criado com sucesso',
      user: { id: this.lastID, username } 
    });
  });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Username e password são obrigatórios' 
    });
  }

  const password_hash = md5Hash(password);
  const sql = 'SELECT id, username FROM users WHERE username = ? AND password_hash = ?';
  
  db.get(sql, [username, password_hash], (err, row) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
    
    if (!row) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciais inválidas' 
      });
    }

    const token = md5Hash(`${username}:${password}:${Date.now()}`);
    
    res.json({ 
      success: true, 
      token, 
      user: { id: row.id, username: row.username } 
    });
  });
});

module.exports = router;
