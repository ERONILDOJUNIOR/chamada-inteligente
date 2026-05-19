/**
 * Serviço de integração com o Google Sheets
 * Responsável por toda lógica de leitura e escrita na planilha
 * 
 * Estrutura esperada da planilha "CHAMADA 1":
 * - Linhas 1-4: vazias (espaçamento/logo)
 * - Linha 5: cabeçalho de matérias (mescladas)
 * - Linha 6: sub-cabeçalho com datas (col A=vazio, col B=vazio, col C+=datas)
 * - Linha 7+: dados dos alunos (col A=N°, col B=Nome, col C+=P/F)
 * - Pode haver uma segunda seção de alunos mais abaixo (linhas 48+)
 * - Colunas K+ podem ter resumos/estatísticas (ignorar)
 */

const { getSheetsClient, getSpreadsheetId } = require('../config/google-sheets');
const { columnIndexToLetter, getCellA1Notation, isValidAttendanceValue } = require('../utils/helpers');

// Configuração da estrutura da planilha
const SHEET_CONFIG = {
  HEADER_ROW: 6,       // Linha onde ficam as datas (1-based no Google Sheets)
  DATA_START_ROW: 7,    // Primeira linha de dados de alunos
  NAME_COL: 1,          // Coluna do nome (0-based: B = 1)
  NUM_COL: 0,           // Coluna do número (0-based: A = 0)
  DATA_START_COL: 2,    // Primeira coluna de presença (0-based: C = 2)
  MAX_DATE_COLS: 7,     // Máximo de colunas de datas a ler (C até I = 7 colunas)
  EMPTY_ROWS: 4,        // Linhas vazias no início
};

/**
 * Busca os nomes de todas as abas (sheets) da planilha
 * @returns {Promise<string[]>} Lista de nomes das abas
 */
async function getSheetNames() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });

  const allNames = response.data.sheets.map((s) => s.properties.title);

  // Filtra apenas abas que começam com "CHAMADA", excluindo as que começam com "CHAMADA GERAL"
  return allNames.filter((name) => {
    const upperName = name.toUpperCase();
    return upperName.startsWith('CHAMADA') && !upperName.startsWith('CHAMADA GERAL');
  });
}

/**
 * Busca os nomes de todas as abas (sheets) que são de Chamada Geral
 */
async function getGeralSheetNames() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });

  const allNames = response.data.sheets.map((s) => s.properties.title);

  // Filtra apenas abas que começam com "CHAMADA GERAL"
  return allNames.filter((name) => name.toUpperCase().startsWith('CHAMADA GERAL'));
}

/**
 * Lê todos os dados de presença de uma aba
 * Adapta para a estrutura real da planilha (com linhas vazias, N°, seções)
 * 
 * @param {string} sheetName - Nome da aba
 * @returns {Promise<{headers: string[], students: Array<{name: string, rowIndex: number, attendance: Object}>}>}
 */
async function getAttendanceData(sheetName) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // Lê todas as células da aba
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'`,
  });

  const rows = response.data.values || [];

  if (rows.length < SHEET_CONFIG.HEADER_ROW) {
    return { headers: [], students: [] };
  }

  // Linha de datas (linha 6, index 5 em 0-based)
  const dateRow = rows[SHEET_CONFIG.HEADER_ROW - 1] || [];

  // Extrai as datas a partir da coluna C (index 2)
  // Para em colunas vazias ou ao chegar na área de resumo
  const dateHeaders = [];
  const dateColIndices = []; // Mapeia índice da data para índice real da coluna

  for (let c = SHEET_CONFIG.DATA_START_COL; c < dateRow.length; c++) {
    const cellValue = (dateRow[c] || '').trim();

    // Se encontrar uma coluna vazia seguida de outra coisa, pode ser área de resumo
    if (!cellValue) break;

    // Verifica se parece uma data (contém mês abreviado ou formato DD/MM)
    if (cellValue.match(/\d+[-/]?\w+\.?/i)) {
      dateHeaders.push(cellValue);
      dateColIndices.push(c);
    }
  }

  // Percorre todas as linhas de dados buscando alunos
  // Suporta múltiplas seções (a planilha pode ter cabeçalhos repetidos)
  const students = [];

  for (let i = SHEET_CONFIG.DATA_START_ROW - 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const numCell = (row[SHEET_CONFIG.NUM_COL] || '').toString().trim();
    const nameCell = (row[SHEET_CONFIG.NAME_COL] || '').trim();

    // Pula linhas sem nome ou onde a coluna A não é um número (cabeçalhos, resumos)
    if (!nameCell) continue;
    if (!numCell || isNaN(parseInt(numCell, 10))) continue;

    // Verifica se não é uma linha de resumo (ex: "Presenças", "Faltas", "Frequência")
    const skipWords = ['presenças', 'faltas', 'frequência', 'total', 'n°', 'nome completo'];
    if (skipWords.some(w => nameCell.toLowerCase().includes(w))) continue;

    // Monta objeto de presença usando os índices reais das colunas
    const attendance = {};
    for (let j = 0; j < dateHeaders.length; j++) {
      const realColIndex = dateColIndices[j];
      const value = (row[realColIndex] || '').trim().toUpperCase();
      attendance[dateHeaders[j]] = value;
    }

    students.push({
      name: nameCell,
      rowIndex: i + 1, // +1 porque Google Sheets é 1-based
      attendance,
    });
  }

  return {
    headers: dateHeaders,
    students,
  };
}

