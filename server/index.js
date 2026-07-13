/**
 * Entry point do servidor Express
 * Sistema de Chamada Inteligente — Google Sheets
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const attendanceRoutes = require('./routes/attendance');
const notificationRoutes = require('./routes/notifications');
const whatsappRoutes = require('./routes/whatsapp');
const oneRoutes = require('./routes/one');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middlewares
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rota de config (expõe DEFAULT_SHEET_NAME para o frontend)
app.get('/api/config', (req, res) => {
  res.json({
    defaultSheetName: process.env.DEFAULT_SHEET_NAME || '',
    testMode: process.env.TEST_MODE !== 'false',
    wppTestMode: process.env.WPP_TEST_MODE !== 'false',
    wppTestSheetName: process.env.WPP_TEST_SHEET_NAME || 'TESTE NOTIFICACAO WPP',
  });
});

// ============================================
// Tokens válidos em memória
// ============================================
const validTokens = new Map();
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutos

// ============================================
// Rota de autenticação (não protegida)
// ============================================
app.post('/api/auth', (req, res) => {
  const { code } = req.body;
  const accessCode = process.env.ACCESS_CODE || '';

  if (!accessCode) {
    return res.status(500).json({ success: false, error: 'Código de acesso não configurado no servidor.' });
  }

  if (code === accessCode) {
    const token = crypto.randomBytes(32).toString('hex');
    validTokens.set(token, Date.now() + SESSION_DURATION_MS);
    return res.json({ success: true, token });
  }

  return res.status(401).json({ success: false, error: 'Código de acesso inválido.' });
});

// ============================================
// Middleware de autenticação para rotas /api/*
// ============================================
app.use('/api', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token de acesso não fornecido.' });
  }
  const token = authHeader.split(' ')[1];
  const expiresAt = validTokens.get(token);
  if (!expiresAt || Date.now() > expiresAt) {
    if (expiresAt) validTokens.delete(token); // Limpa token expirado
    return res.status(401).json({ success: false, error: 'Sessão expirada. Faça login novamente.' });
  }
  
  // Opcional: Renovar o tempo a cada ação (inativity timeout)
  // validTokens.set(token, Date.now() + SESSION_DURATION_MS);
  
  next();
});

// ============================================
// Rotas da API (protegidas pelo middleware acima)
// ============================================
app.use('/api', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/one', oneRoutes);

// ============================================
// Rota catch-all para SPA (retorna index.html)
// ============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ============================================
// Inicialização
// ============================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🎯 Sistema de Chamada Inteligente      ║');
  console.log('║                                          ║');
  console.log(`║   Servidor rodando na porta ${PORT}          ║`);
  console.log(`║   http://localhost:${PORT}                  ║`);
  console.log('║                                          ║');
  console.log('║   Integrado com Google Sheets API v4     ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // Verifica se as variáveis de ambiente estão configuradas
  const requiredVars = ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'SPREADSHEET_ID'];
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.warn('⚠️  ATENÇÃO: Variáveis de ambiente não configuradas:');
    missing.forEach((v) => console.warn(`   - ${v}`));
    console.warn('');
    console.warn('   Copie .env.example para .env e preencha os valores.');
    console.warn('   O frontend funcionará, mas as chamadas à API falharão.');
    console.warn('');
  } else {
    console.log('✅ Todas as variáveis de ambiente configuradas.');
    console.log('');
  }

  // Inicializa o cliente do WhatsApp em background
  const whatsappService = require('./services/whatsapp.service');
  whatsappService.initialize();
});
