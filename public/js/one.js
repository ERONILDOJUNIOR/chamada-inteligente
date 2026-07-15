/**
 * ONE Voice — Módulo Frontend
 * Gerencia a página dedicada ao curso ONE Voice
 * Tabs: Chamada | Alunos
 */

const OneVoice = (() => {
  // --------------------------------------------------
  // Estado interno
  // --------------------------------------------------
  let state = {
    currentTurma: 'Turma 1',
    currentDateIndex: 0,
    attendanceData: { dates: [], students: [] },
    allStudents: [],
    isLoading: false,
    isInitialized: false,
  };

  // --------------------------------------------------
  // Dados estáticos (fallback / tabela de alunos)
  // --------------------------------------------------
  const ALUNOS_STATIC = [
    { num: 1,  nome: 'Sarah Borba De Almeida',               turma: 'Turma 1', telefone: '71999534684',  dataMatricula: '17/06/2026' },
    { num: 2,  nome: 'Gabrieli Marques da Hora',             turma: 'Turma 1', telefone: '71999508508',  dataMatricula: '17/06/2026' },
    { num: 3,  nome: 'Jaqueline da Silva Oliveira',          turma: 'Turma 1', telefone: '71987787228',  dataMatricula: '18/06/2026' },
    { num: 4,  nome: 'Raquel Bispo Conceição dos Santos',    turma: 'Turma 1', telefone: '71986983648',  dataMatricula: '18/06/2026' },
    { num: 5,  nome: 'Ester Almeida Calmon do Nascimento',   turma: 'Turma 1', telefone: '71983430612',  dataMatricula: '18/06/2026' },
    { num: 6,  nome: 'Isaac Bispo Conceição dos Santos',     turma: 'Turma 1', telefone: '71986784688',  dataMatricula: '28/06/2026' },
    { num: 7,  nome: 'Hellen Cristina Santos de Souza',      turma: 'Turma 1', telefone: '71985222595',  dataMatricula: '09/07/2026' },
    { num: 1,  nome: 'Juliete Yasmin Pereira dos Santos',    turma: 'Turma 2', telefone: '71987032783',  dataMatricula: '17/06/2026' },
    { num: 2,  nome: 'Nilfa França Passos',                  turma: 'Turma 2', telefone: '71987389665',  dataMatricula: '18/06/2026' },
    { num: 3,  nome: 'Mariana Santos Andrade',               turma: 'Turma 2', telefone: '71986324706',  dataMatricula: '30/06/2026' },
    { num: 4,  nome: 'Rafael Souza de Campos',               turma: 'Turma 2', telefone: '719922219705', dataMatricula: '02/07/2026' },
    { num: 5,  nome: 'Diná Hevellyn dos Santos Natividade',  turma: 'Turma 2', telefone: '71986570814',  dataMatricula: '09/07/2026' },
  ];

  // --------------------------------------------------
  // Utils
  // --------------------------------------------------

  /**
   * Retorna a próxima segunda-feira no formato DD/MM
   */
  function nextMonday() {
    const today = new Date();
    const day = today.getDay(); // 0=Dom, 1=Seg...
    const daysUntilMonday = day === 1 ? 7 : (1 - day + 7) % 7 || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysUntilMonday);
    const dd = String(monday.getDate()).padStart(2, '0');
    const mm = String(monday.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}`;
  }

  /**
   * Hoje em DD/MM
   */
  function todayFormatted() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}`;
  }

  /**
   * Exibe toast notification (reutiliza o sistema existente ou cria um simples)
   */
  function showToast(message, type = 'success') {
    // Tenta usar o sistema de toast do app principal
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(message, type);
      return;
    }
    // Fallback
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const id = `toast-one-${Date.now()}`;
    const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
    container.insertAdjacentHTML('beforeend', `
      <div id="${id}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `);
    const toastEl = document.getElementById(id);
    const bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });
    bsToast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  }

  // --------------------------------------------------
  // Inicialização
  // --------------------------------------------------

  async function init() {
    if (state.isInitialized) {
      // Já iniciado — apenas recarrega a aba ativa
      await loadChamada();
      await loadAlunos();
      return;
    }
    state.isInitialized = true;

    bindEvents();

    // Carrega alunos e chamada em paralelo
    await Promise.all([
      loadAlunos(),
      loadChamada()
    ]);
  }

  // --------------------------------------------------
  // Eventos
  // --------------------------------------------------

  function bindEvents() {
    // Sub-tabs
    document.querySelectorAll('.one-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Seletor de turma
    const turmaSelector = document.getElementById('oneTurmaSelector');
    if (turmaSelector) {
      turmaSelector.addEventListener('change', async () => {
        state.currentTurma = turmaSelector.value;
        state.currentDateIndex = 0;
        await loadChamada();
      });
    }

    // Seletor de data
    const dateSelector = document.getElementById('oneDateSelector');
    if (dateSelector) {
      dateSelector.addEventListener('change', () => {
        state.currentDateIndex = parseInt(dateSelector.value, 10);
        renderStudentCards();
      });
    }

    // Botão nova aula
    const btnNovaAula = document.getElementById('oneBtnNovaAula');
    if (btnNovaAula) {
      btnNovaAula.addEventListener('click', openNovaAulaModal);
    }

    // Confirmar nova aula no modal
    const btnConfirmar = document.getElementById('oneBtnConfirmarData');
    if (btnConfirmar) {
      btnConfirmar.addEventListener('click', handleAddDate);
    }

    // Setup button (opcional, só aparece se planilha vazia)
    const btnSetup = document.getElementById('oneBtnSetup');
    if (btnSetup) {
      btnSetup.addEventListener('click', handleSetup);
    }
  }

  // --------------------------------------------------
  // Tabs
  // --------------------------------------------------

  function switchTab(tab) {
    document.querySelectorAll('.one-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.one-tab-pane').forEach(pane => {
      pane.classList.toggle('d-none', pane.dataset.tab !== tab);
    });
    // Ao entrar no Dashboard, carrega os dados
    if (tab === 'dashboard') {
      loadDashboard(state.dashCurrentFilter || 'total');
    }
    // Ao entrar na aba de Alunos, recarrega os dados dinamicamente do Sheets
    if (tab === 'alunos') {
      loadAlunos();
    }
  }

  // --------------------------------------------------
  // Carregar chamada
  // --------------------------------------------------

  async function loadChamada() {
    setLoading(true);
    try {
      const data = await API.fetchOneAttendance(state.currentTurma);
      if (data.success) {
        state.attendanceData = { dates: data.dates || [], students: data.students || [] };

        // Aponta para a última data por padrão (a mais recente)
        state.currentDateIndex = Math.max(0, state.attendanceData.dates.length - 1);

        renderDateSelector();
        renderStudentCards();
      } else {
        showSetupPrompt();
      }
    } catch (err) {
      console.error('[ONE] Erro ao carregar chamada:', err);
      showSetupPrompt();
    } finally {
      setLoading(false);
    }
  }

  function setLoading(loading) {
    state.isLoading = loading;
    const loadingEl = document.getElementById('oneLoadingState');
    const contentEl = document.getElementById('oneChamadaContent');
    if (loadingEl) loadingEl.classList.toggle('d-none', !loading);
    if (contentEl) contentEl.classList.toggle('d-none', loading);
  }

  function showSetupPrompt() {
    const setupMsg = document.getElementById('oneSetupMsg');
    const contentEl = document.getElementById('oneChamadaContent');
    if (setupMsg) setupMsg.classList.remove('d-none');
    if (contentEl) contentEl.classList.add('d-none');
  }

  // --------------------------------------------------
  // Renderizar seletor de datas
  // --------------------------------------------------

  function renderDateSelector() {
    const dateSelector = document.getElementById('oneDateSelector');
    if (!dateSelector) return;

    const { dates } = state.attendanceData;
    dateSelector.innerHTML = '';

    if (dates.length === 0) {
      dateSelector.innerHTML = '<option value="">Nenhuma aula cadastrada</option>';
      dateSelector.disabled = true;
      return;
    }

    dates.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Aula ${i + 1} — ${d}`;
      if (i === state.currentDateIndex) opt.selected = true;
      dateSelector.appendChild(opt);
    });

    dateSelector.disabled = false;
  }

  // --------------------------------------------------
  // Renderizar cards de alunos
  // --------------------------------------------------

  function renderStudentCards() {
    const container = document.getElementById('oneStudentCards');
    if (!container) return;

    const { dates, students } = state.attendanceData;
    const dateIdx = state.currentDateIndex;
    const currentDate = dates[dateIdx] || '—';

    // Resumo rápido
    const summaryEl = document.getElementById('oneDateSummary');
    if (summaryEl) {
      const turmaLabel = state.currentTurma === 'Turma 1' ? '1ª Turma • 18h–19:30h' : '2ª Turma • 19:30h–21h';
      summaryEl.textContent = `${turmaLabel} • ${currentDate}`;
    }

    if (students.length === 0) {
      container.innerHTML = `
        <div class="one-empty-state">
          <i class="bi bi-person-x-fill"></i>
          <p>Nenhum aluno encontrado nesta turma.</p>
        </div>`;
      return;
    }

    container.innerHTML = students.map((student, idx) => {
      const presenca = student.attendance[currentDate] || '';
      const isP = presenca === 'P';
      const isF = presenca === 'F';

      return `
        <div class="one-student-card" id="one-card-${idx}">
          <div class="one-student-info">
            <div class="one-student-num">${student.num}</div>
            <div class="one-student-details">
              <span class="one-student-name">${student.name}</span>
              <span class="one-student-phone">
                <i class="bi bi-telephone-fill"></i> ${student.phone}
              </span>
            </div>
          </div>
          <div class="one-attendance-btns">
            <button
              class="one-att-btn one-btn-p ${isP ? 'active' : ''}"
              data-idx="${idx}"
              data-row="${student.rowIndex}"
              data-value="P"
              title="Marcar Presente"
            >P</button>
            <button
              class="one-att-btn one-btn-f ${isF ? 'active' : ''}"
              data-idx="${idx}"
              data-row="${student.rowIndex}"
              data-value="F"
              title="Marcar Falta"
            >F</button>
          </div>
        </div>`;
    }).join('');

    // Bind click nos botões P/F
    container.querySelectorAll('.one-att-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAttendanceClick(btn));
    });
  }

  // --------------------------------------------------
  // Marcar presença
  // --------------------------------------------------

  async function handleAttendanceClick(btn) {
    if (state.isLoading) return;

    const studentIdx = parseInt(btn.dataset.idx, 10);
    const rowIndex = parseInt(btn.dataset.row, 10);
    const value = btn.dataset.value;
    const dateIdx = state.currentDateIndex;
    const currentDate = state.attendanceData.dates[dateIdx];

    const student = state.attendanceData.students[studentIdx];
    if (!student) return;

    const previousValue = student.attendance[currentDate] || '';

    // Toggle: clicou no mesmo botão que já está ativo → limpa
    const newValue = previousValue === value ? '' : value;

    // Atualiza UI imediatamente (optimistic update)
    student.attendance[currentDate] = newValue;
    renderStudentCards();

    try {
      if (newValue === '') {
        // Limpa a célula
        await API.saveOneAttendance({ turma: state.currentTurma, rowIndex, dateIndex: dateIdx, value: '' });
      } else {
        await API.saveOneAttendance({ turma: state.currentTurma, rowIndex, dateIndex: dateIdx, value: newValue });
        showToast(`${newValue === 'P' ? '✅ Presente' : '❌ Falta'} — ${student.name}`, 'success');
      }
    } catch (err) {
      // Reverte em caso de erro
      student.attendance[currentDate] = previousValue;
      renderStudentCards();
      showToast('Erro ao salvar. Verifique a conexão.', 'error');
    }
  }

  // --------------------------------------------------
  // Adicionar nova data
  // --------------------------------------------------

  function openNovaAulaModal() {
    const input = document.getElementById('oneNewDateInput');
    if (input) input.value = todayFormatted();

    const modal = document.getElementById('oneNovaAulaModal');
    if (modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  async function handleAddDate() {
    const input = document.getElementById('oneNewDateInput');
    const dateStr = (input ? input.value : '').trim();

    if (!dateStr) {
      showToast('Informe a data da nova aula.', 'error');
      return;
    }

    const btnConfirmar = document.getElementById('oneBtnConfirmarData');
    if (btnConfirmar) btnConfirmar.disabled = true;

    try {
      // Adiciona em ambas as turmas ao mesmo tempo
      const result = await API.addOneDate({ turma: 'ambas', date: dateStr });

      if (result.success) {
        showToast(`Nova aula ${dateStr} adicionada com sucesso!`, 'success');

        // Fecha modal
        const modal = document.getElementById('oneNovaAulaModal');
        if (modal) bootstrap.Modal.getInstance(modal)?.hide();

        // Recarrega chamada
        await loadChamada();
      } else {
        showToast('Erro ao adicionar nova data.', 'error');
      }
    } catch (err) {
      showToast('Erro ao adicionar nova data.', 'error');
    } finally {
      if (btnConfirmar) btnConfirmar.disabled = false;
    }
  }

  // --------------------------------------------------
  // Setup inicial da planilha
  // --------------------------------------------------

  async function handleSetup() {
    const btnSetup = document.getElementById('oneBtnSetup');
    if (btnSetup) {
      btnSetup.disabled = true;
      btnSetup.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Configurando...';
    }

    try {
      const result = await API.setupOne();
      if (result.success) {
        showToast('Planilha ONE configurada com sucesso!', 'success');
        document.getElementById('oneSetupMsg')?.classList.add('d-none');
        document.getElementById('oneChamadaContent')?.classList.remove('d-none');
        await loadChamada();
      } else {
        showToast('Erro ao configurar planilha ONE.', 'error');
      }
    } catch (err) {
      showToast('Erro ao configurar planilha ONE.', 'error');
    } finally {
      if (btnSetup) {
        btnSetup.disabled = false;
        btnSetup.innerHTML = '<i class="bi bi-gear-fill"></i> Configurar Planilha';
      }
    }
  }

  // --------------------------------------------------
  // Aba Alunos
  // --------------------------------------------------

  async function loadAlunos() {
    try {
      const data = await API.fetchOneStudents();
      if (data.success) {
        state.allStudents = data.students || [];
        renderAlunosTab();
      }
    } catch (err) {
      console.error('[ONE] Erro ao carregar alunos:', err);
    }
  }

  function renderAlunosTab() {
    const tbody = document.getElementById('oneAlunosTableBody');
    if (!tbody) return;

    if (state.allStudents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            <i class="bi bi-people-fill fs-4 d-block mb-2"></i>
            Nenhum aluno carregado ou tabela vazia na planilha.
          </td>
        </tr>
      `;
      return;
    }

    // Atualiza o contador de alunos matriculados no badge se existir
    const badgeTotal = document.querySelector('.one-badge-total');
    if (badgeTotal) {
      badgeTotal.textContent = state.allStudents.length;
    }

    // Atualiza o contador no header do módulo ONE
    const headerCount = document.getElementById('oneHeaderAlunosCount');
    if (headerCount) {
      headerCount.textContent = `${state.allStudents.length} Aluno${state.allStudents.length !== 1 ? 's' : ''}`;
    }

    tbody.innerHTML = state.allStudents.map(a => `
      <tr>
        <td><span class="one-badge-num">${a.num}</span></td>
        <td class="one-aluno-nome">${a.nome}</td>
        <td>
          <span class="one-badge-turma ${a.turma === 'Turma 1' ? 'turma1' : 'turma2'}">
            ${a.turma === 'Turma 1' ? '1ª Turma' : '2ª Turma'}
          </span>
        </td>
        <td>
          <a href="https://wa.me/55${a.telefone.replace(/\D/g, '')}" target="_blank" class="one-phone-link">
            <i class="bi bi-whatsapp"></i> ${a.telefone}
          </a>
        </td>
        <td class="one-data-matricula">${a.dataMatricula}</td>
      </tr>
    `).join('');
  }

  // --------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------

  // Guarda instâncias dos gráficos para destruir antes de recriar
  let _barChart = null;
  let _donutChart = null;

  // Amplia o state para o dashboard
  if (!state.dashCurrentFilter) state.dashCurrentFilter = 'total';
  // Cache de dados das turmas
  let _dashCache = { t1: null, t2: null };

  /**
   * Ponto de entrada do dashboard.
   * filter: 'total' | 'Turma 1' | 'Turma 2'
   */
  async function loadDashboard(filter) {
    state.dashCurrentFilter = filter;

    // Atualiza pills de seleção
    document.querySelectorAll('.one-dash-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.turma === filter);
    });

    const loadingEl = document.getElementById('oneDashLoading');
    if (loadingEl) loadingEl.classList.remove('d-none');

    try {
      // Busca ambas as turmas (com cache para evitar chamadas repetidas)
      if (!_dashCache.t1) {
        const d1 = await API.fetchOneAttendance('Turma 1');
        _dashCache.t1 = d1.success ? d1 : { dates: [], students: [] };
      }
      if (!_dashCache.t2) {
        const d2 = await API.fetchOneAttendance('Turma 2');
        _dashCache.t2 = d2.success ? d2 : { dates: [], students: [] };
      }

      const datasets = buildDashDatasets(filter);
      renderSummaryCards(datasets);
      renderBarChart(datasets);
      renderDonutChart(datasets);

    } catch (err) {
      console.error('[ONE Dashboard] Erro:', err);
    } finally {
      if (loadingEl) loadingEl.classList.add('d-none');
    }
  }

  /**
   * Agrega os dados de P/F por data para o filtro selecionado.
   * Retorna { dates, pCounts, fCounts, totalAlunos, totalP, totalF, label }
   */
  function buildDashDatasets(filter) {
    let turmas = [];
    let label = '';

    if (filter === 'total') {
      turmas = [_dashCache.t1, _dashCache.t2];
      label = 'Todas as Turmas';
    } else if (filter === 'Turma 1') {
      turmas = [_dashCache.t1];
      label = '1ª Turma • 18h–19:30h';
    } else {
      turmas = [_dashCache.t2];
      label = '2ª Turma • 19:30h–21h';
    }

    // Unifica todas as datas (pode haver datas diferentes nas turmas)
    const allDatesSet = new Set();
    turmas.forEach(t => (t.dates || []).forEach(d => allDatesSet.add(d)));
    const dates = Array.from(allDatesSet).sort(); // ordem cronológica DD/MM

    const pCounts = dates.map(date => {
      let count = 0;
      turmas.forEach(t => {
        (t.students || []).forEach(s => {
          if ((s.attendance[date] || '') === 'P') count++;
        });
      });
      return count;
    });

    const fCounts = dates.map(date => {
      let count = 0;
      turmas.forEach(t => {
        (t.students || []).forEach(s => {
          if ((s.attendance[date] || '') === 'F') count++;
        });
      });
      return count;
    });

    const totalAlunos = turmas.reduce((sum, t) => sum + (t.students || []).length, 0);
    const totalP = pCounts.reduce((a, b) => a + b, 0);
    const totalF = fCounts.reduce((a, b) => a + b, 0);

    return { dates, pCounts, fCounts, totalAlunos, totalP, totalF, label };
  }

  /** Atualiza os 4 cards de resumo */
  function renderSummaryCards({ totalAlunos, totalP, totalF }) {
    const total = totalP + totalF;
    const freq = total > 0 ? Math.round((totalP / total) * 100) : 0;

    const el = id => document.getElementById(id);
    if (el('oneDashTotalAlunos')) el('oneDashTotalAlunos').textContent = totalAlunos;
    if (el('oneDashTotalP')) el('oneDashTotalP').textContent = totalP;
    if (el('oneDashTotalF')) el('oneDashTotalF').textContent = totalF;
    if (el('oneDashFreq')) el('oneDashFreq').textContent = `${freq}%`;
  }

  /** Gráfico de barras agrupadas: P e F por aula */
  function renderBarChart({ dates, pCounts, fCounts, label }) {
    const canvas = document.getElementById('oneDashBarChart');
    if (!canvas) return;

    const subtitle = document.getElementById('oneDashBarSubtitle');
    if (subtitle) subtitle.textContent = label;

    // Destrói instância anterior
    if (_barChart) { _barChart.destroy(); _barChart = null; }

    const labels = dates.length > 0
      ? dates.map((d, i) => `Aula ${i + 1}\n${d}`)
      : ['Sem aulas'];

    _barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Presenças',
            data: pCounts,
            backgroundColor: 'rgba(34, 197, 94, 0.85)',
            borderColor: '#16a34a',
            borderWidth: 1.5,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Faltas',
            data: fCounts,
            backgroundColor: 'rgba(239, 68, 68, 0.85)',
            borderColor: '#dc2626',
            borderWidth: 1.5,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'Montserrat', weight: '600', size: 12 },
              color: '#062B52',
              usePointStyle: true,
              pointStyle: 'rectRounded',
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: '#0D47A1',
            titleFont: { family: 'Montserrat', weight: '700' },
            bodyFont: { family: 'Montserrat' },
            cornerRadius: 8,
            callbacks: {
              title: items => items[0].label.replace('\n', ' — '),
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Montserrat', size: 11 },
              color: '#7A8B99',
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { family: 'Montserrat', size: 11 },
              color: '#7A8B99',
            },
            grid: { color: 'rgba(0,0,0,0.06)' },
          },
        },
        animation: { duration: 500, easing: 'easeOutQuart' },
      },
    });
  }

  /** Gráfico donut: frequência geral */
  function renderDonutChart({ totalP, totalF, label }) {
    const canvas = document.getElementById('oneDashDonutChart');
    if (!canvas) return;

    const subtitle = document.getElementById('oneDashDonutSubtitle');
    if (subtitle) subtitle.textContent = label;

    if (_donutChart) { _donutChart.destroy(); _donutChart = null; }

    const total = totalP + totalF;
    const freq = total > 0 ? Math.round((totalP / total) * 100) : 0;

    // Atualiza texto central
    const pctEl = document.getElementById('oneDashDonutPct');
    if (pctEl) pctEl.textContent = `${freq}%`;

    const hasPending = total === 0;

    _donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: hasPending ? ['Sem dados'] : ['Presenças', 'Faltas'],
        datasets: [{
          data: hasPending ? [1] : [totalP, totalF],
          backgroundColor: hasPending
            ? ['#E5E9EF']
            : ['rgba(34,197,94,0.9)', 'rgba(239,68,68,0.85)'],
          borderColor: hasPending
            ? ['#D1D9E0']
            : ['#16a34a', '#dc2626'],
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Montserrat', weight: '600', size: 12 },
              color: '#062B52',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: '#0D47A1',
            titleFont: { family: 'Montserrat', weight: '700' },
            bodyFont: { family: 'Montserrat' },
            cornerRadius: 8,
            callbacks: {
              label: ctx => {
                if (hasPending) return 'Nenhuma chamada registrada';
                const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              },
            },
          },
        },
        animation: { animateRotate: true, duration: 600, easing: 'easeOutQuart' },
      },
    });
  }

  /** Bind pills do filtro de turma no dashboard */
  function bindDashboardEvents() {
    document.querySelectorAll('.one-dash-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        // Limpa cache ao trocar filtro para garantir dados frescos
        _dashCache = { t1: null, t2: null };
        loadDashboard(pill.dataset.turma);
      });
    });
  }

  // Chama bindDashboardEvents dentro de bindEvents (ajuste)
  const _origBindEvents = bindEvents;
  // Registra os eventos do dashboard logo após
  (function initDashEvents() {
    // Garante que o DOM está pronto antes de fazer bind
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindDashboardEvents);
    } else {
      bindDashboardEvents();
    }
  })();

  // --------------------------------------------------
  // API pública
  // --------------------------------------------------
  return { init };
})();
