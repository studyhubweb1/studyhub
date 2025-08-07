const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'estudohub.sqlite'), (err) => {
            if (err) {
                console.error('Erro ao conectar com o banco de dados:', err.message);
            } else {
                console.log('Conectado ao banco SQLite.');
                this.initTables();
                this.createAdminUser(); // Criar usuário administrador
            }
        });
    }

    initTables() {
        // Tabela de usuários
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de áreas de estudo
        this.db.run(`
            CREATE TABLE IF NOT EXISTS areas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                descricao TEXT,
                user_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Tabela de tarefas
        this.db.run(`
            CREATE TABLE IF NOT EXISTS tarefas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                concluida BOOLEAN DEFAULT 0,
                area_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
            )
        `);

        // Tabela de provas/prazos
        this.db.run(`
            CREATE TABLE IF NOT EXISTS provas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                data DATE NOT NULL,
                descricao TEXT,
                user_id INTEGER NOT NULL,
                lembrete_enviado BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Tabelas inicializadas com sucesso.');
    }

    async createAdminUser() {
        const adminEmail = 'admin@studyhub.com';
        const adminPassword = 'admin'; // Senha padrão
        const saltRounds = 10;

        try {
            const adminExists = await this.get('SELECT id FROM users WHERE email = ?', [adminEmail]);
            if (!adminExists) {
                const hash = await bcrypt.hash(adminPassword, saltRounds);
                await this.run(
                    'INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)',
                    ['Admin', adminEmail, hash]
                );
                console.log('Usuário administrador criado com sucesso.');
            } else {
                console.log('Usuário administrador já existe.');
            }
        } catch (error) {
            console.error('Erro ao criar usuário administrador:', error.message);
        }
    }

    // Métodos de execução
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getAllUsers() {
        return this.all('SELECT id, nome, email, created_at FROM users');
    }

    deleteUserById(userId) {
        return this.run('DELETE FROM users WHERE id = ?', [userId]);
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = new Database();