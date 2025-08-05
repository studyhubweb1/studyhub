const nodemailer = require('nodemailer');
const db = require('../database');

class EmailService {
    constructor() {
        // Configurar transportador de e-mail
        // Para desenvolvimento, use um serviço como Ethereal Email ou configure com Gmail
        this.transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
                pass: process.env.SMTP_PASS || 'ethereal.pass'
            }
        });

        // Para produção, configure com um provedor real:
        // Gmail: smtp.gmail.com, porta 587
        // Outlook: smtp-mail.outlook.com, porta 587
        // SendGrid, Mailgun, etc.
    }

    async sendReminderEmail(userEmail, userName, prova) {
        try {
            const dataFormatada = new Date(prova.data).toLocaleDateString('pt-BR');
            
            const mailOptions = {
                from: process.env.FROM_EMAIL || 'noreply@estudohub.com',
                to: userEmail,
                subject: `🔔 Lembrete: ${prova.titulo}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">📚 EstudoHub - Lembrete de Prova</h2>
                        <p>Olá, <strong>${userName}</strong>!</p>
                        <p>Este é um lembrete sobre sua prova:</p>
                        
                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #1f2937; margin: 0 0 10px 0;">📝 ${prova.titulo}</h3>
                            <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${dataFormatada}</p>
                            ${prova.descricao ? `<p style="margin: 5px 0;"><strong>📋 Descrição:</strong> ${prova.descricao}</p>` : ''}
                        </div>
                        
                        <p>Boa sorte nos seus estudos! 🎯</p>
                        
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                        <p style="font-size: 12px; color: #6b7280;">
                            Este é um lembrete automático do EstudoHub.<br>
                            Para gerenciar seus lembretes, acesse: <a href="http://localhost:3000">EstudoHub</a>
                        </p>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ E-mail enviado para ${userEmail}:`, result.messageId);
            return true;

        } catch (error) {
            console.error(`❌ Erro ao enviar e-mail para ${userEmail}:`, error);
            return false;
        }
    }

    async checkAndSendReminders() {
        try {
            const agora = new Date();
            const doisDias = new Date();
            doisDias.setDate(doisDias.getDate() + 2);
            
            // Buscar provas que precisam de lembrete (2 dias antes)
            const provasLembrete = await db.all(`
                SELECT p.*, u.nome, u.email
                FROM provas p
                INNER JOIN users u ON p.user_id = u.id
                WHERE p.data = ? AND p.lembrete_enviado = 0
            `, [doisDias.toISOString().split('T')[0]]);

            // Buscar provas do dia (lembrete do dia)
            const provasHoje = await db.all(`
                SELECT p.*, u.nome, u.email
                FROM provas p
                INNER JOIN users u ON p.user_id = u.id
                WHERE p.data = ?
            `, [agora.toISOString().split('T')[0]]);

            // Enviar lembretes de 2 dias antes
            for (const prova of provasLembrete) {
                const sucesso = await this.sendReminderEmail(prova.email, prova.nome, prova);
                if (sucesso) {
                    await db.run(
                        'UPDATE provas SET lembrete_enviado = 1 WHERE id = ?',
                        [prova.id]
                    );
                }
            }

            // Enviar lembretes do dia (apenas às 8h)
            if (agora.getHours() === 8) {
                for (const prova of provasHoje) {
                    await this.sendReminderEmail(prova.email, prova.nome, prova);
                }
            }

            if (provasLembrete.length > 0 || (provasHoje.length > 0 && agora.getHours() === 8)) {
                console.log(`📧 Verificação de lembretes concluída. Enviados: ${provasLembrete.length + (agora.getHours() === 8 ? provasHoje.length : 0)} e-mails.`);
            }

        } catch (error) {
            console.error('❌ Erro na verificação de lembretes:', error);
        }
    }

    startReminderService() {
        console.log('🔔 Serviço de lembretes iniciado');
        
        // Verificar a cada hora
        setInterval(() => {
            this.checkAndSendReminders();
        }, 60 * 60 * 1000); // 1 hora

        // Verificar imediatamente ao iniciar
        this.checkAndSendReminders();
    }
}

module.exports = new EmailService();