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
      // Salva token na sessão (dura enquanto a aba estiver aberta ou 30 min)
      sessionStorage.setItem('access_token', data.token);
      sessionStorage.setItem('token_timestamp', Date.now().toString());
    }
    return data;
  },

  /**
   * Verifica se a resposta foi 401 (Não Autorizado) e desloga se necessário
   */
  _checkAuth(res) {
    if (res.status === 401) {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('token_timestamp');
      window.location.reload();
      throw new Error('Sessão expirada');
    }
  },

  /**
   * Busca lista de abas da planilha
   */
  async fetchSheets() {
    const res = await fetch(`${this.BASE_URL}/sheets`, {
      headers: this._authHeaders(),
    });
    this._checkAuth(res);
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
    this._checkAuth(res);
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
    this._checkAuth(res);
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
    this._checkAuth(res);
    if (!res.ok) throw new Error('Falha ao adicionar data');
    return res.json();
  },

  /**
   * Busca lista de abas da planilha para Chamada Geral
   */
  async fetchGeralSheets() {
    const res = await fetch(`${this.BASE_URL}/geral-sheets`, {
      headers: this._authHeaders(),
    });
    this._checkAuth(res);
    if (!res.ok) throw new Error('Falha ao buscar turmas gerais');
    return res.json();
  },

  /**
   * Busca dados da "CHAMADA GERAL"
   */
  async fetchGeralData(sheetName = 'CHAMADA GERAL') {
    const res = await fetch(`${this.BASE_URL}/geral/${encodeURIComponent(sheetName)}`, {
      headers: this._authHeaders(),
    });
    this._checkAuth(res);
    if (!res.ok) throw new Error('Falha ao buscar dados gerais');
    return res.json();
  },

  /**
   * Atualiza número (P/F) na "CHAMADA GERAL"
   */
  async updateGeralAttendance(data) {
    const res = await fetch(`${this.BASE_URL}/geral`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify(data),
    });
    this._checkAuth(res);
    if (!res.ok) throw new Error('Falha ao atualizar dados gerais');
    return res.json();
  },

  /**
   * Busca lista de abas da planilha para Financeiro
   */
  async fetchFinanceiroSheets() {
    const res = await fetch(`${this.BASE_URL}/financeiro-sheets`, {
      headers: this._authHeaders(),
    });
    this._checkAuth(res);
    if (!res.ok) throw new Error('Falha ao buscar abas do financeiro');
    return res.json();
  },

  /**
   * Busca dados da "FINANCEIRO"
   */
  async fetchFinanceiroData(sheetName) {
    const res = await fetch(`${this.BASE_URL}/financeiro/${encodeURIComponent(sheetName)}`, {
      headers: this._authHeaders(),
    });
    this._checkAuth(res);
    if (!res.ok) throw new Error('Falha ao buscar dados do financeiro');
    return res.json();
  },

  /**
   * Atualiza valor num financeiro (Data ou Data Pg)
   */
  async updateFinanceiroField(data) {
    const res = await fetch(`${this.BASE_URL}/financeiro/update`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify(data),
    });
    this._checkAuth(res);
    if (!res.ok) throw new Error('Falha ao atualizar dados financeiro');
    return res.json();
  },

  /**
   * Busca lista de abas de Matriculados
   */
  async fetchMatriculadosSheets() {
    const res = await fetch(`${this.BASE_URL}/matriculados-sheets`, {
      headers: this._authHeaders(),
    });
    this._checkAuth(res);
    if (!res.ok) throw new Error('Falha ao buscar abas de matriculados');
    return res.json();
  },

  /**
   * Busca dados da aba de Matriculados
   */
  async fetchMatriculadosData(sheetName) {
    const res = await fetch(`${this.BASE_URL}/matriculados/${encodeURIComponent(sheetName)}`, {
      headers: this._authHeaders(),
    });
    this._checkAuth(res);
    if (!res.ok) throw new Error('Falha ao buscar dados de matriculados');
    return res.json();
  },

  /**
   * Envia Notificações por E-mail
   */
  async sendNotifications(data) {
    const res = await fetch(`${this.BASE_URL}/notifications/send`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify(data),
    });
    this._checkAuth(res);
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Falha ao enviar notificações');
    return result;
  },

  /**
   * Envia Notificações por WhatsApp (whatsapp-web.js)
   */
  async sendWhatsAppNotifications(data) {
    const res = await fetch(`${this.BASE_URL}/notifications/send-whatsapp`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify(data),
    });
    this._checkAuth(res);
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Falha ao enviar notificações WhatsApp');
    return result;
  },

  /**
   * Obtém status do WhatsApp (QR Code etc)
   */
  async getWhatsAppStatus() {
    const res = await fetch(`${this.BASE_URL}/whatsapp/status`, {
      method: 'GET',
      headers: this._authHeaders()
    });
    this._checkAuth(res);
    return res.json();
  },

  /**
   * Desconecta o WhatsApp
   */
  async logoutWhatsApp() {
    const res = await fetch(`${this.BASE_URL}/whatsapp/logout`, {
      method: 'POST',
      headers: this._authHeaders()
    });
    this._checkAuth(res);
    return res.json();
  },

  // ================================================
  // ONE VOICE
  // ================================================

  /**
   * Inicializa a planilha ONE (setup: cria abas + popula alunos)
   */
  async setupOne() {
    const res = await fetch(`${this.BASE_URL}/one/setup`, {
      method: 'POST',
      headers: this._authHeaders(),
    });
    this._checkAuth(res);
    return res.json();
  },

  /**
   * Busca alunos do ONE. Pode filtrar por turma.
   * @param {string|null} turma - 'Turma 1', 'Turma 2' ou null
   */
  async fetchOneStudents(turma = null) {
    const url = turma
      ? `${this.BASE_URL}/one/students?turma=${encodeURIComponent(turma)}`
      : `${this.BASE_URL}/one/students`;
    const res = await fetch(url, { headers: this._authHeaders() });
    this._checkAuth(res);
    return res.json();
  },

  /**
   * Busca chamada de uma turma ONE
   * @param {'Turma 1'|'Turma 2'} turma
   */
  async fetchOneAttendance(turma) {
    const res = await fetch(`${this.BASE_URL}/one/attendance/${encodeURIComponent(turma)}`, {
      headers: this._authHeaders(),
    });
    this._checkAuth(res);
    return res.json();
  },

  /**
   * Salva P/F de um aluno no ONE
   * @param {{ turma, rowIndex, dateIndex, value }} data
   */
  async saveOneAttendance(data) {
    const res = await fetch(`${this.BASE_URL}/one/attendance`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify(data),
    });
    this._checkAuth(res);
    return res.json();
  },

  /**
   * Adiciona nova data de aula no ONE
   * @param {{ turma, date }} data
   */
  async addOneDate(data) {
    const res = await fetch(`${this.BASE_URL}/one/attendance/add-date`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify(data),
    });
    this._checkAuth(res);
    return res.json();
  },
};