/**
 * Atualiza a presença de um aluno em uma data específica
 * 
 * @param {string} sheetName - Nome da aba
 * @param {number} rowIndex - Índice da linha (1-based, como no Google Sheets)
 * @param {number} colIndex - Índice da coluna de DATA (0-based nas datas retornadas)
 * @param {string} value - "P" ou "F"
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function updateAttendance(sheetName, rowIndex, colIndex, value) {
  if (!isValidAttendanceValue(value)) {
    throw new Error(`Valor inválido: "${value}". Use "P" ou "F".`);
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // O colIndex vem do frontend como dateColIndex + 1 (índice da data + 1)
  // Precisamos mapear para a coluna real na planilha
  // Para isso, vamos buscar a linha de datas e descobrir o índice real
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!${SHEET_CONFIG.HEADER_ROW}:${SHEET_CONFIG.HEADER_ROW}`,
  });

  const dateRow = response.data.values ? response.data.values[0] : [];

  // Reconstrói o mapeamento de colunas de data
  const dateColIndices = [];
  for (let c = SHEET_CONFIG.DATA_START_COL; c < dateRow.length; c++) {
    const cellValue = (dateRow[c] || '').trim();
    if (!cellValue) break;
    if (cellValue.match(/\d+[-/]?\w+\.?/i)) {
      dateColIndices.push(c);
    }
  }

  // O frontend envia colIndex como dateIndex + 1 (vindo do ui.js: data-col="${dateColIndex + 1}")
  // Então dateIndex = colIndex - 1
  const dateIndex = colIndex - 1;

  if (dateIndex < 0 || dateIndex >= dateColIndices.length) {
    throw new Error(`Índice de data inválido: ${dateIndex}`);
  }

  const realColIndex = dateColIndices[dateIndex];
  const cellRange = getCellA1Notation(sheetName, rowIndex, realColIndex);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value]],
    },
  });

  return {
    success: true,
    message: `Presença atualizada: ${cellRange} = ${value}`,
  };
}

/**
 * Adiciona uma nova coluna de data na planilha
 * 
 * @param {string} sheetName - Nome da aba
 * @param {string} dateStr - Data a adicionar (ex: "22/05")
 * @returns {Promise<{success: boolean, colIndex: number}>}
 */
async function addDateColumn(sheetName, dateStr) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // Busca a linha de datas para descobrir a próxima coluna disponível
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!${SHEET_CONFIG.HEADER_ROW}:${SHEET_CONFIG.HEADER_ROW}`,
  });

  const dateRow = response.data.values ? response.data.values[0] : [];

  // Encontra a primeira coluna vazia após as datas existentes
  let newColIndex = SHEET_CONFIG.DATA_START_COL;
  for (let c = SHEET_CONFIG.DATA_START_COL; c < dateRow.length; c++) {
    const cellValue = (dateRow[c] || '').trim();
    if (!cellValue) {
      newColIndex = c;
      break;
    }
    newColIndex = c + 1;
  }

  const colLetter = columnIndexToLetter(newColIndex);
  const cellRange = `'${sheetName}'!${colLetter}${SHEET_CONFIG.HEADER_ROW}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[dateStr]],
    },
  });

  return {
    success: true,
    colIndex: newColIndex,
    message: `Nova data "${dateStr}" adicionada na coluna ${colLetter}`,
  };
}

/**
 * Retorna dados da "CHAMADA GERAL"
 * Estrutura: Linha 6 (index 5) = Disciplinas, Linha 7 (index 6) = P/F
 */
async function getGeralData(sheetName = 'CHAMADA GERAL') {
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
  const typeRow = rows[6] || [];

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
    const row = rows[i] || [];
    const numCell = (row[0] || '').toString().trim();
    const nameCell = (row[1] || '').trim();

    if (!nameCell) continue;
    if (!numCell || isNaN(parseInt(numCell, 10))) continue;

    const skipWords = ['presenças', 'faltas', 'frequência', 'total'];
    if (skipWords.some(w => nameCell.toLowerCase().includes(w))) continue;

    const attendance = {};
    
    for (const subject of subjects) {
      const map = subjectColMap[subject];
      let pCount = 0;
      let fCount = 0;
      
      if (map.pIndex !== undefined) {
        const val = row[map.pIndex] || '0';
        pCount = parseInt(val, 10) || 0;
      }
      if (map.fIndex !== undefined) {
        const val = row[map.fIndex] || '0';
        fCount = parseInt(val, 10) || 0;
      }
      
      attendance[subject] = { P: pCount, F: fCount };
    }

    students.push({
      id: numCell,
      name: nameCell,
      rowIndex: i + 1, 
      attendance
    });
  }

  return { subjects, students };
}

