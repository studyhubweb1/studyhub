Documentação Completa — StudyHub

1. Visão Geral

O StudyHub é um sistema web para gerenciamento e organização de estudos, desenvolvido para ser simples, responsivo e acessível em qualquer dispositivo.
Seu objetivo é permitir que o usuário cadastre áreas de estudo, organize aulas e tarefas, registre provas e prazos e receba lembretes automáticos por e-mail.

⸻

2. Objetivos
	•	Centralizar todas as informações de estudo em um único sistema
	•	Proporcionar organização visual por checklist e calendário
	•	Facilitar o acompanhamento de prazos e provas
	•	Enviar lembretes automáticos ao usuário
	•	Permitir expansão futura (WhatsApp, relatórios avançados, etc.)

⸻

3. Público-Alvo
	•	Estudantes universitários
	•	Autodidatas que estudam múltiplos temas
	•	Pessoas com diversas áreas de estudo simultâneas

⸻

4. Requisitos Funcionais (RF)

Código	Descrição
RF01	O sistema deve permitir login e autenticação de usuários.
RF02	O usuário pode cadastrar, editar e excluir Áreas de Estudo.
RF03	O usuário pode criar, marcar como concluída e excluir Tarefas/Aulas associadas a uma Área.
RF04	O usuário pode cadastrar Provas/Prazos com data e descrição.
RF05	O sistema deve exibir um calendário interativo com as provas/prazos.
RF06	O sistema deve enviar lembretes por e-mail antes da data da prova/prazo.
RF07	O dashboard deve exibir: quantidade de tarefas concluídas/pendentes por área, área mais estudada, próximos eventos.


⸻

5. Requisitos Não Funcionais (RNF)

Código	Descrição
RNF01	O sistema será desenvolvido com Node.js (Express) no back-end e HTML, CSS e JS puro no front-end.
RNF02	O banco de dados será SQLite, armazenando dados localmente no servidor.
RNF03	O sistema deve ser responsivo e funcionar em desktops, tablets e celulares.
RNF04	A arquitetura deve ser modular, permitindo expansões futuras.
RNF05	O envio de e-mails será implementado usando Nodemailer.


⸻

6. Arquitetura do Sistema

EstudoHub/
│
├── /backend
│   ├── server.js          # Servidor Express
│   ├── database.js        # Conexão com SQLite
│   ├── routes/            # Rotas da aplicação
│   │   ├── auth.js        # Autenticação
│   │   ├── areas.js       # CRUD áreas de estudo
│   │   ├── tarefas.js     # CRUD tarefas/aulas
│   │   ├── provas.js      # CRUD provas/prazos
│   ├── models/            # Modelos do banco
│   │   ├── Area.js
│   │   ├── Tarefa.js
│   │   ├── Prova.js
│   ├── utils/
│       ├── mailer.js      # Envio de e-mails
│
├── /frontend
│   ├── index.html         # Página inicial / login
│   ├── dashboard.html     # Painel geral
│   ├── areas.html         # Lista de áreas
│   ├── tarefas.html       # Lista de tarefas
│   ├── provas.html        # Lista e calendário
│   ├── css/
│   │   ├── style.css
│   ├── js/
│       ├── main.js
│       ├── dashboard.js
│       ├── areas.js
│       ├── tarefas.js
│       ├── provas.js
│
├── package.json
├── README.md


⸻

7. Modelagem do Banco de Dados

Tabela: users

Campo	Tipo	Descrição
id	INTEGER (PK)	ID do usuário
nome	TEXT	Nome completo
email	TEXT (UNIQUE)	E-mail do usuário
senha	TEXT	Senha criptografada

Tabela: areas

Campo	Tipo
id	INTEGER (PK)
nome	TEXT
descricao	TEXT
user_id	INTEGER (FK)

Tabela: tarefas

Campo	Tipo
id	INTEGER (PK)
titulo	TEXT
concluida	BOOLEAN
area_id	INTEGER (FK)

Tabela: provas

Campo	Tipo
id	INTEGER (PK)
titulo	TEXT
data	DATE
descricao	TEXT
user_id	INTEGER (FK)


⸻

8. Fluxo de Funcionalidades

Fluxo 1 — Login
	1.	Usuário acessa página inicial
	2.	Insere e-mail e senha
	3.	Sistema valida no banco
	4.	Redireciona para Dashboard

Fluxo 2 — Criar Área de Estudo
	1.	Usuário abre tela de Áreas
	2.	Clica em “Nova Área”
	3.	Insere nome e descrição
	4.	Sistema salva no banco

Fluxo 3 — Criar Tarefa/Aula
	1.	Seleciona Área
	2.	Clica em “Nova Tarefa”
	3.	Insere título
	4.	Marca como concluída quando terminar

Fluxo 4 — Criar Prova/Prazo
	1.	Clica em “Nova Prova”
	2.	Preenche título, data e descrição
	3.	Evento aparece no calendário
	4.	Sistema agenda e-mail de lembrete

⸻

9. Prazos de Lembrete
	•	Enviar e-mail 2 dias antes do evento
	•	Enviar e-mail no dia do evento às 08h

⸻

10. Dashboard
	•	Cards com:
	•	Total de tarefas concluídas e pendentes
	•	Área mais estudada (maior número de tarefas concluídas)
	•	Próximas 3 provas/prazos
	•	Gráfico de barras com tarefas por área (JS puro ou Chart.js)

⸻

11. Segurança
	•	Criptografia de senhas com bcrypt
	•	Sanitização de inputs para evitar SQL Injection
	•	Proteção de rotas por autenticação (JWT ou sessão)

⸻

12. Melhorias Futuras
	•	Lembrete via WhatsApp
	•	Modo offline (PWA)
	•	Relatórios de desempenho
	•	Exportar dados para Excel/PDF

⸻
