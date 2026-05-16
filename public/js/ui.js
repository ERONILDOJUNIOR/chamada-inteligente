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
};
