// Falcon Admin — dashboard page
(function () {
  'use strict';
  window.FP = window.FP || {};
  window.FP['dashboard'] = {
    html: `
    <div id="page-dashboard" class="page active">
      <h2>Dashboard</h2>
      <p class="page-sub">System overview at a glance.</p>
      <div class="stat-row">
        <div class="stat">
          <div class="stat-label">Total Instruments</div>
          <div class="stat-value" id="dash-inst-count">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Total Traders</div>
          <div class="stat-value" id="dash-trader-count">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Max Global Loss</div>
          <div class="stat-value warn" id="dash-max-loss">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Max Exposure</div>
          <div class="stat-value" id="dash-max-exp">—</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Global Risk Snapshot</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Limit</th><th>Value</th></tr></thead>
            <tbody id="dash-risk-tbody">
              <tr class="empty-row"><td colspan="2">Login to load data</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Recent Audit Events</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Trader</th><th>Module</th><th>Action</th><th>Description</th></tr></thead>
            <tbody id="dash-audit-tbody">
              <tr class="empty-row"><td colspan="5">Login to load data</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
`,
    init: null
  };
})();

// ── Dashboard ─────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const cnt = await sendCommand(CMD.GET_INSTRUMENT_COUNT, {});
    const c   = typeof cnt === 'string' ? JSON.parse(cnt) : cnt;
    const countStr = (c.count ?? 0).toLocaleString();
    $('dash-inst-count').textContent = countStr;
    if ($('inst-count')) { $('inst-count').textContent = countStr; }
  } catch { $('dash-inst-count').textContent = '?'; }

  try {
    const traders = await sendCommand(CMD.GET_ALL_TRADERS, {});
    const arr = typeof traders === 'string' ? JSON.parse(traders) : traders;
    state.traders = arr || [];
    $('dash-trader-count').textContent = state.traders.length;
  } catch { $('dash-trader-count').textContent = '?'; }

  try {
    const risk = await sendCommand(CMD.GET_GLOBAL_RISK, {});
    const r    = typeof risk === 'string' ? JSON.parse(risk) : risk;
    $('dash-max-loss').textContent = fmtN(r.maxLoss);
    $('dash-max-exp').textContent  = fmtN(r.maxExposure);
    $('dash-risk-tbody').innerHTML = `
      <tr><td>Max Loss</td><td>${fmtN(r.maxLoss)}</td></tr>
      <tr><td>Max Open Orders</td><td>${fmtN(r.maxOpenOrders)}</td></tr>
      <tr><td>Max Exposure</td><td>${fmtN(r.maxExposure)}</td></tr>
      <tr><td>Max Orders / sec</td><td>${fmtN(r.maxOrdersPerSecond)}</td></tr>`;
    // risk-max-* inputs live on the Risk Limits page; they are populated when that page is navigated to.
  } catch (e) { $('dash-risk-tbody').innerHTML = `<tr class="empty-row"><td colspan="2">${e.message}</td></tr>`; }

  try {
    const audit = await sendCommand(CMD.GET_AUDIT_LOG, { limit: 5 });
    const rows  = typeof audit === 'string' ? JSON.parse(audit) : audit;
    renderDashAudit(rows || []);
  } catch { $('dash-audit-tbody').innerHTML = '<tr class="empty-row"><td colspan="5">Failed to load</td></tr>'; }
}

function renderDashAudit(rows) {
  if (!rows.length) { $('dash-audit-tbody').innerHTML = '<tr class="empty-row"><td colspan="5">No events</td></tr>'; return; }
  $('dash-audit-tbody').innerHTML = rows.map(r => `
    <tr><td>${r.time||'—'}</td><td>${r.traderId}</td><td>${r.module||'—'}</td>
        <td>${r.action||'—'}</td><td>${r.desc||'—'}</td></tr>`).join('');
}