/**
 * Atualiza presença/falta na "CHAMADA GERAL"
 */
async function updateGeralAttendance(sheetName, rowIndex, subjectName, type, newValue) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!A6:Z7`, 
  });

  const rows = response.data.values || [];
  const subjectRow = rows[0] || [];
  const typeRow = rows[1] || [];

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
    requestBody: {
      values: [[newValue]],
    },
  });

  return { success: true, message: `Atualizado ${cellRange} = ${newValue}` };
}

/**
 * Busca abas de Financeiro
 */
async function getFinanceiroSheetNames() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });

  const allNames = response.data.sheets.map((s) => s.properties.title);
  return allNames.filter((name) => name.toUpperCase().includes('FINANCEIRO'));
}

/**
 * Lê todos os dados de uma aba de Financeiro
 */
async function getFinanceiroData(sheetName) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'`,
  });

  const rows = response.data.values || [];

  if (rows.length < 2) {
    return { months: [], students: [] };
  }

  // Linha 1 (index 0) contém os meses a partir da coluna 5 (F)
  const monthRow = rows[0] || [];
  const months = [];
  const monthColMap = {}; // Ex: { 'MAR': 5, 'ABR': 6 }

  for (let c = 5; c < monthRow.length; c++) {
    const monthValue = (monthRow[c] || '').trim();
    if (monthValue) {
      months.push(monthValue);
      monthColMap[monthValue] = c;
    }
  }

  const students = [];

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i] || [];
    const numCell = (row[0] || '').toString().trim();
    const nameCell = (row[1] || '').trim();
    const perfilCell = (row[2] || '').trim();
    const valorCell = (row[3] || '').trim();
    const dataVencimentoCell = (row[4] || '').trim();

    if (!nameCell) continue;
    if (!numCell || isNaN(parseInt(numCell, 10))) continue;

    const skipWords = ['presenças', 'faltas', 'frequência', 'total'];
    if (skipWords.some(w => nameCell.toLowerCase().includes(w))) continue;

    const pagamentos = {};
    for (const month of months) {
      const colIdx = monthColMap[month];
      pagamentos[month] = (row[colIdx] || '').trim();
    }

    students.push({
      id: numCell,
      name: nameCell,
      perfil: perfilCell,
      valor: valorCell,
      dataVencimento: dataVencimentoCell,
      rowIndex: i + 1, // Google sheets 1-based
      pagamentos
    });
  }

  return { months, monthColMap, students };
}

/**
 * Atualiza um campo no Financeiro (Data ou Data Pg)
 */
async function updateFinanceiroField(sheetName, rowIndex, colIndex, value) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const colLetter = columnIndexToLetter(colIndex);
  const cellRange = `'${sheetName}'!${colLetter}${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value]],
    },
  });

  return { success: true, message: `Atualizado ${cellRange} = ${value}` };
}

/**
 * Busca abas de Matriculados (iniciam com MATRICULADOS)
 */
async function getMatriculadosSheetNames() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });

  const allNames = response.data.sheets.map((s) => s.properties.title);
  return allNames.filter((name) => name.toUpperCase().startsWith('MATRICULADOS'));
}

/**
 * Lê os dados da aba de Matriculados
 * Tenta identificar dinamicamente as colunas de "Nome completo", "E-mail" e "Celular", ou usa índices fixos.
 */
async function getMatriculadosData(sheetName) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'`,
  });

  const rows = response.data.values || [];

  if (rows.length < 2) {
    return { students: [] };
  }

  // Linha 0 geralmente contém os cabeçalhos (baseado no CSV fornecido)
  const headerRow = rows[0] || [];
  const colMap = {};
  headerRow.forEach((h, idx) => {
    colMap[h.trim().toLowerCase()] = idx;
  });

  // Tenta encontrar dinamicamente pelos nomes, ou usa os índices padrão do CSV (Nome=2, Email=7, Celular=8)
  const getColIndex = (possibleNames, fallbackIndex) => {
    for (const name of possibleNames) {
      if (colMap[name] !== undefined) return colMap[name];
    }
    return fallbackIndex;
  };

  const nameIdx = getColIndex(['nome completo:', 'nome completo', 'nome'], 2);
  const emailIdx = getColIndex(['e-mail:', 'e-mail', 'email:', 'email'], 7);
  const phoneIdx = getColIndex(['celular:', 'celular', 'telefone:', 'telefone', 'whatsapp', 'whatsapp:'], 8);

  const students = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const nameCell = (row[nameIdx] || '').trim();
    const emailCell = (row[emailIdx] || '').trim();
    const phoneCell = (row[phoneIdx] || '').trim();

    // Pula linhas onde o nome é vazio, ou cabeçalhos
    if (!nameCell) continue;
    if (['nome', 'nome completo', 'nome completo:'].includes(nameCell.toLowerCase())) continue;

    students.push({
      name: nameCell,
      email: emailCell,
      phone: phoneCell,
    });
  }

  // Ordenar alfabeticamente para melhor visualização
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
  getMatriculadosData
};
