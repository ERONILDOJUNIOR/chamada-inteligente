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
    navFinanceiro: document.getElementById('navFinanceiro'),
    
    // Dashboard Elements
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

  renderGeralStudents(students, subjectName) {
    const { geralStudentList } = this.els;
    geralStudentList.innerHTML = '';

    students.forEach((student, i) => {
      const att = student.attendance[subjectName] || { P: 0, F: 0 };
      
      const card = document.createElement('div');
      card.className = 'student-card';
      card.style.animationDelay = `${i * 0.04}s`;
      card.dataset.rowIndex = student.rowIndex;
      card.dataset.name = student.name.toLowerCase();

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
              label: function(context) {
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
              callback: function(value) {
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
  }
};
