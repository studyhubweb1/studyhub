const db = require('./database');

async function listarUsuarios() {
    try {
        const usuarios = await db.all('SELECT id, nome, email, senha, created_at FROM users');
        console.log('Usuários cadastrados:');
        usuarios.forEach((usuario) => {
            console.log(`ID: ${usuario.id}, Nome: ${usuario.nome}, E-mail: ${usuario.email}, Senha (hash): ${usuario.senha}, Criado em: ${usuario.created_at}`);
        });
    } catch (error) {
        console.error('Erro ao listar usuários:', error.message);
    }
}

listarUsuarios();
