/**
 * App Module — Lógica principal e orquestração
 * Sistema de Chamada Inteligente
 */
(function () {
  'use strict';

  // ============================================
  // Estado da aplicação
  // ============================================
  const state = {
    currentSheet: '',
    headers: [],       // datas disponíveis
    students: [],      // dados dos alunos
    selectedDateIndex: -1,
  };

  // ============================================
  // Elementos do Login Gate
  // ============================================
  const loginGate = document.getElementById('loginGate');
  const appContent = document.getElementById('appContent');
  const loginForm = document.getElementById('loginForm');
  const accessCodeInput = document.getElementById('accessCodeInput');
  const loginError = document.getElementById('loginError');
  const btnLogin = document.getElementById('btnLogin');

  // ============================================
  // Inicialização — Verifica se já tem token
  // ============================================
  function boot() {
    const savedToken = sessionStorage.getItem('access_token');
    const savedTimestamp = sessionStorage.getItem('token_timestamp');

    if (savedToken && savedTimestamp) {
      const elapsed = Date.now() - parseInt(savedTimestamp, 10);
      const THIRTY_MINUTES = 30 * 60 * 1000;

      if (elapsed < THIRTY_MINUTES) {
        // Token ainda dentro da validade
        API.setToken(savedToken);
        unlockApp();
        scheduleLogout(THIRTY_MINUTES - elapsed);
      } else {
        // Expirado
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('token_timestamp');
        bindLoginEvents();
      }
    } else {
      // Mostra tela de login
      bindLoginEvents();
    }
  }

  function scheduleLogout(timeMs) {
    setTimeout(() => {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('token_timestamp');
      alert('Sua sessão expirou. Por favor, insira o código novamente.');
      window.location.reload();
    }, timeMs);
  }

  // ============================================
  // Login Gate
  // ============================================
  function bindLoginEvents() {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = accessCodeInput.value.trim();
      if (!code) return;

      // UI feedback
      loginError.classList.add('d-none');
      btnLogin.querySelector('.login-btn-text').classList.add('d-none');
      btnLogin.querySelector('.login-btn-loading').classList.remove('d-none');
      btnLogin.disabled = true;

      try {
        const result = await API.authenticate(code);
        if (result.success) {
          scheduleLogout(30 * 60 * 1000);
          unlockApp();
        } else {
          showLoginError(result.error || 'Código inválido.');
        }
      } catch (err) {
        showLoginError('Erro de conexão. Tente novamente.');
      } finally {
        btnLogin.querySelector('.login-btn-text').classList.remove('d-none');
        btnLogin.querySelector('.login-btn-loading').classList.add('d-none');
        btnLogin.disabled = false;
      }
    });
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove('d-none');
    accessCodeInput.classList.add('shake');
    setTimeout(() => accessCodeInput.classList.remove('shake'), 500);
    accessCodeInput.value = '';
    accessCodeInput.focus();
  }

  // ============================================
  // Desbloqueia o app após autenticação
  // ============================================
  function unlockApp() {
    loginGate.classList.add('login-gate-exit');
    setTimeout(() => {
      loginGate.classList.add('d-none');
      appContent.classList.remove('d-none');
      init();
    }, 400);
  }

  // ============================================
  // Inicialização do app (após autenticação)
  // ============================================
  async function init() {
    bindEvents();
    await loadSheets();
  }

  // ============================================
  // Event Listeners
  // ============================================
  function bindEvents() {
    // Seleção de turma
    UI.els.sheetSelector.addEventListener('change', async (e) => {
      const sheetName = e.target.value;
      if (!sheetName) {
        UI.showState('empty');
        return;
      }
      state.currentSheet = sheetName;
      await loadAttendanceData(sheetName);
    });

    // Seleção de data
    UI.els.dateSelector.addEventListener('change', (e) => {
      const dateIdx = parseInt(e.target.value, 10);
      if (isNaN(dateIdx) || dateIdx < 0) return;
      state.selectedDateIndex = dateIdx;
      const dateKey = state.headers[dateIdx];
      UI.renderStudents(state.students, dateIdx, dateKey);
    });

    // Botão adicionar data
    UI.els.btnAddDate.addEventListener('click', () => {
      UI.els.newDateInput.value = '';
      const modal = new bootstrap.Modal(document.getElementById('addDateModal'));
      modal.show();
    });

    // Confirmar nova data
    UI.els.btnConfirmAddDate.addEventListener('click', async () => {
      const dateStr = UI.els.newDateInput.value.trim();
      if (!dateStr) return;

      try {
        UI.els.btnConfirmAddDate.disabled = true;
        await API.addDate({ sheetName: state.currentSheet, date: dateStr });
        bootstrap.Modal.getInstance(document.getElementById('addDateModal')).hide();
        UI.showToast(`Data "${dateStr}" adicionada!`);
        // Recarrega os dados
        await loadAttendanceData(state.currentSheet);
        // Seleciona a nova data (última)
        const lastIdx = state.headers.length - 1;
        UI.els.dateSelector.value = lastIdx.toString();
        state.selectedDateIndex = lastIdx;
        UI.renderStudents(state.students, lastIdx, state.headers[lastIdx]);
      } catch (err) {
        UI.showToast('Erro ao adicionar data', 'error');
      } finally {
        UI.els.btnConfirmAddDate.disabled = false;
      }
    });

    // Busca de alunos
    UI.els.searchInput.addEventListener('input', (e) => {
      UI.filterStudents(e.target.value);
    });

    // Clique nos botões de presença (delegação de eventos)
    UI.els.studentList.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-attendance');
      if (!btn || btn.classList.contains('saving')) return;

      const row = parseInt(btn.dataset.row, 10);
      const col = parseInt(btn.dataset.col, 10);
      const value = btn.dataset.value;
      const card = btn.closest('.student-card');

      // Feedback visual imediato
      btn.classList.add('saving');

      try {
        await API.saveAttendance({
          sheetName: state.currentSheet,
          rowIndex: row,
          colIndex: col,
          value: value,
        });

        // Atualiza estado local
        const studentIdx = parseInt(card.dataset.studentIndex, 10);
        const dateKey = state.headers[state.selectedDateIndex];
        state.students[studentIdx].attendance[dateKey] = value;

        // Atualiza visual
        UI.updateCardVisual(card, value);
        UI.updateSummary(state.students, dateKey);
        UI.showToast(`${value === 'P' ? 'Presente' : 'Falta'} registrado!`);
      } catch (err) {
        UI.showToast('Erro ao salvar. Tente novamente.', 'error');
      } finally {
        btn.classList.remove('saving');
      }
    });

    // Retry button
    UI.els.btnRetry.addEventListener('click', () => {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('token_timestamp');
      window.location.reload();
    });
  }

  // ============================================
  // Carregamento de dados
  // ============================================
  async function loadSheets() {
    try {
      // Busca a config do backend para saber a aba padrão
      let defaultSheet = '';
      try {
        const configRes = await fetch('/api/config', {
          headers: API._authHeaders(),
        });
        const config = await configRes.json();
        defaultSheet = config.defaultSheetName || '';
      } catch (e) {
        console.warn('Não foi possível buscar config padrão:', e);
      }

      const data = await API.fetchSheets();
      if (data.success && data.sheets.length > 0) {
        UI.populateSheets(data.sheets);

        // Auto-seleciona a aba padrão se existir, senão seleciona a primeira
        const targetSheet = defaultSheet && data.sheets.includes(defaultSheet)
          ? defaultSheet
          : data.sheets[0];

        UI.els.sheetSelector.value = targetSheet;
        state.currentSheet = targetSheet;
        await loadAttendanceData(targetSheet);
      } else {
        UI.showError('Nenhuma aba encontrada na planilha.');
      }
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
      UI.showError('Não foi possível conectar à planilha. Verifique as configurações.');
    }
  }

  async function loadAttendanceData(sheetName) {
    UI.showState('loading');

    try {
      const data = await API.fetchAttendance(sheetName);

      if (!data.success) {
        UI.showError(data.error || 'Erro desconhecido');
        return;
      }

      state.headers = data.headers;
      state.students = data.students;

      if (data.headers.length === 0) {
        UI.showError('Nenhuma data encontrada nesta aba. Adicione uma data para começar.');
        return;
      }

      // Popula datas e auto-seleciona a última
      UI.populateDates(data.headers);

      // Auto-render com a última data
      const lastIdx = data.headers.length - 1;
      state.selectedDateIndex = lastIdx;
      UI.renderStudents(state.students, lastIdx, data.headers[lastIdx]);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      UI.showError('Não foi possível carregar os dados de presença.');
    }
  }

  // ============================================
  // Boot quando DOM estiver pronto
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
