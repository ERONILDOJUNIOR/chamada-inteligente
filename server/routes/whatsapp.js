const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsapp.service');

// Retorna o status atual da conexão e o QR Code se estiver em modo de pareamento
router.get('/status', async (req, res) => {
  try {
    const statusData = await whatsappService.getStatus();
    res.json({ success: true, ...statusData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Desconecta o WhatsApp
router.post('/logout', async (req, res) => {
  try {
    const result = await whatsappService.logout();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
