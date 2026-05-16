/**
 * Configuração e autenticação do Google Sheets API
 * Usa Service Account para autenticação JWT
 */

const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

/**
 * Cria e retorna um cliente autenticado do Google Sheets API v4
 */
function getSheetsClient() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    // A chave privada vem com \n literal do .env, precisa converter
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    SCOPES
  );

  return google.sheets({ version: 'v4', auth });
}

/**
 * Retorna o ID da planilha configurado no .env
 */
function getSpreadsheetId() {
  return process.env.SPREADSHEET_ID;
}

module.exports = {
  getSheetsClient,
  getSpreadsheetId,
};
