/**
 * Rotas da API de presença (attendance)
 * Endpoints REST para comunicação com o Google Sheets
 */

const express = require('express');
const router = express.Router();
const sheetsService = require('../services/sheets.service');

/**
 * GET /api/sheets
 * Lista todas as abas disponíveis na planilha
 */
router.get('/sheets', async (req, res) => {
  try {
    const sheetNames = await sheetsService.getSheetNames();
    res.json({ success: true, sheets: sheetNames });
  } catch (error) {
    console.error('Erro ao buscar abas:', error.message);
    res.status(500).json({
      success: false,
      error: 'Não foi possível buscar as abas da planilha.',
      details: error.message,
    });
  }
});

/**
 * GET /api/attendance/:sheetName
 * Retorna todos os dados de presença de uma aba (cabeçalhos + alunos)
 */
router.get('/attendance/:sheetName', async (req, res) => {
  try {
    const { sheetName } = req.params;
    const data = await sheetsService.getAttendanceData(sheetName);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Erro ao buscar dados de presença:', error.message);
    res.status(500).json({
      success: false,
      error: 'Não foi possível buscar os dados de presença.',
      details: error.message,
    });
  }
});

/**
 * POST /api/attendance
 * Atualiza a presença de um aluno
 * Body: { sheetName, rowIndex, colIndex, value }
 */
router.post('/attendance', async (req, res) => {
  try {
    const { sheetName, rowIndex, colIndex, value } = req.body;

    // Validação básica
    if (!sheetName || !rowIndex || colIndex === undefined || !value) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: sheetName, rowIndex, colIndex, value',
      });
    }

    const result = await sheetsService.updateAttendance(
      sheetName,
      Number(rowIndex),
      Number(colIndex),
      value.toUpperCase()
    );

    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar presença:', error.message);
    res.status(500).json({
      success: false,
      error: 'Não foi possível salvar a presença.',
      details: error.message,
    });
  }
});

/**
 * POST /api/attendance/add-date
 * Adiciona uma nova coluna de data na planilha
 * Body: { sheetName, date }
 */
router.post('/attendance/add-date', async (req, res) => {
  try {
    const { sheetName, date } = req.body;

    if (!sheetName || !date) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: sheetName, date',
      });
    }

    const result = await sheetsService.addDateColumn(sheetName, date);
    res.json(result);
  } catch (error) {
    console.error('Erro ao adicionar data:', error.message);
    res.status(500).json({
      success: false,
      error: 'Não foi possível adicionar a nova data.',
      details: error.message,
    });
  }
});

module.exports = router;
