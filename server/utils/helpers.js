/**
 * Funções auxiliares para o sistema de chamada
 */

/**
 * Converte índice de coluna (0-based) para notação de letra (A, B, ..., Z, AA, AB, ...)
 * @param {number} colIndex - Índice da coluna (0 = A, 1 = B, 26 = AA)
 * @returns {string} Letra(s) da coluna
 */
function columnIndexToLetter(colIndex) {
  let letter = '';
  let temp = colIndex;

  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }

  return letter;
}

/**
 * Converte letra da coluna para índice (0-based)
 * @param {string} letter - Letra(s) da coluna (A, B, AA, etc.)
 * @returns {number} Índice da coluna
 */
function columnLetterToIndex(letter) {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Formata data para exibição (DD/MM)
 * @param {string} dateStr - String da data
 * @returns {string} Data formatada
 */
function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  return dateStr.trim();
}

/**
 * Valida se o valor é P ou F
 * @param {string} value - Valor a validar
 * @returns {boolean}
 */
function isValidAttendanceValue(value) {
  return value === 'P' || value === 'F';
}

/**
 * Gera notação A1 para uma célula específica
 * @param {string} sheetName - Nome da aba
 * @param {number} row - Linha (1-based)
 * @param {number} col - Coluna (0-based)
 * @returns {string} Notação A1 completa (ex: "Turma A!C5")
 */
function getCellA1Notation(sheetName, row, col) {
  const colLetter = columnIndexToLetter(col);
  return `'${sheetName}'!${colLetter}${row}`;
}

module.exports = {
  columnIndexToLetter,
  columnLetterToIndex,
  formatDateDisplay,
  isValidAttendanceValue,
  getCellA1Notation,
};
