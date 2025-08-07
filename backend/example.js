const db = require('./database');

async function getUserByEmail(email) {
    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        console.log(user);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error.message);
    }
}

async function getAreasByUserId(userId) {
    try {
        const areas = await db.all('SELECT * FROM areas WHERE user_id = ?', [userId]);
        console.log(areas);
    } catch (error) {
        console.error('Erro ao buscar áreas:', error.message);
    }
}

async function getTarefasByAreaId(areaId) {
    try {
        const tarefas = await db.all('SELECT * FROM tarefas WHERE area_id = ?', [areaId]);
        console.log(tarefas);
    } catch (error) {
        console.error('Erro ao buscar tarefas:', error.message);
    }
}

async function getProvasByUserId(userId) {
    try {
        const provas = await db.all('SELECT * FROM provas WHERE user_id = ?', [userId]);
        console.log(provas);
    } catch (error) {
        console.error('Erro ao buscar provas:', error.message);
    }
}

getUserByEmail('exemplo@email.com');
getAreasByUserId(1);
getTarefasByAreaId(1);
getProvasByUserId(1);
