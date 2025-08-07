document.addEventListener('DOMContentLoaded', async () => {
    const usersTableBody = document.querySelector('#usersTable tbody');

    // Função para carregar usuários
    async function loadUsers() {
        try {
            const response = await ApiClient.get('/admin/users');
            usersTableBody.innerHTML = ''; // Limpar tabela

            response.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.nome}</td>
                    <td>${user.email}</td>
                    <td>${new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                    <td>
                        <button class="btn btn-danger" data-id="${user.id}">Excluir</button>
                    </td>
                `;
                usersTableBody.appendChild(row);
            });

            // Adicionar eventos de exclusão
            document.querySelectorAll('.btn-danger').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const userId = e.target.getAttribute('data-id');
                    if (confirm('Tem certeza que deseja excluir este usuário?')) {
                        await deleteUser(userId);
                        loadUsers(); // Recarregar tabela
                    }
                });
            });
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    }

    // Função para excluir usuário
    async function deleteUser(userId) {
        try {
            await ApiClient.delete(`/admin/users/${userId}`);
            alert('Usuário excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            alert('Erro ao excluir usuário.');
        }
    }

    // Carregar usuários ao iniciar
    loadUsers();
});
