const database = require('../utils/database');

async function createUser(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    return database.query(query, [username, hashedPassword]);
}

async function getUserByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = ?';
    return await database.query(query, [username]);
}

module.exports = { createUser, getUserByUsername };