const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let client = null;
let currentQrCode = null;
let status = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_READY, CONNECTED, FAILED

/**
 * Inicializa o cliente do WhatsApp
 */
function initialize() {
  if (client) return;

  status = 'INITIALIZING';
  console.log('[WPP] Inicializando cliente WhatsApp...');

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
  });

  client.on('qr', (qr) => {
    console.log('[WPP] QR Code recebido. Aguardando leitura...');
    currentQrCode = qr;
    status = 'QR_READY';
  });

  client.on('ready', () => {
    console.log('[WPP] Cliente conectado e pronto!');
    status = 'CONNECTED';
    currentQrCode = null;
  });

  client.on('authenticated', () => {
    console.log('[WPP] Autenticado com sucesso!');
  });

  client.on('auth_failure', msg => {
    console.error('[WPP] Falha na autenticação:', msg);
    status = 'FAILED';
  });

  client.on('disconnected', (reason) => {
    console.log('[WPP] Cliente desconectado:', reason);
    status = 'DISCONNECTED';
    client.initialize(); // Tenta reiniciar para gerar novo QR
  });

  client.initialize().catch(err => {
    console.error('[WPP] Erro ao inicializar:', err);
    status = 'FAILED';
  });
}

/**
 * Retorna o status atual da conexão
 */
async function getStatus() {
  if (!client) {
    initialize();
  }

  let qrDataUrl = null;
  if (status === 'QR_READY' && currentQrCode) {
    try {
      qrDataUrl = await qrcode.toDataURL(currentQrCode);
    } catch (err) {
      console.error('[WPP] Erro ao gerar data URL do QR code', err);
    }
  }

  return {
    status,
    qrCode: qrDataUrl
  };
}

/**
 * Envia uma mensagem via WhatsApp
 * 
 * @param {string} phone Número do destinatário (apenas dígitos, ex: 87988698548)
 * @param {string} message Mensagem de texto
 * @returns {Promise<{success: boolean, response?: string, error?: string}>}
 */
async function sendWhatsApp(phone, message) {
  if (status !== 'CONNECTED' || !client) {
    return { success: false, error: 'WhatsApp não está conectado. Leia o QR Code primeiro.' };
  }

  // Formata o número. Padrão do whatsapp-web.js é ddi+ddd+numero@c.us
  const cleanPhone = phone.replace(/\D/g, '');
  let fullPhone = cleanPhone;

  // Se não tem 55 (Brasil) no começo, adiciona
  if (!fullPhone.startsWith('55') || fullPhone.length <= 11) {
    fullPhone = `55${fullPhone}`;
  }

  try {
    // Obtém o ID correto do número no WhatsApp (resolve o problema do 9º dígito no BR)
    const numberId = await client.getNumberId(fullPhone);
    
    if (!numberId) {
      console.error(`[WPP] Número não registrado no WhatsApp: ${fullPhone}`);
      return { success: false, error: 'O número não está registrado no WhatsApp.' };
    }

    const chatId = numberId._serialized;
    const response = await client.sendMessage(chatId, message);
    return { success: true, response: response.id._serialized };
  } catch (error) {
    console.error(`[WPP] Erro ao enviar para ${fullPhone}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Desconecta e limpa a sessão atual (Logout)
 */
async function logout() {
  if (client) {
    try {
      await client.logout();
    } catch (e) {
      console.error('[WPP] Erro ao fazer logout', e);
    }
    status = 'DISCONNECTED';
    currentQrCode = null;
    // O evento 'disconnected' deve cuidar de reinicializar
  }
  return { success: true };
}

module.exports = { 
  initialize,
  getStatus,
  sendWhatsApp,
  logout
};
