/**
 * Rotas da API — ONE Voice
 * Endpoints para gestão da planilha dedicada do curso ONE
 */

const express = require('express');
const router = express.Router();
const oneService = require('../services/one-sheets.service');

/**
 * POST /api/one/setup
 * Inicializa a planilha ONE: cria abas, popula alunos e primeira data (13/07)
 */
router.post('/setup', async (req, res) => {
  try {
    const result = await oneService.setupOneSpreadsheet();
    res.json(result);
  } catch (error) {
    console.error('[ONE] Erro no setup:', error.message);
    res.status(500).json({ success: false, error: 'Falha ao configurar planilha ONE.', details: error.message });
  }
});

/**
 * GET /api/one/students?turma=Turma+1
 * Lista alunos. Se ?turma= for enviado, filtra por turma.
 */
router.get('/students', (req, res) => {
  try {
    const { turma } = req.query;
    const data = oneService.getOneStudents(turma || null);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('[ONE] Erro ao buscar alunos:', error.message);
    res.status(500).json({ success: false, error: 'Falha ao buscar alunos.', details: error.message });
  }
});

/**
 * GET /api/one/attendance/:turma
 * Retorna datas e presença dos alunos de uma turma.
 * :turma deve ser "Turma 1" ou "Turma 2" (URL-encoded)
 */
router.get('/attendance/:turma', async (req, res) => {
  try {
    const turma = decodeURIComponent(req.params.turma);
    if (!['Turma 1', 'Turma 2'].includes(turma)) {
      return res.status(400).json({ success: false, error: 'Turma inválida. Use "Turma 1" ou "Turma 2".' });
    }
    const data = await oneService.getOneAttendance(turma);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('[ONE] Erro ao buscar chamada:', error.message);
    res.status(500).json({ success: false, error: 'Falha ao buscar chamada.', details: error.message });
  }
});

/**
 * POST /api/one/attendance
 * Salva P ou F de um aluno.
 * Body: { turma, rowIndex, dateIndex, value }
 */
router.post('/attendance', async (req, res) => {
  try {
    const { turma, rowIndex, dateIndex, value } = req.body;

    if (!turma || rowIndex === undefined || dateIndex === undefined || !value) {
      return res.status(400).json({ success: false, error: 'Campos obrigatórios: turma, rowIndex, dateIndex, value' });
    }

    if (!['P', 'F'].includes(value.toUpperCase())) {
      return res.status(400).json({ success: false, error: 'Valor inválido. Use "P" ou "F".' });
    }

    const result = await oneService.updateOneAttendance(
      turma,
      Number(rowIndex),
      Number(dateIndex),
      value.toUpperCase()
    );

    res.json(result);
  } catch (error) {
    console.error('[ONE] Erro ao salvar presença:', error.message);
    res.status(500).json({ success: false, error: 'Falha ao salvar presença.', details: error.message });
  }
});

/**
 * POST /api/one/attendance/add-date
 * Adiciona nova coluna de data.
 * Body: { turma, date }  — turma pode ser "Turma 1", "Turma 2" ou "ambas"
 */
router.post('/attendance/add-date', async (req, res) => {
  try {
    const { turma, date } = req.body;

    if (!turma || !date) {
      return res.status(400).json({ success: false, error: 'Campos obrigatórios: turma, date' });
    }

    const result = await oneService.addOneDate(turma, date);
    res.json(result);
  } catch (error) {
    console.error('[ONE] Erro ao adicionar data:', error.message);
    res.status(500).json({ success: false, error: 'Falha ao adicionar data.', details: error.message });
  }
});

module.exports = router;
