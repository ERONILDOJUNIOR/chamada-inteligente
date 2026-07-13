/**
 * Serviço ONE Voice — Integração com a planilha dedicada do curso ONE
 *
 * Planilha: https://docs.google.com/spreadsheets/d/1nUOwzPJmIGVbdletWwApja_NNlhQ0yhytCN0gjyGQxU/
 *
 * Estrutura das abas:
 *   - ALUNOS        : N° | Nome | Turma | Telefone | Data Matrícula
 *   - CHAMADA TURMA 1 : N° | Nome | Telefone | <datas das segundas>...
 *   - CHAMADA TURMA 2 : N° | Nome | Telefone | <datas das segundas>...
 */

const { google } = require('googleapis');
require('dotenv').config();

const { columnIndexToLetter } = require('../utils/helpers');

// -------------------------------------------------------
// Dados dos alunos matriculados (fonte de verdade fixa)
// -------------------------------------------------------
const ALUNOS = [
  // Turma 1 — 18h às 19:30h
  { num: 1,  nome: 'Sarah Borba De Almeida',               turma: 'Turma 1', telefone: '71999534684',  dataMatricula: '17/06/2026' },
  { num: 2,  nome: 'Gabrieli Marques da Hora',             turma: 'Turma 1', telefone: '71999508508',  dataMatricula: '17/06/2026' },
  { num: 3,  nome: 'Jaqueline da Silva Oliveira',          turma: 'Turma 1', telefone: '71987787228',  dataMatricula: '18/06/2026' },
  { num: 4,  nome: 'Raquel Bispo Conceição dos Santos',    turma: 'Turma 1', telefone: '71986983648',  dataMatricula: '18/06/2026' },
  { num: 5,  nome: 'Ester Almeida Calmon do Nascimento',   turma: 'Turma 1', telefone: '71983430612',  dataMatricula: '18/06/2026' },
  { num: 6,  nome: 'Isaac Bispo Conceição dos Santos',     turma: 'Turma 1', telefone: '71986784688',  dataMatricula: '28/06/2026' },
  { num: 7,  nome: 'Hellen Cristina Santos de Souza',      turma: 'Turma 1', telefone: '71985222595',  dataMatricula: '09/07/2026' },
  // Turma 2 — 19:30h às 21h
  { num: 1,  nome: 'Juliete Yasmin Pereira dos Santos',    turma: 'Turma 2', telefone: '71987032783',  dataMatricula: '17/06/2026' },
  { num: 2,  nome: 'Nilfa França Passos',                  turma: 'Turma 2', telefone: '71987389665',  dataMatricula: '18/06/2026' },
  { num: 3,  nome: 'Mariana Santos Andrade',               turma: 'Turma 2', telefone: '71986324706',  dataMatricula: '30/06/2026' },
  { num: 4,  nome: 'Rafael Souza de Campos',               turma: 'Turma 2', telefone: '719922219705', dataMatricula: '02/07/2026' },
  { num: 5,  nome: 'Diná Hevellyn dos Santos Natividade',  turma: 'Turma 2', telefone: '71986570814',  dataMatricula: '09/07/2026' },
];

// Coluna de início das datas (0-based: D = col 3)
const DATE_START_COL = 3;
// Linha do cabeçalho (1-based no Sheets)
const HEADER_ROW = 1;
// Primeira linha de dados
const DATA_START_ROW = 2;

// -------------------------------------------------------
// Auth client — usa a MESMA service account mas planilha diferente
// -------------------------------------------------------
function getSheetsClient() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  return google.sheets({ version: 'v4', auth });
}

function getSpreadsheetId() {
  return process.env.ONE_SPREADSHEET_ID;
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

/**
 * Retorna nomes de todas as abas da planilha ONE
 */
async function getSheetNames() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const resp = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
  return resp.data.sheets.map(s => s.properties.title);
}

/**
 * Garante que uma aba exista; cria se necessário.
 * @returns {number} sheetId da aba
 */
async function ensureSheet(sheetName) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const resp = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = resp.data.sheets.find(s => s.properties.title === sheetName);
  if (existing) return existing.properties.sheetId;

  const addResp = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  });
  return addResp.data.replies[0].addSheet.properties.sheetId;
}

// -------------------------------------------------------
// Setup — inicializa as 3 abas e popula com dados
// -------------------------------------------------------

/**
 * Configura toda a planilha ONE:
 * - Cria abas "ALUNOS", "CHAMADA TURMA 1", "CHAMADA TURMA 2" se não existirem
 * - Popula os alunos e cabeçalhos
 * - Adiciona a primeira data (13/07) nas abas de chamada
 */
async function setupOneSpreadsheet() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // 1. Garantir que as abas existam
  await ensureSheet('ALUNOS');
  await ensureSheet('CHAMADA TURMA 1');
  await ensureSheet('CHAMADA TURMA 2');

  // 2. Popular aba ALUNOS
  const alunosHeader = [['N°', 'Nome', 'Turma', 'Telefone', 'Data Matrícula']];
  const alunosRows = ALUNOS.map(a => [a.num, a.nome, a.turma, `'${a.telefone}`, a.dataMatricula]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'ALUNOS'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [...alunosHeader, ...alunosRows] },
  });

  // 3. Popular abas de chamada (Turma 1 e Turma 2)
  for (const turma of ['Turma 1', 'Turma 2']) {
    const sheetName = turma === 'Turma 1' ? 'CHAMADA TURMA 1' : 'CHAMADA TURMA 2';
    const turmaAlunos = ALUNOS.filter(a => a.turma === turma);

    const header = [['N°', 'Nome', 'Telefone', '13/07']];
    const rows = turmaAlunos.map(a => [a.num, a.nome, `'${a.telefone}`, '']);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [...header, ...rows] },
    });
  }

  return { success: true, message: 'Planilha ONE configurada com sucesso!' };
}

