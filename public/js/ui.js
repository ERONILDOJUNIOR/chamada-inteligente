/**
 * UI Module — Manipulação de DOM, renderização e animações
 */
const UI = {
  // Referências DOM
  els: {
    sheetSelector: document.getElementById('sheetSelector'),
    dateSelector: document.getElementById('dateSelector'),
    btnAddDate: document.getElementById('btnAddDate'),
    searchInput: document.getElementById('searchInput'),
    studentList: document.getElementById('studentList'),
    emptyState: document.getElementById('emptyState'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    btnRetry: document.getElementById('btnRetry'),
    summaryBar: document.getElementById('summaryBar'),
    totalPresent: document.getElementById('totalPresent'),
    totalAbsent: document.getElementById('totalAbsent'),
    totalPending: document.getElementById('totalPending'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    toastContainer: document.getElementById('toastContainer'),
    newDateInput: document.getElementById('newDateInput'),
    btnConfirmAddDate: document.getElementById('btnConfirmAddDate'),

    // Sidebar
    btnToggleSidebar: document.getElementById('btnToggleSidebar'),
    btnCloseSidebar: document.getElementById('btnCloseSidebar'),
    sidebar: document.getElementById('sidebar'),
    navDashboard: document.getElementById('navDashboard'),
    navDiaria: document.getElementById('navDiaria'),
    navGeral: document.getElementById('navGeral'),
    btnLogout: document.getElementById('btnLogout'),

    // Views
    viewDashboard: document.getElementById('viewDashboard'),
    viewDiaria: document.getElementById('viewDiaria'),
    viewGeral: document.getElementById('viewGeral'),
    viewFinanceiro: document.getElementById('viewFinanceiro'),
    viewMatriculados: document.getElementById('viewMatriculados'),
    viewNotificacoes: document.getElementById('viewNotificacoes'),
    navFinanceiro: document.getElementById('navFinanceiro'),
    navMatriculados: document.getElementById('navMatriculados'),
    navNotificacoes: document.getElementById('navNotificacoes'),
    navOneVoice: document.getElementById('navOneVoice'),

    // Views
    viewOneVoice: document.getElementById('viewOneVoice'),

    dashDiarioSelector: document.getElementById('dashDiarioSelector'),
    dashGeralSelector: document.getElementById('dashGeralSelector'),
    dashFinanceiroSelector: document.getElementById('dashFinanceiroSelector'),
    chartDiarioCanvas: document.getElementById('chartDiario'),
    chartEixosCanvas: document.getElementById('chartEixos'),
    chartFinanceiroCanvas: document.getElementById('chartFinanceiro'),

    // Geral Elements
    geralSheetSelector: document.getElementById('geralSheetSelector'),
    geralSubjectSelector: document.getElementById('geralSubjectSelector'),
    geralSearchInput: document.getElementById('geralSearchInput'),
    geralEmptyState: document.getElementById('geralEmptyState'),
    geralLoadingState: document.getElementById('geralLoadingState'),
    geralStudentList: document.getElementById('geralStudentList'),
    geralErrorState: document.getElementById('geralErrorState'),
    geralErrorMessage: document.getElementById('geralErrorMessage'),
    geralBtnRetry: document.getElementById('geralBtnRetry'),

    // Financeiro Elements
    financeiroSheetSelector: document.getElementById('financeiroSheetSelector'),
    financeiroSearchInput: document.getElementById('financeiroSearchInput'),
    financeiroEmptyState: document.getElementById('financeiroEmptyState'),
    financeiroLoadingState: document.getElementById('financeiroLoadingState'),
    financeiroStudentList: document.getElementById('financeiroStudentList'),
    financeiroErrorState: document.getElementById('financeiroErrorState'),
    financeiroErrorMessage: document.getElementById('financeiroErrorMessage'),
    financeiroBtnRetry: document.getElementById('financeiroBtnRetry'),

    // Matriculados Elements
    matriculadosSheetSelector: document.getElementById('matriculadosSheetSelector'),
    matriculadosSearchInput: document.getElementById('matriculadosSearchInput'),
    matriculadosEmptyState: document.getElementById('matriculadosEmptyState'),
    matriculadosLoadingState: document.getElementById('matriculadosLoadingState'),
    matriculadosStudentList: document.getElementById('matriculadosStudentList'),
    matriculadosErrorState: document.getElementById('matriculadosErrorState'),
    matriculadosErrorMessage: document.getElementById('matriculadosErrorMessage'),
    matriculadosBtnRetry: document.getElementById('matriculadosBtnRetry'),

    // Notificacoes Elements
    notificacaoSheetSelector: document.getElementById('notificacaoSheetSelector'),
    notificacaoTypeSelector: document.getElementById('notificacaoTypeSelector'),
    notificacaoDueDate: document.getElementById('notificacaoDueDate'),
    notificacaoTemplate: document.getElementById('notificacaoTemplate'),
    notificacaoStudentList: document.getElementById('notificacaoStudentList'),
    notificacaoEmptyState: document.getElementById('notificacaoEmptyState'),
    notificacaoLoadingState: document.getElementById('notificacaoLoadingState'),
    chkSelectAll: document.getElementById('chkSelectAll'),
    btnSendNotifications: document.getElementById('btnSendNotifications'),
    btnSendNotificationsText: document.getElementById('btnSendNotificationsText'),
    notificacaoTestModeAlert: document.getElementById('notificacaoTestModeAlert'),

    // WhatsApp Elements
    wppTemplate: document.getElementById('wppTemplate'),
    wppStudentList: document.getElementById('wppStudentList'),
    wppEmptyState: document.getElementById('wppEmptyState'),
    wppLoadingState: document.getElementById('wppLoadingState'),
    chkWppSelectAll: document.getElementById('chkWppSelectAll'),
    btnSendWpp: document.getElementById('btnSendWpp'),
    btnSendWppText: document.getElementById('btnSendWppText'),
    wppTestModeAlert: document.getElementById('wppTestModeAlert'),
    wppTestSheetNameLabel: document.getElementById('wppTestSheetNameLabel'),
    tabBtnEmail: document.getElementById('tabBtnEmail'),
    tabBtnWpp: document.getElementById('tabBtnWpp'),
    tabPanelEmail: document.getElementById('tabPanelEmail'),
    tabPanelWpp: document.getElementById('tabPanelWpp'),

    // WhatsApp Modal Elements
    wppQrModal: document.getElementById('wppQrModal'),
    wppQrLoading: document.getElementById('wppQrLoading'),
    wppQrContainer: document.getElementById('wppQrContainer'),
    wppQrImage: document.getElementById('wppQrImage'),
    wppConnectedState: document.getElementById('wppConnectedState'),
    btnWppLogout: document.getElementById('btnWppLogout'),
    btnWppStatus: document.getElementById('btnWppStatus'),
  },

  // Instâncias de Modal
  modals: {
    addDate: null,
    wppQr: null,
  },

  initModals() {
    if (this.els.addDateModal && !this.modals.addDate) {
      this.modals.addDate = new bootstrap.Modal(this.els.addDateModal);
    }
    if (this.els.wppQrModal && !this.modals.wppQr) {
      this.modals.wppQr = new bootstrap.Modal(this.els.wppQrModal);
    }
  },

  /**
   * Mostra um estado específico (empty, loading, list, error)
   */
  showState(state) {
    const { emptyState, loadingState, studentList, errorState, summaryBar } = this.els;
    emptyState.classList.toggle('d-none', state !== 'empty');
    loadingState.classList.toggle('d-none', state !== 'loading');
    studentList.classList.toggle('d-none', state !== 'list');
    errorState.classList.toggle('d-none', state !== 'error');
    summaryBar.classList.toggle('d-none', state !== 'list');
  },

  /**
   * Popula o dropdown de turmas
   * @param {string[]} sheets
   */
  populateSheets(sheets) {
    const { sheetSelector } = this.els;
    sheetSelector.innerHTML = '<option value="">Selecione a turma...</option>';
    sheets.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      sheetSelector.appendChild(opt);
    });
    sheetSelector.disabled = false;
  },

  /**
   * Popula o dropdown de datas
   * @param {string[]} dates
   */
  populateDates(dates) {
    const { dateSelector, btnAddDate, searchInput } = this.els;
    dateSelector.innerHTML = '<option value="">Selecione a data...</option>';
    dates.forEach((date, idx) => {
      const opt = document.createElement('option');
      opt.value = idx.toString();
      opt.textContent = date;
      dateSelector.appendChild(opt);
    });
    dateSelector.disabled = false;
    btnAddDate.disabled = false;
    searchInput.disabled = false;

    // Auto-seleciona a última data (encontro mais recente)
    if (dates.length > 0) {
      dateSelector.value = (dates.length - 1).toString();
    }
  },

  /**
   * Gera as iniciais do nome para o avatar
   * @param {string} name
   * @returns {string}
   */
  getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  },

  /**
   * Renderiza os cards dos alunos
   * @param {Array} students
   * @param {number} dateColIndex - Índice da coluna de data selecionada (0-based nas datas, +1 para coluna real)
   * @param {string} dateKey - Nome da data selecionada
   */
  renderStudents(students, dateColIndex, dateKey) {
    const { studentList } = this.els;
    studentList.innerHTML = '';

    students.forEach((student, i) => {
      const currentValue = student.attendance[dateKey] || '';
      const statusClass = currentValue === 'P' ? 'status-present' : currentValue === 'F' ? 'status-absent' : '';
      const statusText = currentValue === 'P' ? 'Presente ✓' : currentValue === 'F' ? 'Falta ✗' : 'Pendente';

      const card = document.createElement('div');
      card.className = `student-card ${statusClass}`;
      card.style.animationDelay = `${i * 0.04}s`;
      card.dataset.studentIndex = i;
      card.dataset.rowIndex = student.rowIndex;
      card.dataset.name = student.name.toLowerCase();

      card.innerHTML = `
        <div class="student-info">
          <div class="student-name-section">
            <div class="student-avatar">${this.getInitials(student.name)}</div>
            <div>
              <div class="student-name" title="${student.name}">${student.name}</div>
              <div class="student-status" data-status-label>${statusText}</div>
            </div>
          </div>
          <div class="attendance-buttons">
            <button class="btn-attendance btn-present ${currentValue === 'P' ? 'active' : ''}"
                    data-row="${student.rowIndex}" data-col="${dateColIndex + 1}" data-value="P"
                    aria-label="Presente">P</button>
            <button class="btn-attendance btn-absent ${currentValue === 'F' ? 'active' : ''}"
                    data-row="${student.rowIndex}" data-col="${dateColIndex + 1}" data-value="F"
                    aria-label="Falta">F</button>
          </div>
        </div>
      `;

      studentList.appendChild(card);
    });

    this.showState('list');
    this.updateSummary(students, dateKey);
  },

  /**
   * Atualiza visualmente um card após salvar
   */
  updateCardVisual(card, value) {
    card.classList.remove('status-present', 'status-absent');
    card.classList.add(value === 'P' ? 'status-present' : 'status-absent');

    const statusLabel = card.querySelector('[data-status-label]');
    statusLabel.textContent = value === 'P' ? 'Presente ✓' : 'Falta ✗';

    const btnP = card.querySelector('.btn-present');
    const btnF = card.querySelector('.btn-absent');
    btnP.classList.toggle('active', value === 'P');
    btnF.classList.toggle('active', value === 'F');
  },

  /**
   * Atualiza a barra de resumo
   */
  updateSummary(students, dateKey) {
    let present = 0, absent = 0, pending = 0;
    students.forEach(s => {
      const v = s.attendance[dateKey] || '';
      if (v === 'P') present++;
      else if (v === 'F') absent++;
      else pending++;
    });

    this.els.totalPresent.textContent = present;
    this.els.totalAbsent.textContent = absent;
    this.els.totalPending.textContent = pending;

    const total = students.length;
    const filledPct = total > 0 ? Math.round(((present + absent) / total) * 100) : 0;
    this.els.progressFill.style.width = `${filledPct}%`;
    this.els.progressText.textContent = `${filledPct}%`;
  },

  /**
   * Filtra alunos pelo nome
   */
  filterStudents(query) {
    const cards = this.els.studentList.querySelectorAll('.student-card');
    const q = query.toLowerCase().trim();
    cards.forEach(card => {
      const name = card.dataset.name;
      card.style.display = !q || name.includes(q) ? '' : 'none';
    });
  },

  /**
   * Mostra toast notification
   */
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-custom toast-${type} show`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="toast-body">
        <i class="bi ${type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}"></i>
        ${message}
      </div>
    `;
    this.els.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  },

  /**
   * Mostra estado de erro
   */
  showError(message) {
    this.els.errorMessage.textContent = message;
    this.showState('error');
  },

  // ==========================================
  // Chamada Geral UI
  // ==========================================

  showGeralState(state) {
    const { geralEmptyState, geralLoadingState, geralStudentList, geralErrorState } = this.els;
    geralEmptyState.classList.toggle('d-none', state !== 'empty');
    geralLoadingState.classList.toggle('d-none', state !== 'loading');
    geralStudentList.classList.toggle('d-none', state !== 'list');
    geralErrorState.classList.toggle('d-none', state !== 'error');
  },

  populateGeralSheets(sheets) {
    const { geralSheetSelector } = this.els;
    geralSheetSelector.innerHTML = '<option value="">Selecione a turma...</option>';
    sheets.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      geralSheetSelector.appendChild(opt);
    });
    geralSheetSelector.disabled = false;
  },

  populateGeralSubjects(subjects) {
    const { geralSubjectSelector, geralSearchInput } = this.els;
    geralSubjectSelector.innerHTML = '<option value="">Selecione o eixo/disciplina...</option>';
    subjects.forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = sub;
      geralSubjectSelector.appendChild(opt);
    });
    geralSubjectSelector.disabled = false;
    geralSearchInput.disabled = false;
  },

  renderGeralStudents(students, subjectName, readonly) {
    const { geralStudentList } = this.els;
    geralStudentList.innerHTML = '';

    students.forEach((student, i) => {
      const att = student.attendance[subjectName] || { P: 0, F: 0 };
      const totalAulas = att.P + att.F;
      const pct = totalAulas > 0 ? Math.round((att.P / totalAulas) * 100) : 0;

      const card = document.createElement('div');
      card.className = 'student-card';
      card.style.animationDelay = `${i * 0.04}s`;
      card.dataset.rowIndex = student.rowIndex;
      card.dataset.name = student.name.toLowerCase();

      if (readonly) {
        // Versão somente leitura (CHAMADA OFICIAL): exibe contadores como texto
        card.innerHTML = `
          <div class="student-info" style="flex-wrap: wrap; gap: 16px;">
            <div class="student-name-section" style="min-width: 200px; flex: 1;">
              <div class="student-avatar">${this.getInitials(student.name)}</div>
              <div>
                <div class="student-name" title="${student.name}">${student.name}</div>
                <div class="student-status">${subjectName}</div>
              </div>
            </div>
            <div class="geral-controls-group" style="align-items: center; gap: 20px;">
              <div style="text-align: center;">
                <div style="font-size: 1.4rem; font-weight: 700; color: var(--success-color, #22c55e);">${att.P}</div>
                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Presenças</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 1.4rem; font-weight: 700; color: var(--error-color, #ef4444);">${att.F}</div>
                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Faltas</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary);">${pct}%</div>
                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Freq.</div>
              </div>
            </div>
          </div>
        `;
      } else {
        // Versão editável (Chamada Geral legada): exibe contadores com botões +/-
        card.innerHTML = `
          <div class="student-info" style="flex-wrap: wrap; gap: 16px;">
            <div class="student-name-section" style="min-width: 200px; flex: 1;">
              <div class="student-avatar">${this.getInitials(student.name)}</div>
              <div>
                <div class="student-name" title="${student.name}">${student.name}</div>
                <div class="student-status">Eixo: ${subjectName}</div>
              </div>
            </div>
            <div class="geral-controls-group">
              <div class="geral-counter">
                <span class="geral-counter-label text-success">Presenças</span>
                <div class="geral-counter-controls">
                  <button class="btn-counter btn-geral-action" data-action="decrement" data-type="P" data-row="${student.rowIndex}">-</button>
                  <span class="counter-value" id="val_P_${student.rowIndex}">${att.P}</span>
                  <button class="btn-counter btn-geral-action" data-action="increment" data-type="P" data-row="${student.rowIndex}">+</button>
                </div>
              </div>
              <div class="geral-counter">
                <span class="geral-counter-label text-danger">Faltas</span>
                <div class="geral-counter-controls">
                  <button class="btn-counter btn-geral-action" data-action="decrement" data-type="F" data-row="${student.rowIndex}">-</button>
                  <span class="counter-value" id="val_F_${student.rowIndex}">${att.F}</span>
                  <button class="btn-counter btn-geral-action" data-action="increment" data-type="F" data-row="${student.rowIndex}">+</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      geralStudentList.appendChild(card);
    });

    this.showGeralState('list');
  },

  updateGeralCounterValue(row, type, value) {
    const el = document.getElementById(`val_${type}_${row}`);
    if (el) el.textContent = value;
  },

  filterGeralStudents(query) {
    const cards = this.els.geralStudentList.querySelectorAll('.student-card');
    const q = query.toLowerCase().trim();
    cards.forEach(card => {
      const name = card.dataset.name;
      card.style.display = !q || name.includes(q) ? '' : 'none';
    });
  },

  // ==========================================
  // Dashboard & Charts
  // ==========================================

  charts: {
    diario: null,
    eixos: null,
    financeiro: null,
  },

  populateDashSelectors(diarioSheets, geralSheets, financeiroSheets = []) {
    const { dashDiarioSelector, dashGeralSelector, dashFinanceiroSelector } = this.els;

    dashDiarioSelector.innerHTML = '<option value="">Selecione a turma...</option>';
    diarioSheets.forEach(name => {
      dashDiarioSelector.appendChild(new Option(name, name));
    });
    dashDiarioSelector.disabled = false;

    dashGeralSelector.innerHTML = '<option value="">Selecione a turma geral...</option>';
    geralSheets.forEach(name => {
      dashGeralSelector.appendChild(new Option(name, name));
    });
    dashGeralSelector.disabled = false;

    if (dashFinanceiroSelector) {
      dashFinanceiroSelector.innerHTML = '<option value="">Selecione a turma financeiro...</option>';
      financeiroSheets.forEach(name => {
        dashFinanceiroSelector.appendChild(new Option(name, name));
      });
      dashFinanceiroSelector.disabled = false;
    }
  },

  renderChartDiario(labels, presentData, absentData) {
    const ctx = this.els.chartDiarioCanvas.getContext('2d');

    if (this.charts.diario) {
      this.charts.diario.destroy();
    }

    this.charts.diario = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Presenças',
            data: presentData,
            backgroundColor: '#3b82f6', // blue
            borderRadius: 4,
          },
          {
            label: 'Faltas',
            data: absentData,
            backgroundColor: '#ef4444', // red
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Montserrat' } } }
        },
        scales: {
          y: { beginAtZero: true, stacked: false },
          x: { stacked: false }
        }
      }
    });
  },

  renderChartEixos(labels, presentData, absentData) {
    const ctx = this.els.chartEixosCanvas.getContext('2d');

    if (this.charts.eixos) {
      this.charts.eixos.destroy();
    }

    this.charts.eixos = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Presenças',
            data: presentData,
            backgroundColor: '#3b82f6', // blue
            borderRadius: 4,
          },
          {
            label: 'Faltas',
            data: absentData,
            backgroundColor: '#ef4444', // red
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // Barra horizontal para eixos
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Montserrat' } } }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  },

  renderChartFinanceiro(labels, dataPercent) {
    const ctx = this.els.chartFinanceiroCanvas.getContext('2d');

    if (this.charts.financeiro) {
      this.charts.financeiro.destroy();
    }

    // Criando um gradiente bonito para o gráfico de linha/área
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.5)'); // accent-green com opacidade
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');

    this.charts.financeiro = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Alunos Pagantes (%)',
            data: dataPercent,
            borderColor: '#22c55e', // accent-green
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4, // Suaviza a curva
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#22c55e',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Montserrat' } } },
          tooltip: {
            callbacks: {
              label: function (context) {
                return ` ${context.parsed.y}% pagos`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100, // Porcentagem vai até 100
            ticks: {
              callback: function (value) {
                return value + '%';
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  },

  // ==========================================
  // Financeiro UI
  // ==========================================

  showFinanceiroState(state) {
    const { financeiroEmptyState, financeiroLoadingState, financeiroStudentList, financeiroErrorState } = this.els;
    financeiroEmptyState.classList.toggle('d-none', state !== 'empty');
    financeiroLoadingState.classList.toggle('d-none', state !== 'loading');
    financeiroStudentList.classList.toggle('d-none', state !== 'list');
    financeiroErrorState.classList.toggle('d-none', state !== 'error');
  },

  populateFinanceiroSheets(sheets) {
    const { financeiroSheetSelector } = this.els;
    financeiroSheetSelector.innerHTML = '<option value="">Selecione a turma...</option>';
    sheets.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      financeiroSheetSelector.appendChild(opt);
    });
    financeiroSheetSelector.disabled = false;
  },

  renderFinanceiroStudents(students, months, monthColMap) {
    const { financeiroStudentList, financeiroSearchInput } = this.els;
    financeiroStudentList.innerHTML = '';

    // Função auxiliar para converter DD/MM/YY(YY) para YYYY-MM-DD
    const parseDateForInput = (sheetDateStr) => {
      if (!sheetDateStr) return '';
      const parts = sheetDateStr.split('/');
      if (parts.length === 3) {
        let day = parts[0].padStart(2, '0');
        let month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) year = '20' + year;
        return `${year}-${month}-${day}`;
      }
      return ''; // Se não for data válida, deixa vazio para o input date
    };

    students.forEach((student, i) => {
      const card = document.createElement('div');
      card.className = 'student-card';
      card.style.animationDelay = `${i * 0.04}s`;
      card.dataset.rowIndex = student.rowIndex;
      card.dataset.name = student.name.toLowerCase();

      // Monta os inputs de meses
      let monthsHtml = '';
      months.forEach(month => {
        const colIdx = monthColMap[month];
        const val = student.pagamentos[month] || '';
        const dateVal = parseDateForInput(val);

        monthsHtml += `
          <div class="financeiro-month-input" style="display: flex; flex-direction: column; align-items: center;">
            <label style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">${month}</label>
            <input type="date" class="form-control glass-input financeiro-input" 
                   data-type="pagamento" data-row="${student.rowIndex}" data-col="${colIdx}" 
                   value="${dateVal}" style="padding: 4px; font-size: 0.85rem;">
          </div>
        `;
      });

      card.innerHTML = `
        <div class="student-info" style="flex-wrap: wrap; gap: 16px; align-items: flex-start;">
          <div class="student-name-section" style="min-width: 200px; flex: 1;">
            <div class="student-avatar">${this.getInitials(student.name)}</div>
            <div>
              <div class="student-name" title="${student.name}">${student.name}</div>
              <div class="student-status" style="font-size: 0.85rem;">Perfil: ${student.perfil} | Valor: ${student.valor}</div>
            </div>
          </div>
          
          <div class="financeiro-controls" style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: flex-end; flex: 2;">
            <div class="financeiro-month-input" style="display: flex; flex-direction: column; align-items: center; width: 60px;">
              <label style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">Venc.</label>
              <input type="number" class="form-control glass-input financeiro-input" 
                     data-type="vencimento" data-row="${student.rowIndex}" data-col="4" 
                     value="${student.dataVencimento}" placeholder="Dia" style="text-align: center; padding: 4px; font-size: 0.85rem;" min="1" max="31">
            </div>
            ${monthsHtml}
          </div>
        </div>
      `;

      financeiroStudentList.appendChild(card);
    });

    financeiroSearchInput.disabled = false;
    this.showFinanceiroState('list');
  },

  filterFinanceiroStudents(query) {
    const cards = this.els.financeiroStudentList.querySelectorAll('.student-card');
    const q = query.toLowerCase().trim();
    cards.forEach(card => {
      const name = card.dataset.name;
      card.style.display = !q || name.includes(q) ? '' : 'none';
    });
  },

  // ==========================================
  // Matriculados UI
  // ==========================================

  showMatriculadosState(state) {
    const { matriculadosEmptyState, matriculadosLoadingState, matriculadosStudentList, matriculadosErrorState } = this.els;
    matriculadosEmptyState.classList.toggle('d-none', state !== 'empty');
    matriculadosLoadingState.classList.toggle('d-none', state !== 'loading');
    matriculadosStudentList.classList.toggle('d-none', state !== 'list');
    matriculadosErrorState.classList.toggle('d-none', state !== 'error');
  },

  populateMatriculadosSheets(sheets) {
    const { matriculadosSheetSelector } = this.els;
    matriculadosSheetSelector.innerHTML = '<option value="">Selecione a aba de matriculados...</option>';
    sheets.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      matriculadosSheetSelector.appendChild(opt);
    });
    matriculadosSheetSelector.disabled = false;
  },

  renderMatriculadosStudents(students) {
    const { matriculadosStudentList, matriculadosSearchInput } = this.els;
    matriculadosStudentList.innerHTML = '';

    students.forEach((student, i) => {
      const card = document.createElement('div');
      card.className = 'student-card';
      card.style.animationDelay = `${i * 0.04}s`;
      card.dataset.name = student.name.toLowerCase();

      // Clean phone number for WhatsApp Link and display (remove non-digits)
      const cleanPhone = student.phone ? student.phone.replace(/\D/g, '') : '';
      const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : '#';

      card.innerHTML = `
        <div class="student-info" style="flex-wrap: wrap; gap: 16px;">
          <div class="student-name-section" style="min-width: 200px; flex: 1;">
            <div class="student-avatar">${this.getInitials(student.name)}</div>
            <div>
              <div class="student-name" title="${student.name}">${student.name}</div>
              <div class="student-status">
                ${student.email ? `<span style="display:block; margin-bottom:2px;"><i class="bi bi-envelope"></i> ${student.email}</span>` : ''}
                ${cleanPhone ? `<span><i class="bi bi-telephone"></i> ${cleanPhone}</span>` : ''}
              </div>
            </div>
          </div>
          
          <div class="attendance-buttons" style="justify-content: flex-end; align-items: center;">
            ${student.email ? `
              <button class="btn-contact" title="Copiar E-mail" onclick="UI.copyToClipboard('${student.email}', 'E-mail')">
                <i class="bi bi-copy"></i>
              </button>
            ` : ''}
            ${cleanPhone ? `
              <button class="btn-contact" title="Copiar Celular" onclick="UI.copyToClipboard('${cleanPhone}', 'Celular')">
                <i class="bi bi-clipboard"></i>
              </button>
              <a href="${waLink}" target="_blank" class="btn-contact btn-whatsapp" title="WhatsApp">
                <i class="bi bi-whatsapp"></i>
              </a>
            ` : ''}
          </div>
        </div>
      `;

      matriculadosStudentList.appendChild(card);
    });

    matriculadosSearchInput.disabled = false;
    this.showMatriculadosState('list');
  },

  filterMatriculadosStudents(query) {
    const cards = this.els.matriculadosStudentList.querySelectorAll('.student-card');
    const q = query.toLowerCase().trim();
    cards.forEach(card => {
      const name = card.dataset.name;
      card.style.display = !q || name.includes(q) ? '' : 'none';
    });
  },

  copyToClipboard(text, type) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(`${type} copiado para a área de transferência!`, 'success');
      }).catch(err => {
        console.error('Falha ao copiar', err);
        this.showToast(`Falha ao copiar ${type}`, 'error');
      });
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        this.showToast(`${type} copiado!`, 'success');
      } catch (err) {
        this.showToast(`Falha ao copiar ${type}`, 'error');
      }
      document.body.removeChild(textArea);
    }
  },

  // ==========================================
  // Notificações UI
  // ==========================================

  showNotificacaoState(state) {
    const { notificacaoEmptyState, notificacaoLoadingState, notificacaoStudentList } = this.els;
    notificacaoEmptyState.classList.toggle('d-none', state !== 'empty');
    notificacaoLoadingState.classList.toggle('d-none', state !== 'loading');
    notificacaoStudentList.classList.toggle('d-none', state !== 'list');

    // Mostra/esconde grid se for list
    if (state === 'list') {
      notificacaoStudentList.style.display = 'grid';
    } else {
      notificacaoStudentList.style.display = 'none';
    }
  },

  populateNotificacaoSheets(sheets) {
    const { notificacaoSheetSelector } = this.els;
    notificacaoSheetSelector.innerHTML = '<option value="">Selecione a turma...</option>';
    sheets.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      notificacaoSheetSelector.appendChild(opt);
    });
    notificacaoSheetSelector.disabled = false;
  },

  renderNotificacaoStudents(students) {
    const { notificacaoStudentList } = this.els;
    notificacaoStudentList.innerHTML = '';

    students.forEach((student, i) => {
      // Ignora alunos sem e-mail
      if (!student.email) return;

      const div = document.createElement('div');
      div.className = 'student-select-card';

      div.innerHTML = `
        <label class="student-select-label" for="chk_${i}">
          <input class="student-checkbox student-select-checkbox" type="checkbox" value="${student.name}" id="chk_${i}" checked>
          <div class="student-select-info">
            <span class="student-select-name">${student.name}</span>
            <span class="student-select-email">${student.email}</span>
          </div>
        </label>
      `;

      notificacaoStudentList.appendChild(div);
    });

    if (notificacaoStudentList.children.length === 0) {
      this.showNotificacaoState('empty');
      this.els.notificacaoEmptyState.innerHTML = '<p class="text-warning">Nenhum aluno com e-mail cadastrado nesta turma.</p>';
    } else {
      if (this.els.chkSelectAll) {
        this.els.chkSelectAll.checked = true;
        this.els.chkSelectAll.indeterminate = false;
      }
      this.showNotificacaoState('list');
    }
  },

  updateNotificacaoTemplate(type, dueDate) {
    const { notificacaoTemplate } = this.els;
    const dateStr = dueDate || 'XX/XX/XXXX';

    let template = '';

    if (type === 'lembrete') {
      template = `Olá <nome>,\n\nAqui quem fala é o sistema de notificações do PREPARA UMADSAL.\nQueremos te lembrar que no próximo dia ${dateStr} é o pagamento da sua mensalidade.\n\nVocê pode realizar o pagamento via PIX utilizando a chave: pix.umadsalmr@gmail.com\n\nDeus abençoe!`;
    } else if (type === 'atraso') {
      template = `Olá <nome>,\n\nAqui quem fala é o sistema de notificações do PREPARA UMADSAL.\nNotamos que o seu pagamento com vencimento no dia ${dateStr} está pendente.\n\nPor favor, realize o pagamento via PIX utilizando a chave: pix.umadsalmr@gmail.com\n\nDeus abençoe e qualquer dúvida estamos à disposição!`;
    } else {
      template = `Olá <nome>,\n\n[Sua mensagem aqui]\n\nAtenciosamente,\nEquipe PREPARA UMADSAL`;
    }

    // Se for personalizada, só muda se estiver vazia ou com o texto padrão
    if (type !== 'personalizada' || notificacaoTemplate.value === '' || notificacaoTemplate.value.includes('PREPARA UMADSAL')) {
      notificacaoTemplate.value = template;
    }
  },

  setNotificacaoTestMode(isTestMode) {
    const { notificacaoTestModeAlert, btnSendNotificationsText } = this.els;
    if (isTestMode) {
      notificacaoTestModeAlert.classList.remove('d-none');
      btnSendNotificationsText.innerHTML = '<i class="bi bi-send-fill me-2"></i> Enviar E-mails de Teste';
    } else {
      notificacaoTestModeAlert.classList.add('d-none');
      btnSendNotificationsText.innerHTML = '<i class="bi bi-send-fill me-2"></i> Enviar E-mails aos Alunos';
    }
  },

  // ==========================================
  // WhatsApp UI
  // ==========================================

  /**
   * Alterna entre as abas Email / WhatsApp
   * @param {'email'|'wpp'} tab
   */
  switchNotifTab(tab) {
    const { tabBtnEmail, tabBtnWpp, tabPanelEmail, tabPanelWpp } = this.els;
    if (tab === 'email') {
      tabBtnEmail.classList.add('active');
      tabBtnWpp.classList.remove('active');
      tabPanelEmail.classList.remove('d-none');
      tabPanelWpp.classList.add('d-none');
    } else {
      tabBtnWpp.classList.add('active');
      tabBtnEmail.classList.remove('active');
      tabPanelWpp.classList.remove('d-none');
      tabPanelEmail.classList.add('d-none');
    }
  },

  showWppState(state) {
    const { wppEmptyState, wppLoadingState, wppStudentList } = this.els;
    wppEmptyState.classList.toggle('d-none', state !== 'empty');
    wppLoadingState.classList.toggle('d-none', state !== 'loading');
    if (state === 'list') {
      wppStudentList.style.display = 'grid';
      wppStudentList.classList.remove('d-none');
    } else {
      wppStudentList.style.display = 'none';
      wppStudentList.classList.add('d-none');
    }
  },

  renderWppStudents(students) {
    const { wppStudentList } = this.els;
    wppStudentList.innerHTML = '';

    students.forEach((student, i) => {
      // Só mostra alunos que têm celular
      if (!student.phone) return;

      const cleanPhone = student.phone.replace(/\D/g, '');

      const div = document.createElement('div');
      div.className = 'student-select-card student-select-card-wpp';

      div.innerHTML = `
        <label class="student-select-label" for="wpp_chk_${i}">
          <input class="wpp-student-checkbox student-select-checkbox" type="checkbox" value="${student.name}" id="wpp_chk_${i}" checked>
          <div class="student-select-info">
            <span class="student-select-name">${student.name}</span>
            <span class="student-select-email" style="color: #22c55e;"><i class="bi bi-whatsapp me-1"></i>${cleanPhone}</span>
          </div>
        </label>
      `;

      wppStudentList.appendChild(div);
    });

    if (wppStudentList.children.length === 0) {
      this.showWppState('empty');
      if (this.els.wppEmptyState) {
        this.els.wppEmptyState.innerHTML = '<i class="bi bi-telephone-x mb-2 d-block" style="font-size:2rem;color:var(--text-muted)"></i><p class="text-warning">Nenhum aluno com número de celular cadastrado nesta turma.</p>';
      }
    } else {
      if (this.els.chkWppSelectAll) {
        this.els.chkWppSelectAll.checked = true;
        this.els.chkWppSelectAll.indeterminate = false;
      }
      this.showWppState('list');
    }
  },

  updateWppTemplate(type, dueDate) {
    const { wppTemplate } = this.els;
    if (!wppTemplate) return;
    const dateStr = dueDate || 'XX/XX/XXXX';
    let template = '';

    if (type === 'lembrete') {
      template = `Olá <nome>! 🙏\n\nAqui é a secretaria do *PREPARA UMADSAL*.\n\nPassando para te lembrar que no próximo dia *${dateStr}* é o vencimento da sua mensalidade.\n\nVocê pode pagar via PIX: pix.umadsalmr@gmail.com \n\nDeus abençoe! 💙`;
    } else if (type === 'atraso') {
      template = `Olá <nome>! 🙏\n\nAqui é a secretaria do *PREPARA UMADSAL*.\n\nIdentificamos que seu pagamento com vencimento no dia *${dateStr}* ainda está em aberto.\n\nPor favor, regularize via PIX: pix.umadsalmr@gmail.com \n\nQualquer dúvida, estamos à disposição. Deus abençoe! 💙`;
    } else {
      template = `Olá <nome>! 🙏\n\n[Sua mensagem aqui]\n\nAtenciosamente,\n*Equipe PREPARA UMADSAL*`;
    }

    if (type !== 'personalizada' || wppTemplate.value === '' || wppTemplate.value.includes('PREPARA UMADSAL')) {
      wppTemplate.value = template;
    }
  },

  setWppTestMode(isTestMode, testSheetName) {
    const { wppTestModeAlert, wppTestSheetNameLabel, btnSendWppText } = this.els;
    if (isTestMode) {
      if (wppTestModeAlert) wppTestModeAlert.classList.remove('d-none');
      if (wppTestSheetNameLabel) wppTestSheetNameLabel.textContent = testSheetName || 'TESTE NOTIFICACAO WPP';
      if (btnSendWppText) btnSendWppText.innerHTML = '<i class="bi bi-whatsapp me-2"></i> Enviar WPP de Teste';
    } else {
      if (wppTestModeAlert) wppTestModeAlert.classList.add('d-none');
      if (btnSendWppText) btnSendWppText.innerHTML = '<i class="bi bi-whatsapp me-2"></i> Enviar WhatsApp aos Alunos';
    }
  },
};
