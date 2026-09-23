/**
 * Serviço de integração com o Google Sheets
 * Responsável por toda lógica de leitura e escrita na planilha
 *
 * Estrutura da planilha "CHAMADA OFICIAL":
 * - Linha 1: nomes das disciplinas (células mescladas)
 * - Linha 2: datas das aulas (col A=vazio, col B=vazio, col C+=datas)
 * - Linha 3+: dados dos alunos (col A=N°, col B=Nome, col C+=P/F)
 */

const { getSheetsClient, getSpreadsheetId } = require('../config/google-sheets');
const { columnIndexToLetter, getCellA1Notation, isValidAttendanceValue } = require('../utils/helpers');

// Configuração legada (abas antigas com estrutura diferente)
const SHEET_CONFIG = {
  HEADER_ROW: 6,
  DATA_START_ROW: 7,
  NAME_COL: 1,
  NUM_COL: 0,
  DATA_START_COL: 2,
};

// Configuração da aba CHAMADA OFICIAL
const OFICIAL_CONFIG = {
  DISCIPLINE_ROW: 1,  // 1-based: linha com nomes das disciplinas mescladas
  DATE_ROW: 2,        // 1-based: linha com as datas das aulas
  DATA_START_ROW: 3,  // 1-based: primeira linha de alunos
  NAME_COL: 1,        // índice 0-based da coluna Nome (B=1)
  NUM_COL: 0,         // índice 0-based da coluna Nº (A=0)
  DATA_START_COL: 2,  // índice 0-based da primeira coluna de presença (C=2)
};

const OFICIAL_SHEET_NAME = 'CHAMADA OFICIAL';

function isOficial(sheetName) {
  return sheetName === OFICIAL_SHEET_NAME;
}

// ============================================================
// Listagem de abas
// ============================================================

/**
 * Retorna as abas disponíveis para Chamada Diária.
 * Agora aponta fixo para CHAMADA OFICIAL.
 */
async function getSheetNames() {
  return [OFICIAL_SHEET_NAME];
}

/**
 * Retorna as abas disponíveis para Chamada Geral.
 * Os totais são calculados a partir da CHAMADA OFICIAL.
 */
async function getGeralSheetNames() {
  return [OFICIAL_SHEET_NAME];
}

// ============================================================
// Leitura de dados de presença (Chamada Diária)
// ============================================================

/**
 * Lê os dados de presença da CHAMADA OFICIAL.
 * Linha 1 = disciplinas, Linha 2 = datas, Linha 3+ = alunos.
 */
async function getOficialAttendanceData() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${OFICIAL_SHEET_NAME}'`,
  });

  const rows = response.data.values || [];

  if (rows.length < 3) {
    return { headers: [], students: [] };
  }

  // rows[1] = linha 2 = datas
  const dateRow = rows[1] || [];

  const dateHeaders = [];
  const dateColIndices = [];

  for (let c = OFICIAL_CONFIG.DATA_START_COL; c < dateRow.length; c++) {
    const cellValue = (dateRow[c] || '').trim();
    if (!cellValue) continue;
    // Aceita datas no formato: "5-mar.", "12-mar.", "2-abr.", etc.
    if (cellValue.match(/\d+[-/.]?\s*\w+\.?/i)) {
      dateHeaders.push(cellValue);
      dateColIndices.push(c);
    }
  }

  // rows[2]+ = alunos (linha 3+)
  const students = [];

  for (let i = OFICIAL_CONFIG.DATA_START_ROW - 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const numCell = (row[OFICIAL_CONFIG.NUM_COL] || '').toString().trim();
    const nameCell = (row[OFICIAL_CONFIG.NAME_COL] || '').trim();

    if (!nameCell || !numCell || isNaN(parseInt(numCell, 10))) continue;

    const skipWords = ['presenças', 'faltas', 'frequência', 'total', 'n°', 'nome completo'];
    if (skipWords.some(w => nameCell.toLowerCase().includes(w))) continue;

    const attendance = {};
    for (let j = 0; j < dateHeaders.length; j++) {
      const realColIndex = dateColIndices[j];
      const value = (row[realColIndex] || '').trim().toUpperCase();
      attendance[dateHeaders[j]] = value;
    }

    students.push({
      name: nameCell,
      num: parseInt(numCell, 10),
      rowIndex: i + 1, // 1-based (Google Sheets)
      attendance,
    });
  }

  return { headers: dateHeaders, students };
}

