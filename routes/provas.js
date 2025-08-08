const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../utils');

router.use(authMiddleware);

// Listar provas do usuário
router.get('/', (req, res) => {
  const user_id = req.query.user_id;
  
  if (!user_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'user_id é obrigatório' 
    });
  }

  const sql = `
    SELECT p.*, a.nome as area_nome, a.cor as area_cor 
    FROM provas p 
    LEFT JOIN areas a ON p.area_id = a.id 
    WHERE p.user_id = ? 
    ORDER BY p.data_prova ASC
  `;
  
  db.all(sql, [user_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar provas' 
      });
    }
    
    res.json({ success: true, provas: rows });
  });
});

// Criar prova
router.post('/', (req, res) => {
  const { nome, descricao, data_prova, area_id, user_id } = req.body;
  
  if (!nome || !data_prova || !user_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Nome, data da prova e user_id são obrigatórios' 
    });
  }

  const sql = 'INSERT INTO provas (nome, descricao, data_prova, area_id, user_id) VALUES (?, ?, ?, ?, ?)';
  
  db.run(sql, [nome, descricao || '', data_prova, area_id || null, user_id], function(err) {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao criar prova' 
      });
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Prova criada com sucesso',
      prova: { 
        id: this.lastID, 
        nome, 
        descricao: descricao || '', 
        data_prova,
        area_id: area_id || null,
        status: 'nao_estudado',
        lembrete_ativo: 1,
        user_id 
      } 
    });
  });
});

// Atualizar status da prova
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['nao_estudado', 'estudando', 'concluido'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Status inválido' 
    });
  }

  const sql = 'UPDATE provas SET status = ? WHERE id = ?';
  db.run(sql, [status, id], function(err) {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao atualizar status' 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prova não encontrada' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Status atualizado com sucesso' 
    });
  });
});

// Deletar prova
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM provas WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao deletar prova' 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prova não encontrada' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Prova deletada com sucesso' 
    });
  });
});

// Buscar provas próximas (para lembretes)
router.get('/proximas', (req, res) => {
  const user_id = req.query.user_id;
  const dias = req.query.dias || 7; // Próximos 7 dias por padrão
  
  if (!user_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'user_id é obrigatório' 
    });
  }

  const sql = `
    SELECT p.*, a.nome as area_nome, a.cor as area_cor 
    FROM provas p 
    LEFT JOIN areas a ON p.area_id = a.id 
    WHERE p.user_id = ? 
    AND p.lembrete_ativo = 1
    AND date(p.data_prova) BETWEEN date('now') AND date('now', '+${dias} days')
    ORDER BY p.data_prova ASC
  `;
  
  db.all(sql, [user_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar provas próximas' 
      });
    }
    
    res.json({ success: true, provas: rows });
  });
});

module.exports = router;
