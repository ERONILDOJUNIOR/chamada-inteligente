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
    
    // Dashboard Elements
    dashDiarioSelector: document.getElementById('dashDiarioSelector'),
    dashGeralSelector: document.getElementById('dashGeralSelector'),
    chartDiarioCanvas: document.getElementById('chartDiario'),
    chartEixosCanvas: document.getElementById('chartEixos'),
    
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
  },

  populateDashSelectors(diarioSheets, geralSheets) {
    const { dashDiarioSelector, dashGeralSelector } = this.els;
    
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
  }
};