/**
 * Lê todos os dados de presença de uma aba.
 * Para CHAMADA OFICIAL usa lógica específica.
 */
async function getAttendanceData(sheetName) {
  if (isOficial(sheetName)) {
    return getOficialAttendanceData();
  }

  // --- Lógica legada para outras abas ---
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'`,
  });

  const rows = response.data.values || [];

  if (rows.length < SHEET_CONFIG.HEADER_ROW) {
    return { headers: [], students: [] };
  }

  const dateRow = rows[SHEET_CONFIG.HEADER_ROW - 1] || [];
  const dateHeaders = [];
  const dateColIndices = [];

  for (let c = SHEET_CONFIG.DATA_START_COL; c < dateRow.length; c++) {
    const cellValue = (dateRow[c] || '').trim();
    if (!cellValue) break;
    if (cellValue.match(/\d+[-/]?\w+\.?/i)) {
      dateHeaders.push(cellValue);
      dateColIndices.push(c);
    }
  }

  const students = [];

  for (let i = SHEET_CONFIG.DATA_START_ROW - 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const numCell = (row[SHEET_CONFIG.NUM_COL] || '').toString().trim();
    const nameCell = (row[SHEET_CONFIG.NAME_COL] || '').trim();

    if (!nameCell) continue;
    if (!numCell || isNaN(parseInt(numCell, 10))) continue;

    const skipWords = ['presenças', 'faltas', 'frequência', 'total', 'n°', 'nome completo'];
    if (skipWords.some(w => nameCell.toLowerCase().includes(w))) continue;

    const attendance = {};
    for (let j = 0; j < dateHeaders.length; j++) {
      const realColIndex = dateColIndices[j];
      const value = (row[realColIndex] || '').trim().toUpperCase();
      attendance[dateHeaders[j]] = value;
    }

    students.push({
      name: nameCell,
      rowIndex: i + 1,
      attendance,
    });
  }

  return { headers: dateHeaders, students };
}

// ============================================================
// Atualizar presença
// ============================================================

/**
 * Atualiza a presença de um aluno em uma data específica.
 * Detecta automaticamente CHAMADA OFICIAL (line de datas = 2) vs legado (= 6).
 *
 * @param {string} sheetName
 * @param {number} rowIndex  - linha 1-based do aluno no Google Sheets
 * @param {number} colIndex  - dateIndex + 1 (enviado pelo frontend via data-col)
 * @param {string} value     - "P", "F" ou "" para limpar
 */
