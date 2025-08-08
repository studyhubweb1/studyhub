const crypto = require('crypto');

function md5Hash(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação necessário' 
    });
  }
  next();
}

module.exports = { md5Hash, authMiddleware };
