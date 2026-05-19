const nodemailer = require('nodemailer');
const dns = require('dns');
require('dotenv').config();

// Forçar Node.js a priorizar IPv4 sobre IPv6 para evitar problemas de rede (ENETUNREACH/ETIMEDOUT) no Render
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Configuração do transporter (exemplo usando Gmail/SMTP padrão)
// O ideal é utilizar EMAIL_USER e EMAIL_PASS no .env
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou especifique host/port para outro serviço
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

/**
 * Envia uma notificação por e-mail, forçando o envio para um e-mail de teste
 * em ambiente de desenvolvimento ou se a flag TEST_MODE for true.
 * 
 * @param {string} to Destinatário real (será ignorado em modo teste)
 * @param {string} subject Assunto do e-mail
 * @param {string} htmlBody Corpo do e-mail em HTML
 * @returns {Promise<boolean>} Sucesso do envio
 */
async function sendNotification(to, subject, htmlBody) {
  // A pedido do usuário, apenas preparaumadsal@gmail.com deve receber durante os testes
  const TEST_EMAIL = 'preparaumadsal@gmail.com';
  
  // Vamos sempre usar modo de teste por segurança até o usuário desabilitar no .env no futuro
  const isTestMode = process.env.TEST_MODE !== 'false'; 
  
  const finalRecipient = isTestMode ? TEST_EMAIL : to;

  const prefix = isTestMode ? `[TESTE - Destino Original: ${to}] ` : '';

  const mailOptions = {
    from: `"Prepara UMADSAL" <${process.env.EMAIL_USER}>`,
    to: finalRecipient,
    subject: `${prefix}${subject}`,
    html: htmlBody,
  };

  try {
    // Se não tiver credenciais, apenas simula o sucesso (evita crash)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(`\n[EMAIL MOCK] Email que seria enviado para ${finalRecipient}`);
      console.warn(`Assunto: ${mailOptions.subject}`);
      console.warn(`Por favor, configure EMAIL_USER e EMAIL_PASS no .env para envios reais.\n`);
      return true; // Fake success
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email enviado: ${info.messageId} para ${finalRecipient}`);
    return true;
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${finalRecipient}:`, error);
    throw error;
  }
}

module.exports = {
  sendNotification,
};
