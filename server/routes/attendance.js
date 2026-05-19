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

/**
 * GET /api/geral-sheets
 * Lista todas as abas disponíveis para Chamada Geral
 */
router.get('/geral-sheets', async (req, res) => {
  try {
    const sheetNames = await sheetsService.getGeralSheetNames();
    res.json({ success: true, sheets: sheetNames });
  } catch (error) {
    console.error('Erro ao buscar abas gerais:', error.message);
    res.status(500).json({
      success: false,
      error: 'Não foi possível buscar as abas de chamada geral.',
      details: error.message,
    });
  }
});

/**
 * GET /api/geral/:sheetName
 * Retorna dados da aba Geral
 */
router.get('/geral/:sheetName', async (req, res) => {
  try {
    const { sheetName } = req.params;
    const data = await sheetsService.getGeralData(sheetName);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Erro ao buscar dados da chamada geral:', error.message);
    res.status(500).json({
      success: false,
      error: 'Não foi possível buscar os dados.',
      details: error.message,
    });
  }
});

/**
 * POST /api/geral
 * Atualiza um valor numérico de P ou F para uma disciplina
 */
router.post('/geral', async (req, res) => {
  try {
    const { sheetName, rowIndex, subjectName, type, value } = req.body;

    if (!sheetName || !rowIndex || !subjectName || !type || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: sheetName, rowIndex, subjectName, type, value',
      });
    }

    const result = await sheetsService.updateGeralAttendance(
      sheetName,
      Number(rowIndex),
      subjectName,
      type,
      Number(value)
    );

    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar chamada geral:', error.message);
    res.status(500).json({
      success: false,
      error: 'Não foi possível salvar.',
      details: error.message,
    });
  }
});

/**
 * GET /api/financeiro-sheets
 * Lista todas as abas de Financeiro
 */
router.get('/financeiro-sheets', async (req, res) => {
  try {
    const sheetNames = await sheetsService.getFinanceiroSheetNames();
    res.json({ success: true, sheets: sheetNames });
  } catch (error) {
    console.error('Erro ao buscar abas do financeiro:', error.message);
    res.status(500).json({
      success: false,
      error: 'Não foi possível buscar as abas do financeiro.',
      details: error.message,
    });
  }
});

/**
 * GET /api/financeiro/:sheetName
 * Retorna dados da aba de Financeiro
 */
router.get('/financeiro/:sheetName', async (req, res) => {
  try {
    const { sheetName } = req.params;
    const data = await sheetsService.getFinanceiroData(sheetName);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Erro ao buscar dados do financeiro:', error.message);
    res.status(500).json({
      success: false,
      error: 'Não foi possível buscar os dados do financeiro.',
      details: error.message,
    });
  }
});

/**
 * POST /api/financeiro/update
 * Atualiza um campo (Data de Vencimento ou Data de Pagamento)
 */
router.post('/financeiro/update', async (req, res) => {
  try {
    const { sheetName, rowIndex, colIndex, value } = req.body;

    if (!sheetName || !rowIndex || colIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: sheetName, rowIndex, colIndex',
      });
    }

    const result = await sheetsService.updateFinanceiroField(
      sheetName,
      Number(rowIndex),
      Number(colIndex),
      value || ''
    );

    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar financeiro:', error.message);
    res.status(500).json({
      success: false,
      error: 'Não foi possível salvar a atualização no financeiro.',
      details: error.message,
    });
  }
});

/**
 * GET /api/matriculados-sheets
 * Lista todas as abas de Matriculados
 */
router.get('/matriculados-sheets', async (req, res) => {
  try {
    const sheetNames = await sheetsService.getMatriculadosSheetNames();
    res.json({ success: true, sheets: sheetNames });
  } catch (error) {
    console.error('Erro ao buscar abas de matriculados:', error.message);
    res.status(500).json({
      success: false,
      error: 'Não foi possível buscar as abas de matriculados.',
      details: error.message,
    });
  }
});

/**
 * GET /api/matriculados/:sheetName
 * Retorna dados da aba de Matriculados (nome, email, celular)
 */
router.get('/matriculados/:sheetName', async (req, res) => {
  try {
    const { sheetName } = req.params;
    const data = await sheetsService.getMatriculadosData(sheetName);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Erro ao buscar dados de matriculados:', error.message);
    res.status(500).json({
      success: false,
      error: 'Não foi possível buscar os dados de matriculados.',
      details: error.message,
    });
  }
});

module.exports = router;
