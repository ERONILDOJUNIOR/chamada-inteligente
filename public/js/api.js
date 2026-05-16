/**
 * API Module — Chamadas à API REST do backend
 */
const API = {
  BASE_URL: '/api',
  _token: null,

  /**
   * Retorna os headers padrão com token de autenticação
   */
  _authHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this._token) {
      headers['Authorization'] = `Bearer ${this._token}`;
    }
    return headers;
  },

  /**
   * Define o token de acesso
   */
  setToken(token) {
    this._token = token;
  },

  /**
   * Autentica com o código de acesso
   * @param {string} code
   */
  async authenticate(code) {
    const res = await fetch(`${this.BASE_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      this._token = data.token;
      // Salva token na sessão (dura enquanto a aba estiver aberta)
      sessionStorage.setItem('access_token', data.token);
    }
    return data;
  },

  /**
   * Busca lista de abas da planilha
   */
  async fetchSheets() {
    const res = await fetch(`${this.BASE_URL}/sheets`, {
      headers: this._authHeaders(),
    });
    if (!res.ok) throw new Error('Falha ao buscar turmas');
    return res.json();
  },

  /**
   * Busca dados de presença de uma aba
   * @param {string} sheetName
   */
  async fetchAttendance(sheetName) {
    const res = await fetch(`${this.BASE_URL}/attendance/${encodeURIComponent(sheetName)}`, {
      headers: this._authHeaders(),
    });
    if (!res.ok) throw new Error('Falha ao buscar dados de presença');
    return res.json();
  },

  /**
   * Salva presença de um aluno
   * @param {{sheetName: string, rowIndex: number, colIndex: number, value: string}} data
   */
  async saveAttendance(data) {
    const res = await fetch(`${this.BASE_URL}/attendance`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Falha ao salvar presença');
    return res.json();
  },

  /**
   * Adiciona nova coluna de data
   * @param {{sheetName: string, date: string}} data
   */
  async addDate(data) {
    const res = await fetch(`${this.BASE_URL}/attendance/add-date`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Falha ao adicionar data');
    return res.json();
  },
};