async function updateAttendance(sheetName, rowIndex, colIndex, value) {
  if (value !== '' && !isValidAttendanceValue(value)) {
    throw new Error(`Valor inválido: "${value}". Use "P" ou "F".`);
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const dateRowNum = isOficial(sheetName) ? OFICIAL_CONFIG.DATE_ROW : SHEET_CONFIG.HEADER_ROW;
  const dataStartCol = isOficial(sheetName) ? OFICIAL_CONFIG.DATA_START_COL : SHEET_CONFIG.DATA_START_COL;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!${dateRowNum}:${dateRowNum}`,
  });

  const dateRow = response.data.values ? response.data.values[0] : [];
  const dateColIndices = [];

  for (let c = dataStartCol; c < dateRow.length; c++) {
    const cellValue = (dateRow[c] || '').trim();
    if (!cellValue) {
      if (!isOficial(sheetName)) break; // legado: para no primeiro vazio
      continue;                          // CHAMADA OFICIAL: pula vazios (gaps possíveis)
    }
    if (cellValue.match(/\d+[-/.]?\s*\w+\.?/i)) {
      dateColIndices.push(c);
    }
  }

  // Frontend envia colIndex = dateIndex + 1
  const dateIndex = colIndex - 1;

  if (dateIndex < 0 || dateIndex >= dateColIndices.length) {
    throw new Error(`Índice de data inválido: ${dateIndex} (total: ${dateColIndices.length})`);
  }

  const realColIndex = dateColIndices[dateIndex];
  const cellRange = getCellA1Notation(sheetName, rowIndex, realColIndex);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  });

  return { success: true, message: `Presença atualizada: ${cellRange} = ${value}` };
}

// ============================================================
// Adicionar nova data
// ============================================================

/**
 * Adiciona uma nova coluna de data na planilha.
 */
async function addDateColumn(sheetName, dateStr) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const dateRowNum = isOficial(sheetName) ? OFICIAL_CONFIG.DATE_ROW : SHEET_CONFIG.HEADER_ROW;
  const dataStartCol = isOficial(sheetName) ? OFICIAL_CONFIG.DATA_START_COL : SHEET_CONFIG.DATA_START_COL;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!${dateRowNum}:${dateRowNum}`,
  });

  const dateRow = response.data.values ? response.data.values[0] : [];

  let newColIndex = dataStartCol;
  for (let c = dataStartCol; c < dateRow.length; c++) {
    const cellValue = (dateRow[c] || '').trim();
    if (!cellValue) { newColIndex = c; break; }
    newColIndex = c + 1;
  }

  const colLetter = columnIndexToLetter(newColIndex);
  const cellRange = `'${sheetName}'!${colLetter}${dateRowNum}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[dateStr]] },
  });

  return {
    success: true,
    colIndex: newColIndex,
    message: `Nova data "${dateStr}" adicionada na coluna ${colLetter}`,
  };
}

// ============================================================
// Chamada Geral — cálculo por disciplina
// ============================================================

/**
 * Calcula totais P/F por disciplina a partir da CHAMADA OFICIAL.
 * Retorna o mesmo formato de getGeralData() para compatibilidade com o frontend.
 * Os dados são somente leitura (readonly: true).
 */
async function getOficialGeralData() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${OFICIAL_SHEET_NAME}'`,
  });

  const rows = response.data.values || [];

  if (rows.length < 3) {
    return { subjects: [], students: [], readonly: true };
  }

  const disciplineRow = rows[0] || []; // linha 1: nomes das disciplinas (mescladas)
  const dateRow       = rows[1] || []; // linha 2: datas

  // Mapa: índice de coluna → disciplina responsável
  // Células mescladas repetem o valor apenas na primeira coluna do grupo
  const colDisciplineMap = {};
  let currentDiscipline = null;

  for (let c = OFICIAL_CONFIG.DATA_START_COL; c < Math.max(disciplineRow.length, dateRow.length); c++) {
    const disciplineName = (disciplineRow[c] || '').replace(/\n/g, ' ').trim();
    if (disciplineName) currentDiscipline = disciplineName;
    // Só mapeia colunas que realmente têm uma data (coluna de presença)
    if (currentDiscipline && (dateRow[c] || '').trim()) {
      colDisciplineMap[c] = currentDiscipline;
    }
  }

  // Extrai lista única de disciplinas, na ordem de aparição
  const subjects = [];
  const seen = new Set();
  for (let c = OFICIAL_CONFIG.DATA_START_COL; c < dateRow.length; c++) {
    const disc = colDisciplineMap[c];
    if (disc && !seen.has(disc)) {
      subjects.push(disc);
      seen.add(disc);
    }
  }

  // Lê alunos e conta P/F por disciplina
  const students = [];

  for (let i = OFICIAL_CONFIG.DATA_START_ROW - 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const numCell  = (row[OFICIAL_CONFIG.NUM_COL]  || '').toString().trim();
    const nameCell = (row[OFICIAL_CONFIG.NAME_COL] || '').trim();

    if (!nameCell || !numCell || isNaN(parseInt(numCell, 10))) continue;

    const skipWords = ['presenças', 'faltas', 'frequência', 'total'];
    if (skipWords.some(w => nameCell.toLowerCase().includes(w))) continue;

    const attendance = {};
    for (const subject of subjects) {
      attendance[subject] = { P: 0, F: 0, FJ: 0 };
    }

    for (let c = OFICIAL_CONFIG.DATA_START_COL; c < row.length; c++) {
      const discipline = colDisciplineMap[c];
      if (!discipline) continue;
      const val = (row[c] || '').trim().toUpperCase();
      if (val === 'P') attendance[discipline].P++;
      if (val === 'F') attendance[discipline].F++;
      if (val === 'FJ') attendance[discipline].FJ++;
    }

    students.push({
      id: numCell,
      name: nameCell,
      rowIndex: i + 1,
      attendance,
    });
  }

  return { subjects, students, readonly: true };
}