// -------------------------------------------------------
// Leitura de alunos
// -------------------------------------------------------

/**
 * Retorna os alunos cadastrados lendo diretamente da aba ALUNOS na planilha
 * Pode ser filtrado por turma.
 * @param {string|null} turma - 'Turma 1', 'Turma 2' ou null para todos
 */
async function getOneStudents(turma = null) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'ALUNOS'`,
  });

  const rows = response.data.values || [];
  if (rows.length < 2) {
    return { students: [] };
  }

  // Cabeçalho: N° | Nome | Turma | Telefone | Data Matrícula
  const students = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const num = parseInt(row[0], 10) || i;
    const nome = (row[1] || '').trim();
    const t = (row[2] || '').trim();
    const telefone = (row[3] || '').trim().replace(/^'/, '');
    const dataMatricula = (row[4] || '').trim();

    if (!nome) continue;

    students.push({
      num,
      nome,
      turma: t,
      telefone,
      dataMatricula
    });
  }

  const lista = turma ? students.filter(a => a.turma === turma) : students;
  return { students: lista };
}

// -------------------------------------------------------
// Leitura de chamada
// -------------------------------------------------------

/**
 * Lê os dados de chamada de uma turma
 * @param {'Turma 1'|'Turma 2'} turma
 * @returns {{ dates: string[], students: Array<{name, rowIndex, phone, attendance}> }}
 */
async function getOneAttendance(turma) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetName = turma === 'Turma 1' ? 'CHAMADA TURMA 1' : 'CHAMADA TURMA 2';

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'`,
  });

  const rows = response.data.values || [];

  if (rows.length < 1) {
    return { dates: [], students: [] };
  }

  // Linha 0 (cabeçalho): N° | Nome | Telefone | data1 | data2 | ...
  const headerRow = rows[0] || [];
  const dates = [];
  for (let c = DATE_START_COL; c < headerRow.length; c++) {
    const val = (headerRow[c] || '').trim();
    if (val) dates.push(val);
  }

  const students = [];
  for (let i = DATA_START_ROW - 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const numCell = (row[0] || '').toString().trim();
    const nameCell = (row[1] || '').trim();
    const phoneCell = (row[2] || '').trim();

    if (!nameCell || !numCell) continue;

    const attendance = {};
    for (let j = 0; j < dates.length; j++) {
      const colIdx = DATE_START_COL + j;
      attendance[dates[j]] = (row[colIdx] || '').trim().toUpperCase();
    }

    students.push({
      num: parseInt(numCell, 10),
      name: nameCell,
      phone: phoneCell,
      rowIndex: i + 1, // 1-based (Sheets)
      attendance,
    });
  }

  return { dates, students };
}

// -------------------------------------------------------
// Atualização de presença
// -------------------------------------------------------

/**
 * Atualiza P ou F de um aluno em uma data específica
 * @param {'Turma 1'|'Turma 2'} turma
 * @param {number} rowIndex - linha 1-based na planilha
 * @param {number} dateIndex - índice da data (0-based dentro das datas)
 * @param {'P'|'F'} value
 */
async function updateOneAttendance(turma, rowIndex, dateIndex, value) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetName = turma === 'Turma 1' ? 'CHAMADA TURMA 1' : 'CHAMADA TURMA 2';

  // Coluna real = DATE_START_COL + dateIndex (0-based) → converter para letra
  const realColIndex = DATE_START_COL + dateIndex;
  const colLetter = columnIndexToLetter(realColIndex);
  const cellRange = `'${sheetName}'!${colLetter}${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  });

  return { success: true, message: `${cellRange} = ${value}` };
}

// -------------------------------------------------------
// Adicionar nova data
// -------------------------------------------------------

/**
 * Adiciona uma nova coluna de data nas abas de chamada
 * @param {'Turma 1'|'Turma 2'|'ambas'} turma
 * @param {string} dateStr - ex: "20/07"
 */
async function addOneDate(turma, dateStr) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const turmasToUpdate = turma === 'ambas'
    ? ['Turma 1', 'Turma 2']
    : [turma];

  const results = [];

  for (const t of turmasToUpdate) {
    const sheetName = t === 'Turma 1' ? 'CHAMADA TURMA 1' : 'CHAMADA TURMA 2';

    // Lê o cabeçalho para descobrir próxima coluna disponível
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!1:1`,
    });

    const headerRow = (resp.data.values && resp.data.values[0]) ? resp.data.values[0] : [];

    // Verifica se a data já existe
    const alreadyExists = headerRow.some(cell => (cell || '').trim() === dateStr);
    if (alreadyExists) {
      results.push({ turma: t, success: false, message: `Data "${dateStr}" já existe em ${sheetName}` });
      continue;
    }

    // Próxima coluna disponível após o último cabeçalho não-vazio
    let newColIndex = DATE_START_COL;
    for (let c = DATE_START_COL; c < headerRow.length; c++) {
      if ((headerRow[c] || '').trim()) {
        newColIndex = c + 1;
      }
    }

    const colLetter = columnIndexToLetter(newColIndex);
    const cellRange = `'${sheetName}'!${colLetter}${HEADER_ROW}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: cellRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[dateStr]] },
    });

    results.push({ turma: t, success: true, colIndex: newColIndex, message: `"${dateStr}" adicionada em ${sheetName} coluna ${colLetter}` });
  }

  return { success: true, results };
}

// -------------------------------------------------------
// Exports
// -------------------------------------------------------
module.exports = {
  setupOneSpreadsheet,
  getOneStudents,
  getOneAttendance,
  updateOneAttendance,
  addOneDate,
};
