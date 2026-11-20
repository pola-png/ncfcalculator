(function () {
  'use strict';

  const calc = window.NCFCalculator;

  const SAMPLE_STATE = {
    currency: 'USD',
    mode: 'activity',
    activity: {
      beginningCash: 25000,
      operating: [
        { label: 'Cash received from customers', type: 'inflow', amount: 84000 },
        { label: 'Payroll & contractor payments', type: 'outflow', amount: 36500 },
        { label: 'Supplier & operating expenses', type: 'outflow', amount: 18200 },
        { label: 'Income taxes & interest paid', type: 'outflow', amount: 6800 }
      ],
      investing: [
        { label: 'Equipment & software CapEx', type: 'outflow', amount: 12000 },
        { label: 'Sale of used equipment', type: 'inflow', amount: 2500 }
      ],
      financing: [
        { label: 'Term loan repayment', type: 'outflow', amount: 4500 },
        { label: 'Owner / investor contribution', type: 'inflow', amount: 10000 }
      ]
    },
    direct: {
      beginningCash: 25000,
      inflows: [
        { label: 'Product & service revenue', amount: 84000 },
        { label: 'Asset sale proceeds', amount: 2500 },
        { label: 'Equity / loan proceeds', amount: 10000 }
      ],
      outflows: [
        { label: 'Payroll & benefits', amount: 36500 },
        { label: 'Operating & vendor costs', amount: 18200 },
        { label: 'Taxes & interest', amount: 6800 },
        { label: 'Capital expenditures', amount: 12000 },
        { label: 'Debt repayment', amount: 4500 }
      ]
    },
    multiperiod: {
      beginningCash: 10000,
      discountRatePct: 8,
      periods: [
        { label: 'Q1', inflows: 42000, outflows: 38000 },
        { label: 'Q2', inflows: 51000, outflows: 41500 },
        { label: 'Q3', inflows: 60000, outflows: 45000 },
        { label: 'Q4', inflows: 72000, outflows: 49000 }
      ]
    }
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  let state = clone(SAMPLE_STATE);

  // DOM references
  const currencySelect = document.getElementById('currencySelect');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = {
    activity: document.getElementById('panel-activity'),
    direct: document.getElementById('panel-direct'),
    multiperiod: document.getElementById('panel-multiperiod')
  };

  const activityBeginningInput = document.getElementById('activityBeginningCash');
  const directBeginningInput = document.getElementById('directBeginningCash');
  const multiBeginningInput = document.getElementById('multiBeginningCash');
  const discountRateInput = document.getElementById('discountRate');

  function getCurrencySymbol() {
    const opt = currencySelect.options[currencySelect.selectedIndex];
    return (opt && opt.dataset.symbol) || '$';
  }

  function updateCurrencyPrefixes() {
    const sym = getCurrencySymbol();
    document.querySelectorAll('.currency-prefix').forEach((el) => {
      el.textContent = sym;
    });
  }

  function fmt(val) {
    return calc.formatMoney(val, state.currency);
  }

  function renderActivityCategory(category) {
    const container = document.getElementById(`items-${category}`);
    container.innerHTML = '';

    state.activity[category].forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'line-item-row';

      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.className = 'text-input';
      labelInput.placeholder = 'Description';
      labelInput.value = item.label;
      labelInput.addEventListener('input', (e) => {
        state.activity[category][index].label = e.target.value;
      });

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = `flow-toggle ${item.type}`;
      toggleBtn.textContent = item.type === 'inflow' ? '+ Inflow' : '− Outflow';
      toggleBtn.addEventListener('click', () => {
        item.type = item.type === 'inflow' ? 'outflow' : 'inflow';
        renderActivityCategory(category);
        updateResults();
      });

      const moneyWrap = document.createElement('div');
      moneyWrap.className = 'money-input';
      const prefix = document.createElement('span');
      prefix.className = 'currency-prefix';
      prefix.textContent = getCurrencySymbol();
      const amountInput = document.createElement('input');
      amountInput.type = 'number';
      amountInput.step = 'any';
      amountInput.min = '0';
      amountInput.value = item.amount;
      amountInput.addEventListener('input', (e) => {
        state.activity[category][index].amount = Number(e.target.value) || 0;
        updateResults();
      });
      moneyWrap.append(prefix, amountInput);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-icon';
      removeBtn.title = 'Remove item';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        state.activity[category].splice(index, 1);
        renderActivityCategory(category);
        updateResults();
      });

      row.append(labelInput, toggleBtn, moneyWrap, removeBtn);
      container.appendChild(row);
    });
  }

  function renderDirectList(kind) {
    const container = document.getElementById(`items-${kind}`);
    container.innerHTML = '';

    state.direct[kind].forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'line-item-row direct-row';

      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.className = 'text-input';
      labelInput.placeholder = kind === 'inflows' ? 'Inflow source' : 'Outflow expense';
      labelInput.value = item.label;
      labelInput.addEventListener('input', (e) => {
        state.direct[kind][index].label = e.target.value;
      });

      const moneyWrap = document.createElement('div');
      moneyWrap.className = 'money-input';
      const prefix = document.createElement('span');
      prefix.className = 'currency-prefix';
      prefix.textContent = getCurrencySymbol();
      const amountInput = document.createElement('input');
      amountInput.type = 'number';
      amountInput.step = 'any';
      amountInput.min = '0';
      amountInput.value = item.amount;
      amountInput.addEventListener('input', (e) => {
        state.direct[kind][index].amount = Number(e.target.value) || 0;
        updateResults();
      });
      moneyWrap.append(prefix, amountInput);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-icon';
      removeBtn.title = 'Remove item';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        state.direct[kind].splice(index, 1);
        renderDirectList(kind);
        updateResults();
      });

      row.append(labelInput, moneyWrap, removeBtn);
      container.appendChild(row);
    });
  }

  function renderMultiPeriodTable() {
    const tbody = document.getElementById('periodTableBody');
    tbody.innerHTML = '';

    const result = calc.calculateMultiPeriodNCF(state.multiperiod);

    state.multiperiod.periods.forEach((p, idx) => {
      const computed = result.rows[idx];
      const tr = document.createElement('tr');

      const tdLabel = document.createElement('td');
      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.value = p.label;
      labelInput.addEventListener('input', (e) => {
        state.multiperiod.periods[idx].label = e.target.value;
        updateResults();
      });
      tdLabel.appendChild(labelInput);

      const tdIn = document.createElement('td');
      const inInput = document.createElement('input');
      inInput.type = 'number';
      inInput.step = 'any';
      inInput.min = '0';
      inInput.value = p.inflows;
      inInput.addEventListener('input', (e) => {
        state.multiperiod.periods[idx].inflows = Number(e.target.value) || 0;
        updateMultiPeriodComputedCells();
        updateResults();
      });
      tdIn.appendChild(inInput);

      const tdOut = document.createElement('td');
      const outInput = document.createElement('input');
      outInput.type = 'number';
      outInput.step = 'any';
      outInput.min = '0';
      outInput.value = p.outflows;
      outInput.addEventListener('input', (e) => {
        state.multiperiod.periods[idx].outflows = Number(e.target.value) || 0;
        updateMultiPeriodComputedCells();
        updateResults();
      });
      tdOut.appendChild(outInput);

      const tdNcf = document.createElement('td');
      tdNcf.className = `period-ncf-cell ${computed.ncf >= 0 ? 'positive' : 'negative'}`;
      tdNcf.textContent = fmt(computed.ncf);

      const tdCum = document.createElement('td');
      tdCum.className = 'period-cum-cell';
      tdCum.textContent = fmt(computed.cumulativeCash);

      const tdDel = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-icon';
      delBtn.textContent = '×';
      delBtn.title = 'Remove period';
      delBtn.addEventListener('click', () => {
        if (state.multiperiod.periods.length <= 1) return;
        state.multiperiod.periods.splice(idx, 1);
        renderMultiPeriodTable();
        updateResults();
      });
      tdDel.appendChild(delBtn);

      tr.append(tdLabel, tdIn, tdOut, tdNcf, tdCum, tdDel);
      tbody.appendChild(tr);
    });
  }

  function updateMultiPeriodComputedCells() {
    const result = calc.calculateMultiPeriodNCF(state.multiperiod);
    const ncfCells = document.querySelectorAll('.period-ncf-cell');
    const cumCells = document.querySelectorAll('.period-cum-cell');
    result.rows.forEach((row, idx) => {
      if (ncfCells[idx]) {
        ncfCells[idx].textContent = fmt(row.ncf);
        ncfCells[idx].className = `period-ncf-cell ${row.ncf >= 0 ? 'positive' : 'negative'}`;
      }
      if (cumCells[idx]) {
        cumCells[idx].textContent = fmt(row.cumulativeCash);
      }
    });
  }

  function renderBars(bars) {
    const container = document.getElementById('chartContainer');
    container.innerHTML = '';

    const maxAbs = Math.max(1, ...bars.map((b) => Math.abs(b.value)));
    bars.forEach((b) => {
      const row = document.createElement('div');
      row.className = 'bar-row';

      const meta = document.createElement('div');
      meta.className = 'bar-meta';
      const nameSpan = document.createElement('span');
      nameSpan.textContent = b.label;
      const valSpan = document.createElement('span');
      valSpan.className = b.value >= 0 ? 'positive' : 'negative';
      valSpan.textContent = fmt(b.value);
      meta.append(nameSpan, valSpan);

      const track = document.createElement('div');
      track.className = 'bar-track';
      const fill = document.createElement('div');
      fill.className = `bar-fill ${b.value >= 0 ? 'positive' : 'negative'}`;
      fill.style.width = `${Math.min(100, (Math.abs(b.value) / maxAbs) * 100)}%`;
      track.appendChild(fill);

      row.append(meta, track);
      container.appendChild(row);
    });
  }

  function renderMetrics(tiles) {
    const grid = document.getElementById('metricsGrid');
    grid.innerHTML = '';
    tiles.forEach((t) => {
      const div = document.createElement('div');
      div.className = 'metric-tile';
      const lbl = document.createElement('div');
      lbl.className = 'm-label';
      lbl.textContent = t.label;
      const val = document.createElement('div');
      val.className = `m-value ${t.tone || ''}`;
      val.textContent = t.value;
      div.append(lbl, val);
      grid.appendChild(div);
    });
  }

  function setHero(ncf, label, formulaText) {
    document.getElementById('summaryModeLabel').textContent = label;
    const hero = document.getElementById('ncfHeroValue');
    hero.textContent = fmt(ncf);
    hero.className = `summary-value ${ncf > 0 ? 'positive' : ncf < 0 ? 'negative' : ''}`;

    const badge = document.getElementById('ncfStatusBadge');
    if (ncf > 0) {
      badge.textContent = 'Positive Net Cash Flow';
      badge.className = 'summary-badge positive';
    } else if (ncf < 0) {
      badge.textContent = 'Negative Net Cash Flow (Cash Burn)';
      badge.className = 'summary-badge negative';
    } else {
      badge.textContent = 'Break-even Cash Flow';
      badge.className = 'summary-badge';
    }

    document.getElementById('formulaDisplay').textContent = formulaText;
  }

  function updateResults() {
    if (state.mode === 'activity') {
      const res = calc.calculateActivityNCF(state.activity);

      const setSub = (id, val) => {
        const el = document.getElementById(id);
        el.textContent = fmt(val);
        el.className = `category-subtotal ${val >= 0 ? 'positive' : 'negative'}`;
      };
      setSub('subtotal-operating', res.ocf);
      setSub('subtotal-investing', res.icf);
      setSub('subtotal-financing', res.fcf);

      setHero(
        res.ncf,
        'Net Cash Flow (Activity Method)',
        `NCF = ${fmt(res.ocf)} + (${fmt(res.icf)}) + (${fmt(res.fcf)}) = ${fmt(res.ncf)}`
      );

      renderMetrics([
        { label: 'Operating CF (OCF)', value: fmt(res.ocf), tone: res.ocf >= 0 ? 'positive' : 'negative' },
        { label: 'Investing CF (ICF)', value: fmt(res.icf), tone: res.icf >= 0 ? 'positive' : 'negative' },
        { label: 'Financing CF (FCF)', value: fmt(res.fcf), tone: res.fcf >= 0 ? 'positive' : 'negative' },
        { label: 'Ending Cash Balance', value: fmt(res.endingCash) }
      ]);

      document.getElementById('chartTitle').textContent = 'Activity Breakdown';
      renderBars([
        { label: 'Operating (OCF)', value: res.ocf },
        { label: 'Investing (ICF)', value: res.icf },
        { label: 'Financing (FCF)', value: res.fcf },
        { label: 'Net Cash Flow (NCF)', value: res.ncf }
      ]);
    } else if (state.mode === 'direct') {
      const res = calc.calculateDirectNCF(state.direct);
      document.getElementById('subtotal-inflows').textContent = fmt(res.totalInflows);
      document.getElementById('subtotal-outflows').textContent = fmt(-res.totalOutflows);

      setHero(
        res.ncf,
        'Net Cash Flow (Direct Method)',
        `NCF = ${fmt(res.totalInflows)} − ${fmt(res.totalOutflows)} = ${fmt(res.ncf)}`
      );

      renderMetrics([
        { label: 'Total Cash Inflows', value: fmt(res.totalInflows), tone: 'positive' },
        { label: 'Total Cash Outflows', value: fmt(res.totalOutflows), tone: 'negative' },
        { label: 'Ending Cash Balance', value: fmt(res.endingCash) },
        {
          label: 'Cash Flow Margin',
          value: res.cashFlowMargin === null ? '—' : `${res.cashFlowMargin.toFixed(1)}%`
        }
      ]);

      document.getElementById('chartTitle').textContent = 'Inflows vs. Outflows';
      renderBars([
        { label: 'Cash Inflows', value: res.totalInflows },
        { label: 'Cash Outflows', value: -res.totalOutflows },
        { label: 'Net Cash Flow', value: res.ncf }
      ]);
    } else {
      const res = calc.calculateMultiPeriodNCF(state.multiperiod);
      updateMultiPeriodComputedCells();

      setHero(
        res.totalNCF,
        'Cumulative Multi-Period NCF',
        `Total NCF = ${fmt(res.totalInflows)} − ${fmt(res.totalOutflows)} = ${fmt(res.totalNCF)}`
      );

      renderMetrics([
        { label: 'Ending Cumulative Cash', value: fmt(res.endingCash) },
        { label: 'Net Present Value (NPV)', value: fmt(res.npv), tone: res.npv >= 0 ? 'positive' : 'negative' },
        { label: 'Total Inflows', value: fmt(res.totalInflows), tone: 'positive' },
        { label: 'Total Outflows', value: fmt(res.totalOutflows), tone: 'negative' }
      ]);

      document.getElementById('chartTitle').textContent = 'Period Net Cash Flow';
      renderBars(res.rows.map((r) => ({ label: r.label, value: r.ncf })));
    }
  }

  function renderAll() {
    currencySelect.value = state.currency;
    updateCurrencyPrefixes();

    activityBeginningInput.value = state.activity.beginningCash;
    directBeginningInput.value = state.direct.beginningCash;
    multiBeginningInput.value = state.multiperiod.beginningCash;
    discountRateInput.value = state.multiperiod.discountRatePct;

    renderActivityCategory('operating');
    renderActivityCategory('investing');
    renderActivityCategory('financing');
    renderDirectList('inflows');
    renderDirectList('outflows');
    renderMultiPeriodTable();
    updateResults();
  }

  // Event Listeners
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      state.mode = mode;
      tabBtns.forEach((b) => {
        const active = b.dataset.mode === mode;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });
      Object.entries(panels).forEach(([key, panel]) => {
        panel.classList.toggle('active', key === mode);
      });
      updateResults();
    });
  });

  currencySelect.addEventListener('change', (e) => {
    state.currency = e.target.value;
    updateCurrencyPrefixes();
    updateResults();
  });

  activityBeginningInput.addEventListener('input', (e) => {
    state.activity.beginningCash = Number(e.target.value) || 0;
    updateResults();
  });

  directBeginningInput.addEventListener('input', (e) => {
    state.direct.beginningCash = Number(e.target.value) || 0;
    updateResults();
  });

  multiBeginningInput.addEventListener('input', (e) => {
    state.multiperiod.beginningCash = Number(e.target.value) || 0;
    updateResults();
  });

  discountRateInput.addEventListener('input', (e) => {
    state.multiperiod.discountRatePct = Number(e.target.value) || 0;
    updateResults();
  });

  document.querySelectorAll('[data-add-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.addCategory;
      state.activity[cat].push({ label: 'New item', type: 'inflow', amount: 0 });
      renderActivityCategory(cat);
      updateResults();
    });
  });

  document.querySelectorAll('[data-add-direct]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.addDirect;
      state.direct[kind].push({ label: 'New item', amount: 0 });
      renderDirectList(kind);
      updateResults();
    });
  });

  document.getElementById('addPeriodBtn').addEventListener('click', () => {
    const nextNum = state.multiperiod.periods.length + 1;
    state.multiperiod.periods.push({ label: `Period ${nextNum}`, inflows: 0, outflows: 0 });
    renderMultiPeriodTable();
    updateResults();
  });

  document.getElementById('loadSampleBtn').addEventListener('click', () => {
    const currentMode = state.mode;
    state = clone(SAMPLE_STATE);
    state.mode = currentMode;
    renderAll();
  });

  document.getElementById('resetAllBtn').addEventListener('click', () => {
    state.activity.beginningCash = 0;
    state.activity.operating = [{ label: 'Operating receipts', type: 'inflow', amount: 0 }];
    state.activity.investing = [{ label: 'Capital expenditure', type: 'outflow', amount: 0 }];
    state.activity.financing = [{ label: 'Financing activity', type: 'inflow', amount: 0 }];

    state.direct.beginningCash = 0;
    state.direct.inflows = [{ label: 'Cash inflow', amount: 0 }];
    state.direct.outflows = [{ label: 'Cash outflow', amount: 0 }];

    state.multiperiod.beginningCash = 0;
    state.multiperiod.discountRatePct = 0;
    state.multiperiod.periods = [{ label: 'Period 1', inflows: 0, outflows: 0 }];
    renderAll();
  });

  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    const lines = [];
    if (state.mode === 'activity') {
      const res = calc.calculateActivityNCF(state.activity);
      lines.push('Category,Description,Type,Amount');
      ['operating', 'investing', 'financing'].forEach((cat) => {
        state.activity[cat].forEach((item) => {
          const signed = item.type === 'outflow' ? -Math.abs(item.amount) : Math.abs(item.amount);
          lines.push(`${cat},"${item.label.replace(/"/g, '""')}",${item.type},${signed}`);
        });
      });
      lines.push(`Summary,Operating Cash Flow,,${res.ocf}`);
      lines.push(`Summary,Investing Cash Flow,,${res.icf}`);
      lines.push(`Summary,Financing Cash Flow,,${res.fcf}`);
      lines.push(`Summary,Net Cash Flow (NCF),,${res.ncf}`);
      lines.push(`Summary,Ending Cash Balance,,${res.endingCash}`);
    } else if (state.mode === 'direct') {
      const res = calc.calculateDirectNCF(state.direct);
      lines.push('Group,Description,Amount');
      state.direct.inflows.forEach((i) => lines.push(`Inflow,"${i.label.replace(/"/g, '""')}",${i.amount}`));
      state.direct.outflows.forEach((o) => lines.push(`Outflow,"${o.label.replace(/"/g, '""')}",-${o.amount}`));
      lines.push(`Summary,Total Inflows,${res.totalInflows}`);
      lines.push(`Summary,Total Outflows,-${res.totalOutflows}`);
      lines.push(`Summary,Net Cash Flow (NCF),${res.ncf}`);
      lines.push(`Summary,Ending Cash Balance,${res.endingCash}`);
    } else {
      const res = calc.calculateMultiPeriodNCF(state.multiperiod);
      lines.push('Period,Inflows,Outflows,Period NCF,Cumulative Cash,Present Value');
      res.rows.forEach((r) => {
        lines.push(`"${r.label.replace(/"/g, '""')}",${r.inflows},${r.outflows},${r.ncf},${r.cumulativeCash},${r.presentValue.toFixed(2)}`);
      });
      lines.push(`Total,${res.totalInflows},${res.totalOutflows},${res.totalNCF},${res.endingCash},${res.npv.toFixed(2)}`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ncf-${state.mode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const params = new URLSearchParams(window.location.search);
  const initialMode = params.get('mode');
  if (initialMode && panels[initialMode]) {
    state.mode = initialMode;
    tabBtns.forEach((b) => {
      const active = b.dataset.mode === initialMode;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    Object.entries(panels).forEach(([key, panel]) => {
      panel.classList.toggle('active', key === initialMode);
    });
  }

  const initialCurrency = params.get('currency');
  if (initialCurrency) {
    state.currency = initialCurrency;
  }

  renderAll();
})();