/**
 * Retorna dados de presença por disciplina.
 * Para CHAMADA OFICIAL calcula dinamicamente.
 * Para outras abas usa estrutura legada de CHAMADA GERAL.
 */
async function getGeralData(sheetName) {
  if (isOficial(sheetName)) {
    return getOficialGeralData();
  }

  // --- Lógica legada ---
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'`,
  });

  const rows = response.data.values || [];

  if (rows.length < 7) {
    return { subjects: [], students: [] };
  }

  const subjectRow = rows[5] || [];
  const typeRow    = rows[6] || [];

  const subjects = [];
  const subjectColMap = {};
  let currentSubject = null;

  for (let c = 2; c < Math.max(subjectRow.length, typeRow.length); c++) {
    const headerValue = (subjectRow[c] || '').trim();
    if (headerValue) {
      currentSubject = headerValue;
      subjects.push(currentSubject);
      subjectColMap[currentSubject] = {};
    }
    if (currentSubject) {
      const typeValue = (typeRow[c] || '').trim().toUpperCase();
      if (typeValue === 'P') subjectColMap[currentSubject].pIndex = c;
      if (typeValue === 'F') subjectColMap[currentSubject].fIndex = c;
    }
  }

  const students = [];

  for (let i = 7; i < rows.length; i++) {
    const row      = rows[i] || [];
    const numCell  = (row[0] || '').toString().trim();
    const nameCell = (row[1] || '').trim();

    if (!nameCell) continue;
    if (!numCell || isNaN(parseInt(numCell, 10))) continue;

    const skipWords = ['presenças', 'faltas', 'frequência', 'total'];
    if (skipWords.some(w => nameCell.toLowerCase().includes(w))) continue;

    const attendance = {};

    for (const subject of subjects) {
      const map = subjectColMap[subject];
      const pCount = map.pIndex !== undefined ? (parseInt(row[map.pIndex] || '0', 10) || 0) : 0;
      const fCount = map.fIndex !== undefined ? (parseInt(row[map.fIndex] || '0', 10) || 0) : 0;
      attendance[subject] = { P: pCount, F: fCount };
    }

    students.push({ id: numCell, name: nameCell, rowIndex: i + 1, attendance });
  }

  return { subjects, students };
}

/**
 * Atualiza presença/falta na CHAMADA GERAL (apenas legado).
 * CHAMADA OFICIAL é somente leitura nesta view.
 */
async function updateGeralAttendance(sheetName, rowIndex, subjectName, type, newValue) {
  if (isOficial(sheetName)) {
    throw new Error('A Chamada Geral da CHAMADA OFICIAL é somente leitura. Edite diretamente na Chamada Diária.');
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!A6:Z7`,
  });

  const rows       = response.data.values || [];
  const subjectRow = rows[0] || [];
  const typeRow    = rows[1] || [];

  let currentSubject = null;
  let targetColIndex = -1;

  for (let c = 2; c < Math.max(subjectRow.length, typeRow.length); c++) {
    const headerValue = (subjectRow[c] || '').trim();
    if (headerValue) currentSubject = headerValue;

    if (currentSubject === subjectName) {
      const typeValue = (typeRow[c] || '').trim().toUpperCase();
      if (typeValue === type.toUpperCase()) {
        targetColIndex = c;
        break;
      }
    }
  }

  if (targetColIndex === -1) {
    throw new Error(`Coluna para assunto "${subjectName}" e tipo "${type}" não encontrada.`);
  }

  const colLetter = columnIndexToLetter(targetColIndex);
  const cellRange = `'${sheetName}'!${colLetter}${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[newValue]] },
  });

  return { success: true, message: `Atualizado ${cellRange} = ${newValue}` };
}

