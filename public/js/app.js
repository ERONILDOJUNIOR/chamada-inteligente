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
    headers: [],       // datas disponíveis (Diária)
    students: [],      // dados dos alunos (Diária)
    selectedDateIndex: -1,
    
    // Estado da Geral
    geralSheets: [],
    geralSheetName: '', // A aba atualmente selecionada
    geralSubjects: [],
    geralStudents: [],
    currentSubject: '',

    // Estado do Dashboard
    dashDiarioSheets: [],
    dashGeralSheets: [],

    // Estado Financeiro
    financeiroSheets: [],
    financeiroSheetName: '',
    financeiroMonths: [],
    financeiroMonthColMap: {},
    financeiroStudents: [],

    // Estado Matriculados
    matriculadosSheets: [],
    matriculadosSheetName: '',
    matriculadosStudents: [],

    // Estado Notificações
    notificacaoSheets: [],
    notificacaoSheetName: '',
    notificacaoStudents: [],

    // WhatsApp
    wppTestMode: true,
    wppTestSheetName: 'TESTE NOTIFICACAO WPP',
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
    const btnTogglePassword = document.getElementById('btnTogglePassword');
    if (btnTogglePassword) {
      btnTogglePassword.addEventListener('click', () => {
        const type = accessCodeInput.getAttribute('type') === 'password' ? 'text' : 'password';
        accessCodeInput.setAttribute('type', type);
        
        const icon = btnTogglePassword.querySelector('i');
        if (type === 'text') {
          icon.classList.remove('bi-eye-fill');
          icon.classList.add('bi-eye-slash-fill');
        } else {
          icon.classList.remove('bi-eye-slash-fill');
          icon.classList.add('bi-eye-fill');
        }
      });
    }

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
    UI.initModals();
    bindEvents();
    
    // Busca a config global do backend
    try {
      const configRes = await fetch('/api/config', {
        headers: API._authHeaders(),
      });
      const config = await configRes.json();
      state.testMode = config.testMode;
      state.defaultSheetName = config.defaultSheetName || '';
      state.wppTestMode = config.wppTestMode !== false;
      state.wppTestSheetName = config.wppTestSheetName || 'TESTE NOTIFICACAO WPP';
      UI.setNotificacaoTestMode(state.testMode);
      UI.setWppTestMode(state.wppTestMode, state.wppTestSheetName);
    } catch (e) {
      console.warn('Não foi possível buscar config global:', e);
    }

    // Inicia pelo Dashboard
    UI.els.navDashboard.click();
  }

  // ============================================
  // Event Listeners
  // ============================================
  function bindEvents() {
    
    // ---- Navegação Sidebar ----
    UI.els.btnToggleSidebar.addEventListener('click', () => {
      UI.els.sidebar.classList.add('show');
    });

    UI.els.btnCloseSidebar.addEventListener('click', () => {
      UI.els.sidebar.classList.remove('show');
    });

    UI.els.btnLogout.addEventListener('click', () => {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('token_timestamp');
      window.location.reload();
    });

    UI.els.navDashboard.addEventListener('click', () => {
      UI.els.navDashboard.classList.add('active');
      UI.els.navDiaria.classList.remove('active');
      UI.els.navGeral.classList.remove('active');
      UI.els.navFinanceiro.classList.remove('active');
      UI.els.navMatriculados.classList.remove('active');
      UI.els.navNotificacoes.classList.remove('active');
      UI.els.navOneVoice.classList.remove('active');
      
      UI.els.viewDashboard.classList.remove('d-none');
      UI.els.viewDiaria.classList.add('d-none');
      UI.els.viewGeral.classList.add('d-none');
      UI.els.viewFinanceiro.classList.add('d-none');
      UI.els.viewMatriculados.classList.add('d-none');
      UI.els.viewNotificacoes.classList.add('d-none');
      UI.els.viewOneVoice.classList.add('d-none');
      
      UI.els.sidebar.classList.remove('show');
      
      if (state.dashDiarioSheets.length === 0 && state.dashGeralSheets.length === 0) {
        loadDashboardData();
      }
    });

    UI.els.navDiaria.addEventListener('click', () => {
      UI.els.navDiaria.classList.add('active');
      UI.els.navDashboard.classList.remove('active');
      UI.els.navGeral.classList.remove('active');
      UI.els.navFinanceiro.classList.remove('active');
      UI.els.navMatriculados.classList.remove('active');
      UI.els.navNotificacoes.classList.remove('active');
      UI.els.navOneVoice.classList.remove('active');
      
      UI.els.viewDiaria.classList.remove('d-none');
      UI.els.viewDashboard.classList.add('d-none');
      UI.els.viewGeral.classList.add('d-none');
      UI.els.viewFinanceiro.classList.add('d-none');
      UI.els.viewMatriculados.classList.add('d-none');
      UI.els.viewNotificacoes.classList.add('d-none');
      UI.els.viewOneVoice.classList.add('d-none');
      
      UI.els.sidebar.classList.remove('show');
      
      if (!state.currentSheet) loadSheets();
    });

    UI.els.navGeral.addEventListener('click', () => {
      UI.els.navGeral.classList.add('active');
      UI.els.navDashboard.classList.remove('active');
      UI.els.navDiaria.classList.remove('active');
      UI.els.navFinanceiro.classList.remove('active');
      UI.els.navMatriculados.classList.remove('active');
      UI.els.navNotificacoes.classList.remove('active');
      UI.els.navOneVoice.classList.remove('active');
      
      UI.els.viewGeral.classList.remove('d-none');
      UI.els.viewDashboard.classList.add('d-none');
      UI.els.viewDiaria.classList.add('d-none');
      UI.els.viewFinanceiro.classList.add('d-none');
      UI.els.viewMatriculados.classList.add('d-none');
      UI.els.viewNotificacoes.classList.add('d-none');
      UI.els.viewOneVoice.classList.add('d-none');
      
      UI.els.sidebar.classList.remove('show');

      if (state.geralSheets.length === 0) {
        loadGeralSheets();
      }
    });

    UI.els.navFinanceiro.addEventListener('click', () => {
      UI.els.navFinanceiro.classList.add('active');
      UI.els.navDashboard.classList.remove('active');
      UI.els.navDiaria.classList.remove('active');
      UI.els.navGeral.classList.remove('active');
      UI.els.navMatriculados.classList.remove('active');
      UI.els.navNotificacoes.classList.remove('active');
      UI.els.navOneVoice.classList.remove('active');
      
      UI.els.viewFinanceiro.classList.remove('d-none');
      UI.els.viewDashboard.classList.add('d-none');
      UI.els.viewDiaria.classList.add('d-none');
      UI.els.viewGeral.classList.add('d-none');
      UI.els.viewMatriculados.classList.add('d-none');
      UI.els.viewNotificacoes.classList.add('d-none');
      UI.els.viewOneVoice.classList.add('d-none');
      
      UI.els.sidebar.classList.remove('show');

      if (state.financeiroSheets.length === 0) {
        loadFinanceiroSheets();
      }
    });

    UI.els.navMatriculados.addEventListener('click', () => {
      UI.els.navMatriculados.classList.add('active');
      UI.els.navDashboard.classList.remove('active');
      UI.els.navDiaria.classList.remove('active');
      UI.els.navGeral.classList.remove('active');
      UI.els.navFinanceiro.classList.remove('active');
      UI.els.navNotificacoes.classList.remove('active');
      UI.els.navOneVoice.classList.remove('active');
      
      UI.els.viewMatriculados.classList.remove('d-none');
      UI.els.viewDashboard.classList.add('d-none');
      UI.els.viewDiaria.classList.add('d-none');
      UI.els.viewGeral.classList.add('d-none');
      UI.els.viewFinanceiro.classList.add('d-none');
      UI.els.viewNotificacoes.classList.add('d-none');
      UI.els.viewOneVoice.classList.add('d-none');
      
      UI.els.sidebar.classList.remove('show');

      if (state.matriculadosSheets.length === 0) {
        loadMatriculadosSheets();
      }
    });

    UI.els.navNotificacoes.addEventListener('click', () => {
      UI.els.navNotificacoes.classList.add('active');
      UI.els.navDashboard.classList.remove('active');
      UI.els.navDiaria.classList.remove('active');
      UI.els.navGeral.classList.remove('active');
      UI.els.navFinanceiro.classList.remove('active');
      UI.els.navMatriculados.classList.remove('active');
      UI.els.navOneVoice.classList.remove('active');
      
      UI.els.viewNotificacoes.classList.remove('d-none');
      UI.els.viewDashboard.classList.add('d-none');
      UI.els.viewDiaria.classList.add('d-none');
      UI.els.viewGeral.classList.add('d-none');
      UI.els.viewFinanceiro.classList.add('d-none');
      UI.els.viewMatriculados.classList.add('d-none');
      UI.els.viewOneVoice.classList.add('d-none');
      
      UI.els.sidebar.classList.remove('show');

      // Update the template based on current inputs
      UI.updateNotificacaoTemplate(UI.els.notificacaoTypeSelector.value, UI.els.notificacaoDueDate.value);
      UI.updateWppTemplate(UI.els.notificacaoTypeSelector.value, UI.els.notificacaoDueDate.value);

      if (state.notificacaoSheets.length === 0) {
        loadNotificacaoSheets();
      }
    });

    // ---- ONE Voice ----
    UI.els.navOneVoice.addEventListener('click', () => {
      UI.els.navOneVoice.classList.add('active');
      UI.els.navDashboard.classList.remove('active');
      UI.els.navDiaria.classList.remove('active');
      UI.els.navGeral.classList.remove('active');
      UI.els.navFinanceiro.classList.remove('active');
      UI.els.navMatriculados.classList.remove('active');
      UI.els.navNotificacoes.classList.remove('active');

      UI.els.viewOneVoice.classList.remove('d-none');
      UI.els.viewDashboard.classList.add('d-none');
      UI.els.viewDiaria.classList.add('d-none');
      UI.els.viewGeral.classList.add('d-none');
      UI.els.viewFinanceiro.classList.add('d-none');
      UI.els.viewMatriculados.classList.add('d-none');
      UI.els.viewNotificacoes.classList.add('d-none');

      UI.els.sidebar.classList.remove('show');

      // Inicializa o módulo ONE Voice
      OneVoice.init();
    });

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
        // Seleciona a data recém-adicionada se encontrada
        const addedIdx = state.headers.indexOf(dateStr);
        if (addedIdx !== -1) {
          UI.els.dateSelector.value = addedIdx.toString();
          state.selectedDateIndex = addedIdx;
          UI.renderStudents(state.students, addedIdx, state.headers[addedIdx]);
        }
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

      const studentIdx = parseInt(card.dataset.studentIndex, 10);
      const dateKey = state.headers[state.selectedDateIndex];
      const previousValue = (state.students[studentIdx].attendance[dateKey] || '').toUpperCase();
      const newValue = previousValue === value ? '' : value;

      // Feedback visual imediato
      btn.classList.add('saving');

      try {
        await API.saveAttendance({
          sheetName: state.currentSheet,
          rowIndex: row,
          colIndex: col,
          value: newValue,
        });

        // Atualiza estado local
        state.students[studentIdx].attendance[dateKey] = newValue;

        // Atualiza visual
        UI.updateCardVisual(card, newValue);
        UI.updateSummary(state.students, dateKey);
        if (newValue === '') {
          UI.showToast('Presença desmarcada');
        } else {
          const label = newValue === 'P' ? 'Presente' : newValue === 'F' ? 'Falta' : 'Falta Justificada';
          UI.showToast(`${label} registrada!`);
        }
      } catch (err) {
        UI.showToast('Erro ao salvar. Tente novamente.', 'error');
      } finally {
        btn.classList.remove('saving');
      }
    });

    // Retry button (Diária)
    UI.els.btnRetry.addEventListener('click', () => {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('token_timestamp');
      window.location.reload();
    });

    // ---- Eventos do Dashboard ----
    UI.els.dashDiarioSelector.addEventListener('change', async (e) => {
      const sheetName = e.target.value;
      if (sheetName) {
        await renderChartDiarioForSheet(sheetName);
      }
    });

    UI.els.dashGeralSelector.addEventListener('change', async (e) => {
      const sheetName = e.target.value;
      if (sheetName) {
        await renderChartEixosForSheet(sheetName);
      }
    });

    UI.els.dashFinanceiroSelector.addEventListener('change', async (e) => {
      const sheetName = e.target.value;
      if (sheetName) {
        await renderChartFinanceiroForSheet(sheetName);
      }
    });

    // ---- Eventos da Chamada Geral ----
    UI.els.geralSheetSelector.addEventListener('change', async (e) => {
      const sheetName = e.target.value;
      if (!sheetName) {
        UI.showGeralState('empty');
        return;
      }
      state.geralSheetName = sheetName;
      await loadGeralData(sheetName);
    });

    UI.els.geralSubjectSelector.addEventListener('change', (e) => {
      const subject = e.target.value;
      state.currentSubject = subject;
      if (!subject) {
        UI.showGeralState('empty');
      } else {
        UI.renderGeralStudents(state.geralStudents, subject, state.geralReadonly || false);
      }
    });

    UI.els.geralSearchInput.addEventListener('input', (e) => {
      UI.filterGeralStudents(e.target.value);
    });

    UI.els.geralBtnRetry.addEventListener('click', () => {
      if (state.geralSheetName) {
        loadGeralData(state.geralSheetName);
      } else {
        loadGeralSheets();
      }
    });

    // Clique nos botões +/- da Geral (delegação de eventos)
    UI.els.geralStudentList.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-geral-action');
      if (!btn || btn.disabled) return;

      const row = parseInt(btn.dataset.row, 10);
      const type = btn.dataset.type; // "P" ou "F"
      const action = btn.dataset.action; // "increment" ou "decrement"
      const subject = state.currentSubject;

      // Encontra aluno no estado local
      const student = state.geralStudents.find(s => s.rowIndex === row);
      if (!student) return;

      let currentVal = student.attendance[subject] ? student.attendance[subject][type] : 0;
      let newVal = action === 'increment' ? currentVal + 1 : currentVal - 1;
      if (newVal < 0) newVal = 0; // Não permite negativo

      if (newVal === currentVal) return;

      // Feedback visual otimista
      const prevVal = currentVal;
      student.attendance[subject][type] = newVal;
      UI.updateGeralCounterValue(row, type, newVal);
      
      btn.disabled = true;

      try {
        await API.updateGeralAttendance({
          sheetName: state.geralSheetName,
          rowIndex: row,
          subjectName: subject,
          type: type,
          value: newVal
        });
        UI.showToast(`${type === 'P' ? 'Presença' : 'Falta'} atualizada!`);
      } catch (err) {
        // Reverte visual em caso de erro
        student.attendance[subject][type] = prevVal;
        UI.updateGeralCounterValue(row, type, prevVal);
        UI.showToast('Erro ao atualizar.', 'error');
      } finally {
        btn.disabled = false;
      }
    });

    // ---- Eventos Financeiro ----
    UI.els.financeiroSheetSelector.addEventListener('change', async (e) => {
      const sheetName = e.target.value;
      if (!sheetName) {
        UI.showFinanceiroState('empty');
        return;
      }
      state.financeiroSheetName = sheetName;
      await loadFinanceiroData(sheetName);
    });

    UI.els.financeiroSearchInput.addEventListener('input', (e) => {
      UI.filterFinanceiroStudents(e.target.value);
    });

    UI.els.financeiroBtnRetry.addEventListener('click', () => {
      if (state.financeiroSheetName) {
        loadFinanceiroData(state.financeiroSheetName);
      } else {
        loadFinanceiroSheets();
      }
    });

    // Inputs do Financeiro (change para salvar)
    UI.els.financeiroStudentList.addEventListener('change', async (e) => {
      if (!e.target.classList.contains('financeiro-input')) return;

      const input = e.target;
      const row = parseInt(input.dataset.row, 10);
      const col = parseInt(input.dataset.col, 10);
      let value = input.value;
      const type = input.dataset.type;

      // Se for uma data (pagamento), converte de YYYY-MM-DD para DD/MM/YYYY
      if (type === 'pagamento' && value) {
        const parts = value.split('-');
        if (parts.length === 3) {
          value = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }

      input.disabled = true;

      try {
        await API.updateFinanceiroField({
          sheetName: state.financeiroSheetName,
          rowIndex: row,
          colIndex: col,
          value: value
        });
        
        UI.showToast('Dado financeiro atualizado!');
      } catch (err) {
        UI.showToast('Erro ao atualizar financeiro.', 'error');
      } finally {
        input.disabled = false;
      }
    });

    // ---- Eventos Matriculados ----
    UI.els.matriculadosSheetSelector.addEventListener('change', async (e) => {
      const sheetName = e.target.value;
      if (!sheetName) {
        UI.showMatriculadosState('empty');
        return;
      }
      state.matriculadosSheetName = sheetName;
      await loadMatriculadosData(sheetName);
    });

    UI.els.matriculadosSearchInput.addEventListener('input', (e) => {
      UI.filterMatriculadosStudents(e.target.value);
    });

    UI.els.matriculadosBtnRetry.addEventListener('click', () => {
      if (state.matriculadosSheetName) {
        loadMatriculadosData(state.matriculadosSheetName);
      } else {
        loadMatriculadosSheets();
      }
    });

    // ---- Eventos Notificações ----
    UI.els.notificacaoSheetSelector.addEventListener('change', async (e) => {
      const sheetName = e.target.value;
      if (!sheetName) {
        UI.showNotificacaoState('empty');
        return;
      }
      state.notificacaoSheetName = sheetName;
      await loadNotificacaoData(sheetName);
    });

    UI.els.notificacaoTypeSelector.addEventListener('change', (e) => {
      UI.updateNotificacaoTemplate(e.target.value, UI.els.notificacaoDueDate.value);
      UI.updateWppTemplate(e.target.value, UI.els.notificacaoDueDate.value);
    });

    UI.els.notificacaoDueDate.addEventListener('input', (e) => {
      UI.updateNotificacaoTemplate(UI.els.notificacaoTypeSelector.value, e.target.value);
      UI.updateWppTemplate(UI.els.notificacaoTypeSelector.value, e.target.value);
    });

    UI.els.chkSelectAll.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const checkboxes = UI.els.notificacaoStudentList.querySelectorAll('.student-checkbox');
      checkboxes.forEach(chk => chk.checked = isChecked);
    });

    // Mantém o checkbox "Todos" sincronizado se o usuário marcar/desmarcar individualmente
    UI.els.notificacaoStudentList.addEventListener('change', (e) => {
      if (e.target.classList.contains('student-checkbox')) {
        const checkboxes = UI.els.notificacaoStudentList.querySelectorAll('.student-checkbox');
        const checkedBoxes = UI.els.notificacaoStudentList.querySelectorAll('.student-checkbox:checked');
        
        UI.els.chkSelectAll.checked = (checkboxes.length === checkedBoxes.length);
        UI.els.chkSelectAll.indeterminate = (checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length);
      }
    });

    // ---- WhatsApp: Selecionar Todos ----
    UI.els.chkWppSelectAll.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const checkboxes = UI.els.wppStudentList.querySelectorAll('.wpp-student-checkbox');
      checkboxes.forEach(chk => chk.checked = isChecked);
    });

    // Mantém checkbox WPP sincronizado
    UI.els.wppStudentList.addEventListener('change', (e) => {
      if (e.target.classList.contains('wpp-student-checkbox')) {
        const checkboxes = UI.els.wppStudentList.querySelectorAll('.wpp-student-checkbox');
        const checkedBoxes = UI.els.wppStudentList.querySelectorAll('.wpp-student-checkbox:checked');
        UI.els.chkWppSelectAll.checked = (checkboxes.length === checkedBoxes.length);
        UI.els.chkWppSelectAll.indeterminate = (checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length);
      }
    });

    // ---- WhatsApp: Status e QR Code ----
    let wppStatusInterval = null;

    async function fetchWppStatus() {
      try {
        const data = await API.getWhatsAppStatus();
        
        UI.els.wppQrLoading.classList.add('d-none');
        UI.els.wppQrContainer.classList.add('d-none');
        UI.els.wppConnectedState.classList.add('d-none');
        UI.els.btnWppLogout.classList.add('d-none');

        if (data.status === 'CONNECTED') {
          UI.els.wppConnectedState.classList.remove('d-none');
          UI.els.btnWppLogout.classList.remove('d-none');
          if (wppStatusInterval) {
            clearInterval(wppStatusInterval);
            wppStatusInterval = null;
          }
        } else if (data.status === 'QR_READY' && data.qrCode) {
          UI.els.wppQrImage.src = data.qrCode;
          UI.els.wppQrContainer.classList.remove('d-none');
        } else {
          UI.els.wppQrLoading.classList.remove('d-none');
        }
      } catch (err) {
        console.error('Erro ao buscar status do WPP', err);
      }
    }

    UI.els.btnWppStatus.addEventListener('click', () => {
      UI.modals.wppQr.show();
      UI.els.wppQrLoading.classList.remove('d-none');
      UI.els.wppQrContainer.classList.add('d-none');
      UI.els.wppConnectedState.classList.add('d-none');
      UI.els.btnWppLogout.classList.add('d-none');
      
      fetchWppStatus();
      
      if (!wppStatusInterval) {
        wppStatusInterval = setInterval(fetchWppStatus, 3000);
      }
    });

    // Quando o modal for fechado, para o polling
    UI.els.wppQrModal.addEventListener('hidden.bs.modal', () => {
      if (wppStatusInterval) {
        clearInterval(wppStatusInterval);
        wppStatusInterval = null;
      }
    });

    UI.els.btnWppLogout.addEventListener('click', async () => {
      if (!confirm('Tem certeza que deseja desconectar o WhatsApp? Será necessário escanear o QR Code novamente.')) return;
      
      const btn = UI.els.btnWppLogout;
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Desconectando...';
      btn.disabled = true;

      try {
        await API.logoutWhatsApp();
        UI.showToast('WhatsApp desconectado.', 'success');
        // Volta a consultar o status
        fetchWppStatus();
        if (!wppStatusInterval) {
          wppStatusInterval = setInterval(fetchWppStatus, 3000);
        }
      } catch (err) {
        UI.showToast('Erro ao desconectar.', 'error');
      } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    });

    // ---- WhatsApp: Enviar ----
    UI.els.btnSendWpp.addEventListener('click', async () => {
      const checkboxes = UI.els.wppStudentList.querySelectorAll('.wpp-student-checkbox:checked');
      const selectedStudents = Array.from(checkboxes).map(chk => chk.value);

      if (selectedStudents.length === 0 && !state.wppTestMode) {
        UI.showToast('Selecione pelo menos um aluno.', 'error');
        return;
      }

      const template = UI.els.wppTemplate.value.trim();
      if (!template) {
        UI.showToast('A mensagem WhatsApp não pode estar vazia.', 'error');
        return;
      }

      const modeLabel = state.wppTestMode
        ? `(MODO TESTE → números da aba "${state.wppTestSheetName}")`
        : `para ${selectedStudents.length} aluno(s)`;
      const confirmMsg = `Enviar mensagem WhatsApp ${modeLabel}?`;
      if (!confirm(confirmMsg)) return;

      const btn = UI.els.btnSendWpp;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Enviando...';
      btn.disabled = true;

      try {
        const result = await API.sendWhatsAppNotifications({
          sheetName: state.notificacaoSheetName,
          messageTemplate: template,
          dueDate: UI.els.notificacaoDueDate.value,
          selectedStudents: selectedStudents
        });

        if (result.success) {
          UI.showToast(`✅ ${result.message}`, 'success');
        } else {
          UI.showToast(result.error || 'Erro ao enviar WhatsApp', 'error');
        }
      } catch (err) {
        UI.showToast(`Erro: ${err.message}`, 'error');
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });

    UI.els.btnSendNotifications.addEventListener('click', async () => {
      const checkboxes = UI.els.notificacaoStudentList.querySelectorAll('.student-checkbox:checked');
      const selectedStudents = Array.from(checkboxes).map(chk => chk.value);

      if (selectedStudents.length === 0) {
        UI.showToast('Selecione pelo menos um aluno.', 'error');
        return;
      }

      const template = UI.els.notificacaoTemplate.value.trim();
      if (!template) {
        UI.showToast('A mensagem não pode estar vazia.', 'error');
        return;
      }

      const confirmMsg = `Tem certeza que deseja enviar e-mails para ${selectedStudents.length} aluno(s)?\n\n(Lembre-se: se estiver em modo teste, tudo será enviado de eronjr17.ej@gmail.com e redirecionado para preparaumadsal@gmail.com)`;
      if (!confirm(confirmMsg)) return;

      const btn = UI.els.btnSendNotifications;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Enviando...';
      btn.disabled = true;

      try {
        const result = await API.sendNotifications({
          sheetName: state.notificacaoSheetName,
          type: UI.els.notificacaoTypeSelector.value,
          messageTemplate: template,
          dueDate: UI.els.notificacaoDueDate.value,
          selectedStudents: selectedStudents
        });

        if (result.success) {
          UI.showToast(`Sucesso! ${result.message}`, 'success');
        } else {
          UI.showToast(result.error || 'Erro ao enviar', 'error');
        }
      } catch (err) {
        UI.showToast('Erro de conexão ao tentar enviar os e-mails.', 'error');
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }

  // ============================================
  // Carregamento de dados
  // ============================================
  async function loadSheets() {
    try {
      // CHAMADA OFICIAL é a única fonte de dados — carrega direto sem seletor
      const targetSheet = 'CHAMADA OFICIAL';
      state.currentSheet = targetSheet;

      // Oculta o seletor de turma (não é mais necessário)
      const sheetSelectorGroup = UI.els.sheetSelector
        ? UI.els.sheetSelector.closest('.control-group')
        : null;
      if (sheetSelectorGroup) sheetSelectorGroup.style.display = 'none';

      await loadAttendanceData(targetSheet);
    } catch (err) {
      console.error('Erro ao carregar chamada:', err);
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

      // Popula datas na ordem cronológica correta e seleciona a mais próxima de hoje
      const selectedIdx = UI.populateDates(data.headers);
      const activeIdx = selectedIdx !== -1 ? selectedIdx : Math.max(0, data.headers.length - 1);

      // Renderiza alunos com a data selecionada
      state.selectedDateIndex = activeIdx;
      UI.renderStudents(state.students, activeIdx, data.headers[activeIdx]);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      UI.showError('Não foi possível carregar os dados de presença.');
    }
  }

  // ============================================
  // Carregamento de dados (Geral)
  // ============================================
  async function loadGeralSheets() {
    try {
      // Dados da Chamada Geral são calculados a partir da CHAMADA OFICIAL
      const targetSheet = 'CHAMADA OFICIAL';
      state.geralSheets = [targetSheet];
      state.geralSheetName = targetSheet;

      // Oculta o seletor de turma da Chamada Geral (só existe uma fonte)
      const geralSheetSelectorGroup = UI.els.geralSheetSelector
        ? UI.els.geralSheetSelector.closest('.control-group')
        : null;
      if (geralSheetSelectorGroup) geralSheetSelectorGroup.style.display = 'none';

      await loadGeralData(targetSheet);
    } catch (err) {
      console.error('Erro ao carregar Chamada Geral:', err);
      UI.showGeralState('error');
      UI.els.geralErrorMessage.textContent = 'Não foi possível conectar à planilha.';
    }
  }

  async function loadGeralData(sheetName) {
    UI.showGeralState('loading');
    try {
      const data = await API.fetchGeralData(sheetName);
      if (!data.success) {
        UI.showGeralState('error');
        UI.els.geralErrorMessage.textContent = data.error || 'Erro desconhecido';
        return;
      }

      state.geralSubjects = data.subjects;
      state.geralStudents = data.students;
      state.geralReadonly = data.readonly || false;

      if (state.geralSubjects.length === 0) {
        UI.showGeralState('error');
        UI.els.geralErrorMessage.textContent = 'Nenhuma disciplina encontrada.';
        return;
      }

      UI.populateGeralSubjects(state.geralSubjects);

      // Auto-seleciona a primeira disciplina se não houver seleção
      if (!state.currentSubject || !state.geralSubjects.includes(state.currentSubject)) {
        state.currentSubject = state.geralSubjects[0];
        UI.els.geralSubjectSelector.value = state.currentSubject;
      }

      UI.renderGeralStudents(state.geralStudents, state.currentSubject, state.geralReadonly);

    } catch (err) {
      console.error('Erro ao carregar dados gerais:', err);
      UI.showGeralState('error');
      UI.els.geralErrorMessage.textContent = 'Falha ao conectar ou processar os dados da Chamada Geral.';
    }
  }

  // ============================================
  // Carregamento de dados (Financeiro)
  // ============================================
  async function loadFinanceiroSheets() {
    try {
      const data = await API.fetchFinanceiroSheets();
      if (data.success && data.sheets.length > 0) {
        state.financeiroSheets = data.sheets;
        UI.populateFinanceiroSheets(data.sheets);
        
        const targetSheet = data.sheets[0];
        UI.els.financeiroSheetSelector.value = targetSheet;
        state.financeiroSheetName = targetSheet;
        await loadFinanceiroData(targetSheet);
      } else {
        UI.showFinanceiroState('error');
        UI.els.financeiroErrorMessage.textContent = 'Nenhuma aba de Financeiro encontrada.';
      }
    } catch (err) {
      console.error('Erro ao carregar abas do Financeiro:', err);
      UI.showFinanceiroState('error');
      UI.els.financeiroErrorMessage.textContent = 'Não foi possível conectar à planilha.';
    }
  }

  async function loadFinanceiroData(sheetName) {
    UI.showFinanceiroState('loading');
    try {
      const data = await API.fetchFinanceiroData(sheetName);
      if (!data.success) {
        UI.showFinanceiroState('error');
        UI.els.financeiroErrorMessage.textContent = data.error || 'Erro desconhecido';
        return;
      }

      state.financeiroMonths = data.months;
      state.financeiroMonthColMap = data.monthColMap;
      state.financeiroStudents = data.students;

      if (state.financeiroMonths.length === 0) {
        UI.showFinanceiroState('error');
        UI.els.financeiroErrorMessage.textContent = 'Nenhum mês (coluna) encontrado na aba FINANCEIRO.';
        return;
      }

      UI.renderFinanceiroStudents(state.financeiroStudents, state.financeiroMonths, state.financeiroMonthColMap);

    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
      UI.showFinanceiroState('error');
      UI.els.financeiroErrorMessage.textContent = 'Falha ao conectar ou processar os dados do Financeiro.';
    }
  }

  // ============================================
  // Carregamento de dados (Matriculados)
  // ============================================
  async function loadMatriculadosSheets() {
    try {
      const data = await API.fetchMatriculadosSheets();
      if (data.success && data.sheets.length > 0) {
        state.matriculadosSheets = data.sheets;
        UI.populateMatriculadosSheets(data.sheets);
        
        const targetSheet = data.sheets[0];
        UI.els.matriculadosSheetSelector.value = targetSheet;
        state.matriculadosSheetName = targetSheet;
        await loadMatriculadosData(targetSheet);
      } else {
        UI.showMatriculadosState('error');
        UI.els.matriculadosErrorMessage.textContent = 'Nenhuma aba de Matriculados encontrada.';
      }
    } catch (err) {
      console.error('Erro ao carregar abas de Matriculados:', err);
      UI.showMatriculadosState('error');
      UI.els.matriculadosErrorMessage.textContent = 'Não foi possível conectar à planilha.';
    }
  }

  async function loadMatriculadosData(sheetName) {
    UI.showMatriculadosState('loading');
    try {
      const data = await API.fetchMatriculadosData(sheetName);
      if (!data.success) {
        UI.showMatriculadosState('error');
        UI.els.matriculadosErrorMessage.textContent = data.error || 'Erro desconhecido';
        return;
      }

      state.matriculadosStudents = data.students;

      if (state.matriculadosStudents.length === 0) {
        UI.showMatriculadosState('error');
        UI.els.matriculadosErrorMessage.textContent = 'Nenhum aluno encontrado na aba selecionada.';
        return;
      }

      UI.renderMatriculadosStudents(state.matriculadosStudents);

    } catch (err) {
      console.error('Erro ao carregar dados de matriculados:', err);
      UI.showMatriculadosState('error');
      UI.els.matriculadosErrorMessage.textContent = 'Falha ao conectar ou processar os dados de Matriculados.';
    }
  }

  // ============================================
  // Carregamento de dados (Notificações)
  // ============================================
  // Reutiliza o mesmo método de matriculados, pois a estrutura da aba é a mesma
  async function loadNotificacaoSheets() {
    try {
      const data = await API.fetchMatriculadosSheets();
      if (data.success && data.sheets.length > 0) {
        state.notificacaoSheets = data.sheets;
        UI.populateNotificacaoSheets(data.sheets);
        
        const targetSheet = data.sheets[0];
        UI.els.notificacaoSheetSelector.value = targetSheet;
        state.notificacaoSheetName = targetSheet;
        await loadNotificacaoData(targetSheet);
      } else {
        UI.showNotificacaoState('empty');
      }
    } catch (err) {
      console.error('Erro ao carregar abas para Notificações:', err);
      UI.showNotificacaoState('empty');
    }
  }

  async function loadNotificacaoData(sheetName) {
    UI.showNotificacaoState('loading');
    UI.showWppState('loading');
    try {
      const data = await API.fetchMatriculadosData(sheetName);
      if (!data.success) {
        UI.showNotificacaoState('empty');
        UI.showWppState('empty');
        return;
      }

      state.notificacaoStudents = data.students;

      if (state.notificacaoStudents.length === 0) {
        UI.showNotificacaoState('empty');
        UI.showWppState('empty');
        return;
      }

      UI.renderNotificacaoStudents(state.notificacaoStudents);
      UI.renderWppStudents(state.notificacaoStudents);

    } catch (err) {
      console.error('Erro ao carregar dados para Notificações:', err);
      UI.showNotificacaoState('empty');
      UI.showWppState('empty');
    }
  }

  // ============================================
  // Dashboard & Gráficos
  // ============================================
  async function loadDashboardData() {
    try {
      // Chamada Diária e Chamada Geral usam CHAMADA OFICIAL como única fonte
      const OFICIAL = 'CHAMADA OFICIAL';
      state.dashDiarioSheets = [OFICIAL];
      state.dashGeralSheets  = [OFICIAL];

      let financeiroSheets = [];
      try {
        const financeiroRes = await API.fetchFinanceiroSheets();
        if (financeiroRes.success) financeiroSheets = financeiroRes.sheets;
      } catch (_) {}

      // Oculta seletores dos gráficos de chamada (único dataset)
      if (UI.els.dashDiarioSelector) {
        const grp = UI.els.dashDiarioSelector.closest('.control-group');
        if (grp) grp.style.display = 'none';
      }
      if (UI.els.dashGeralSelector) {
        const grp = UI.els.dashGeralSelector.closest('.control-group');
        if (grp) grp.style.display = 'none';
      }

      UI.populateDashSelectors([OFICIAL], [OFICIAL], financeiroSheets);

      // Renderiza gráficos com CHAMADA OFICIAL (ranking é carregado lazy ao clicar na aba)
      await Promise.all([
        renderChartDiarioForSheet(OFICIAL),
        renderChartEixosForSheet(OFICIAL),
        financeiroSheets.length > 0
          ? renderChartFinanceiroForSheet(financeiroSheets[0])
          : Promise.resolve(),
      ]);

      // Guarda a referência da sheet para o ranking (carregado quando usuário acessa a aba)
      state.dashOFICIALSheet = OFICIAL;

      if (financeiroSheets.length > 0) {
        UI.els.dashFinanceiroSelector.value = financeiroSheets[0];
      }

    } catch (err) {
      console.error('Erro ao carregar dados do Dashboard', err);
      UI.showToast('Erro ao carregar dados do Dashboard', 'error');
    }
  }

  async function renderChartDiarioForSheet(sheetName) {
    try {
      const data = await API.fetchAttendance(sheetName);
      if (!data.success) return;

      const rawLabels = data.headers; // As datas da planilha
      // Ordena cronologicamente para exibição no gráfico
      const sortedDates = rawLabels.map(d => ({
        dateStr: d,
        dateObj: UI.parseDateString(d),
      })).sort((a, b) => {
        if (a.dateObj && b.dateObj) return a.dateObj.getTime() - b.dateObj.getTime();
        if (a.dateObj) return -1;
        if (b.dateObj) return 1;
        return 0;
      });

      const labels = sortedDates.map(item => item.dateStr);
      const presentData = new Array(labels.length).fill(0);
      const absentData = new Array(labels.length).fill(0);
      const justifiedData = new Array(labels.length).fill(0);

      data.students.forEach(student => {
        labels.forEach((dateKey, index) => {
          const val = student.attendance[dateKey];
          if (val === 'P') presentData[index]++;
          if (val === 'F') absentData[index]++;
          if (val === 'FJ') justifiedData[index]++;
        });
      });

      UI.renderChartDiario(labels, presentData, absentData, justifiedData);
    } catch (err) {
      console.error('Erro ao renderizar gráfico diário', err);
    }
  }

  async function renderChartEixosForSheet(sheetName) {
    try {
      const data = await API.fetchGeralData(sheetName);
      if (!data.success) return;

      const labels = data.subjects; // Os eixos
      const presentData = new Array(labels.length).fill(0);
      const absentData = new Array(labels.length).fill(0);

      data.students.forEach(student => {
        labels.forEach((subject, index) => {
          const val = student.attendance[subject];
          if (val) {
            presentData[index] += val.P || 0;
            absentData[index] += val.F || 0;
          }
        });
      });

      UI.renderChartEixos(labels, presentData, absentData);
    } catch (err) {
      console.error('Erro ao renderizar gráfico de eixos', err);
    }
  }

  async function renderChartFinanceiroForSheet(sheetName) {
    try {
      const data = await API.fetchFinanceiroData(sheetName);
      if (!data.success) return;

      const labels = data.months; // Os meses
      const dataPercent = new Array(labels.length).fill(0);
      const totalStudents = data.students.length;

      if (totalStudents === 0) return;

      const paidCounts = new Array(labels.length).fill(0);

      data.students.forEach(student => {
        labels.forEach((month, index) => {
          const val = student.pagamentos[month];
          if (val && val.trim() !== '') {
            paidCounts[index]++;
          }
        });
      });

      labels.forEach((_, index) => {
        const percent = (paidCounts[index] / totalStudents) * 100;
        dataPercent[index] = Math.round(percent);
      });

      UI.renderChartFinanceiro(labels, dataPercent);
    } catch (err) {
      console.error('Erro ao renderizar gráfico financeiro', err);
    }
  }

  // ============================================
  // Tabs do Dashboard (Gráficos / Ranking)
  // ============================================

  let _dashRankingLoaded = false;
  let _dashPlanilhaLoaded = false;

  function switchDashTab(tab) {
    // Atualiza botões
    document.querySelectorAll('.dash-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    // Mostra/oculta panes
    document.querySelectorAll('.dash-tab-pane').forEach(pane => {
      pane.classList.toggle('d-none', pane.dataset.tab !== tab);
    });
    // Carrega ranking lazy na primeira visita
    if (tab === 'ranking' && !_dashRankingLoaded) {
      const sheet = state.dashOFICIALSheet || 'CHAMADA OFICIAL';
      renderDashRanking(sheet).then(() => { _dashRankingLoaded = true; });
    }
    // Carrega planilha lazy na primeira visita
    if (tab === 'planilha' && !_dashPlanilhaLoaded) {
      const sheet = state.dashOFICIALSheet || 'CHAMADA OFICIAL';
      renderDashPlanilha(sheet).then(() => { _dashPlanilhaLoaded = true; });
    }
  }

  function bindDashTabEvents() {
    document.querySelectorAll('.dash-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchDashTab(btn.dataset.tab));
    });
  }

  // Inicializa os listeners quando o DOM estiver pronto
  (function initDashTabs() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindDashTabEvents);
    } else {
      bindDashTabEvents();
    }
  })();

  // ============================================
  // Ranking de Frequência — Dashboard Prepara
  // ============================================

  /**
   * Calcula métricas de frequência de um aluno.
   * Ignora células vazias — considera APENAS datas com P ou F registrado.
   */
  function calcStudentMetricsDash(attendance, dates) {
    const markedDates = dates.filter(d => {
      const v = (attendance[d] || '').toUpperCase();
      return v === 'P' || v === 'F' || v === 'FJ';
    });

    let totalFaltas = 0;
    let totalJustificadas = 0;
    let maxConsecutivas = 0;
    let currentConsec = 0;
    let lastPresencaIdx = -1;

    for (let i = 0; i < markedDates.length; i++) {
      const val = (attendance[markedDates[i]] || '').toUpperCase();
      if (val === 'F') {
        totalFaltas++;
        currentConsec++;
        if (currentConsec > maxConsecutivas) maxConsecutivas = currentConsec;
      } else if (val === 'FJ') {
        totalJustificadas++;
        currentConsec = 0;
      } else if (val === 'P') {
        currentConsec = 0;
        lastPresencaIdx = i;
      }
    }

    const desdeUltimaPresenca = lastPresencaIdx === -1
      ? markedDates.length
      : markedDates.length - 1 - lastPresencaIdx;

    return { totalFaltas, totalJustificadas, maxConsecutivas, desdeUltimaPresenca, totalAulasRegistradas: markedDates.length };
  }

  /**
   * Classifica o status do aluno:
   * 🔴 Crítico  — > 6 faltas (7 ou mais)
   * 🟡 Atenção  — 4 a 6 faltas
   * 🟢 Regular  — menos de 4 faltas
   */
  function calcStatusDash({ totalFaltas, maxConsecutivas, desdeUltimaPresenca }) {
    if (totalFaltas >= 7 || maxConsecutivas >= 7 || desdeUltimaPresenca >= 7) return 'red';
    if (totalFaltas >= 4 || maxConsecutivas >= 4 || desdeUltimaPresenca >= 4) return 'yellow';
    return 'green';
  }

  /**
   * Ordena: 1º totalFaltas, 2º maxConsecutivas, 3º desdeUltimaPresenca (tudo desc)
   */
  function sortRankingDash(students) {
    return students.slice().sort((a, b) => {
      if (b.totalFaltas !== a.totalFaltas) return b.totalFaltas - a.totalFaltas;
      if (b.maxConsecutivas !== a.maxConsecutivas) return b.maxConsecutivas - a.maxConsecutivas;
      return b.desdeUltimaPresenca - a.desdeUltimaPresenca;
    });
  }

  /**
   * Busca os dados da CHAMADA OFICIAL, calcula as métricas e renderiza a tabela.
   */
  async function renderDashRanking(sheetName) {
    const loadingEl = document.getElementById('dashRankingLoading');
    const tableEl   = document.getElementById('dashRankingTable');
    const tbody     = document.getElementById('dashRankingTableBody');
    const emptyEl   = document.getElementById('dashRankingEmpty');

    if (!tbody) return;

    if (loadingEl) loadingEl.classList.remove('d-none');
    if (tableEl)   tableEl.style.display = 'none';

    try {
      const data = await API.fetchAttendance(sheetName);
      if (!data.success || !data.students || data.students.length === 0) {
        if (tableEl)   tableEl.style.display = 'none';
        if (emptyEl)   emptyEl.classList.remove('d-none');
        return;
      }

      // Ordena as datas cronologicamente para que o cálculo de faltas consecutivas seja fidedigno
      const rawDates = data.headers || [];
      const sortedDateObjs = rawDates.map(d => ({ str: d, date: UI.parseDateString(d) }))
        .sort((a, b) => (a.date && b.date ? a.date.getTime() - b.date.getTime() : 0));
      const dates = sortedDateObjs.map(d => d.str);

      let ranked = data.students.map(student => {
        const metrics = calcStudentMetricsDash(student.attendance || {}, dates);
        return {
          name:   student.name,
          ...metrics,
          status: calcStatusDash(metrics),
        };
      });

      ranked = sortRankingDash(ranked);

      // Renderiza linhas
      const statusLabel = { red: '🔴 Crítico', yellow: '🟡 Atenção', green: '🟢 Regular' };
      const statusClass = { red: 'status-red', yellow: 'status-yellow', green: 'status-green' };
      const rowClass    = { red: 'rank-red', yellow: 'rank-yellow', green: 'rank-green' };

      tbody.innerHTML = ranked.map((s, idx) => {
        const totalCls  = s.totalFaltas > 0  ? 'metric-total'  : 'metric-zero';
        const consecCls = s.maxConsecutivas > 0 ? 'metric-consec' : 'metric-zero';
        const sinceCls  = s.desdeUltimaPresenca > 0 ? 'metric-since' : 'metric-zero';

        const sinceLabel = s.desdeUltimaPresenca === 0
          ? '0'
          : s.desdeUltimaPresenca === s.totalAulasRegistradas && s.totalAulasRegistradas > 0
            ? `${s.desdeUltimaPresenca} ⚠️`
            : `${s.desdeUltimaPresenca}`;

        return `
          <tr class="${rowClass[s.status]}">
            <td class="col-pos"><span class="one-rank-pos">${idx + 1}</span></td>
            <td class="col-name"><span class="one-rank-name">${s.name}</span></td>
            <td class="col-total"><span class="one-rank-metric ${totalCls}">${s.totalFaltas}</span></td>
            <td class="col-consec"><span class="one-rank-metric ${consecCls}">${s.maxConsecutivas}</span></td>
            <td class="col-since"><span class="one-rank-metric ${sinceCls}">${sinceLabel}</span></td>
            <td class="col-status"><span class="one-rank-status ${statusClass[s.status]}">${statusLabel[s.status]}</span></td>
          </tr>`;
      }).join('');

      if (emptyEl) emptyEl.classList.add('d-none');
      if (tableEl) tableEl.style.display = '';

    } catch (err) {
      console.error('[Dash Ranking] Erro:', err);
    } finally {
      if (loadingEl) loadingEl.classList.add('d-none');
    }
  }

  /**
   * Busca e renderiza a planilha completa (CHAMADA OFICIAL) no estilo Google Sheets.
   */
  async function renderDashPlanilha(sheetName) {
    const loadingEl = document.getElementById('dashPlanilhaLoading');
    const tableEl   = document.getElementById('dashPlanilhaTable');
    const thead     = document.getElementById('dashPlanilhaTableHead');
    const tbody     = document.getElementById('dashPlanilhaTableBody');
    const emptyEl   = document.getElementById('dashPlanilhaEmpty');

    if (!tbody || !thead) return;

    if (loadingEl) loadingEl.classList.remove('d-none');
    if (tableEl)   tableEl.style.display = 'none';

    try {
      const data = await API.fetchAttendance(sheetName);
      if (!data.success || !data.students || data.students.length === 0) {
        if (tableEl)   tableEl.style.display = 'none';
        if (emptyEl)   emptyEl.classList.remove('d-none');
        return;
      }

      const dates = data.headers || [];

      // 1. Renderiza o cabeçalho (thead)
      let headHtml = '<tr><th>Aluno</th>';
      dates.forEach(date => {
        headHtml += `<th>${date}</th>`;
      });
      headHtml += '</tr>';
      thead.innerHTML = headHtml;

      // 2. Renderiza as linhas dos alunos (tbody)
      tbody.innerHTML = data.students.map(student => {
        let rowHtml = `<tr><td>${student.name}</td>`;
        dates.forEach(date => {
          const val = (student.attendance[date] || '').toUpperCase();
          if (val === 'P') {
            rowHtml += '<td class="sheet-cell-p">P</td>';
          } else if (val === 'F') {
            rowHtml += '<td class="sheet-cell-f">F</td>';
          } else {
            rowHtml += '<td class="sheet-cell-empty">-</td>';
          }
        });
        rowHtml += '</tr>';
        return rowHtml;
      }).join('');

      if (emptyEl) emptyEl.classList.add('d-none');
      if (tableEl) tableEl.style.display = '';

    } catch (err) {
      console.error('[Dash Planilha] Erro:', err);
    } finally {
      if (loadingEl) loadingEl.classList.add('d-none');
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
