const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../utils');

// Aplicar middleware de autenticação
router.use(authMiddleware);

// Listar áreas
router.get('/', (req, res) => {
  const user_id = req.query.user_id;
  
  if (!user_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'user_id é obrigatório' 
    });
  }

  const sql = 'SELECT id, nome, descricao, cor, created_at FROM areas WHERE user_id = ? ORDER BY created_at DESC';
  
  db.all(sql, [user_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar áreas' 
      });
    }
    
    res.json({ success: true, areas: rows });
  });
});

// Criar área
router.post('/', (req, res) => {
  const { nome, descricao, cor, user_id } = req.body;
  
  if (!nome || !user_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Nome e user_id são obrigatórios' 
    });
  }

  const sql = 'INSERT INTO areas (nome, descricao, cor, user_id) VALUES (?, ?, ?, ?)';
  
  db.run(sql, [nome, descricao || '', cor || '#3498db', user_id], function(err) {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao criar área' 
      });
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Área criada com sucesso',
      area: { 
        id: this.lastID, 
        nome, 
        descricao: descricao || '', 
        cor: cor || '#3498db',
        user_id 
      } 
    });
  });
});

// Deletar área
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM areas WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao deletar área' 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Área não encontrada' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Área deletada com sucesso' 
    });
  });
});

module.exports = router;