// ============================================================
// Financeiro
// ============================================================

async function getFinanceiroSheetNames() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
  const allNames = response.data.sheets.map((s) => s.properties.title);
  return allNames.filter((name) => name.toUpperCase().includes('FINANCEIRO'));
}

async function getFinanceiroData(sheetName) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${sheetName}'` });
  const rows = response.data.values || [];

  if (rows.length < 2) return { months: [], students: [] };

  const monthRow = rows[0] || [];
  const months = [];
  const monthColMap = {};

  for (let c = 5; c < monthRow.length; c++) {
    const monthValue = (monthRow[c] || '').trim();
    if (monthValue) { months.push(monthValue); monthColMap[monthValue] = c; }
  }

  const students = [];

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i] || [];
    const numCell  = (row[0] || '').toString().trim();
    const nameCell = (row[1] || '').trim();

    if (!nameCell || !numCell || isNaN(parseInt(numCell, 10))) continue;

    const skipWords = ['presenças', 'faltas', 'frequência', 'total'];
    if (skipWords.some(w => nameCell.toLowerCase().includes(w))) continue;

    const pagamentos = {};
    for (const month of months) {
      pagamentos[month] = (row[monthColMap[month]] || '').trim();
    }

    students.push({
      id: numCell,
      name: nameCell,
      perfil: (row[2] || '').trim(),
      valor: (row[3] || '').trim(),
      dataVencimento: (row[4] || '').trim(),
      rowIndex: i + 1,
      pagamentos,
    });
  }

  return { months, monthColMap, students };
}

async function updateFinanceiroField(sheetName, rowIndex, colIndex, value) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const colLetter = columnIndexToLetter(colIndex);
  const cellRange = `'${sheetName}'!${colLetter}${rowIndex}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  });
  return { success: true, message: `Atualizado ${cellRange} = ${value}` };
}

// ============================================================
// Matriculados
// ============================================================

async function getMatriculadosSheetNames() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
  const allNames = response.data.sheets.map((s) => s.properties.title);
  return allNames.filter((name) => name.toUpperCase().startsWith('MATRICULADOS'));
}

async function getMatriculadosData(sheetName) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${sheetName}'` });
  const rows = response.data.values || [];

  if (rows.length < 2) return { students: [] };

  const headerRow = rows[0] || [];
  const colMap = {};
  headerRow.forEach((h, idx) => { colMap[h.trim().toLowerCase()] = idx; });

  const getColIndex = (possibleNames, fallback) => {
    for (const name of possibleNames) {
      if (colMap[name] !== undefined) return colMap[name];
    }
    return fallback;
  };

  const nameIdx  = getColIndex(['nome completo:', 'nome completo', 'nome'], 2);
  const emailIdx = getColIndex(['e-mail:', 'e-mail', 'email:', 'email'], 7);
  const phoneIdx = getColIndex(['celular:', 'celular', 'telefone:', 'telefone', 'whatsapp', 'whatsapp:'], 8);

  const students = [];

  for (let i = 1; i < rows.length; i++) {
    const row      = rows[i] || [];
    const nameCell = (row[nameIdx] || '').trim();
    if (!nameCell) continue;
    if (['nome', 'nome completo', 'nome completo:'].includes(nameCell.toLowerCase())) continue;
    students.push({
      name:  nameCell,
      email: (row[emailIdx] || '').trim(),
      phone: (row[phoneIdx] || '').trim(),
    });
  }

  students.sort((a, b) => a.name.localeCompare(b.name));
  return { students };
}

module.exports = {
  getSheetNames,
  getGeralSheetNames,
  getAttendanceData,
  updateAttendance,
  addDateColumn,
  getGeralData,
  updateGeralAttendance,
  getFinanceiroSheetNames,
  getFinanceiroData,
  updateFinanceiroField,
  getMatriculadosSheetNames,
  getMatriculadosData,
};
