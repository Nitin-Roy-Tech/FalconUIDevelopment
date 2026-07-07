// Falcon Admin — positions page
(function () {
  'use strict';
  window.FP = window.FP || {};
  window.FP['positions'] = {
    html: `
    <div id="page-positions" class="page active">
      <h2>Positions</h2>
      <p class="page-sub">Current open positions across all accounts.</p>
      <div class="stat-row">
        <div class="stat">
          <div class="stat-label">Open Positions</div>
          <div class="stat-value" id="pos-open-count">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Total MTM</div>
          <div class="stat-value" id="pos-total-mtm">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Realized PnL</div>
          <div class="stat-value" id="pos-realized">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Unrealized PnL</div>
          <div class="stat-value" id="pos-unrealized">—</div>
        </div>
      </div>
      <div class="card">
        <div class="form-row">
          <div class="form-group">
            <label>Account ID (0 = all)</label>
            <input type="number" id="pos-account-id" value="0" min="0">
          </div>
          <div style="display:flex; gap:8px; align-items:flex-end;">
            <button class="btn btn-primary" id="btn-fetch-positions" onclick="fetchPositions()">Fetch Positions</button>
            <button class="btn btn-ghost" id="btn-export-positions" onclick="exportPositions()">Export CSV</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Account</th><th>Token</th><th>Net Qty</th><th>Avg Price</th>
                  <th>MTM</th><th>Realized PnL</th><th>Unrealized PnL</th></tr>
            </thead>
            <tbody id="positions-tbody">
              <tr class="empty-row"><td colspan="7">Click Fetch Positions to load data</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
`,
    init: null
  };
})();

// ── Positions ─────────────────────────────────────────────────────────────────
async function fetchPositions() {
  $('btn-fetch-positions').disabled = true;
  $('positions-tbody').innerHTML = `<tr class="empty-row"><td colspan="7"><span class="spinner"></span>Loading...</td></tr>`;
  const accountId = parseInt($('pos-account-id').value) || 0;
  try {
    const data = await sendCommand(CMD.GET_ALL_POSITIONS, { accountId });
    const rows = typeof data === 'string' ? JSON.parse(data) : (Array.isArray(data) ? data : []);
    renderPositionsTable(rows);

    // Compute stat card totals
    let openCount = 0, totalMtm = 0, totalReal = 0, totalUnreal = 0;
    rows.forEach(r => {
      if (r.netQty !== 0) openCount++;
      totalMtm    += Number(r.mtm)          || 0;
      totalReal   += Number(r.realizedPnl)  || 0;
      totalUnreal += Number(r.unrealizedPnl)|| 0;
    });
    $('pos-open-count').textContent = openCount;
    $('pos-total-mtm').textContent  = fmtN(totalMtm);
    $('pos-total-mtm').className    = 'stat-value ' + (totalMtm >= 0 ? 'green' : 'red');
    $('pos-realized').textContent   = fmtN(totalReal);
    $('pos-realized').className     = 'stat-value ' + (totalReal >= 0 ? 'green' : 'red');
    $('pos-unrealized').textContent = fmtN(totalUnreal);
    $('pos-unrealized').className   = 'stat-value ' + (totalUnreal >= 0 ? 'green' : 'red');
  } catch (e) {
    $('positions-tbody').innerHTML = `<tr class="empty-row"><td colspan="7" style="color:var(--danger)">${e.message}</td></tr>`;
  } finally {
    $('btn-fetch-positions').disabled = false;
  }
}

function renderPositionsTable(rows) {
  if (!rows.length) { $('positions-tbody').innerHTML = `<tr class="empty-row"><td colspan="7">No positions found</td></tr>`; return; }
  $('positions-tbody').innerHTML = rows.map(r => {
    const mtm    = Number(r.mtm)           || 0;
    const real   = Number(r.realizedPnl)   || 0;
    const unreal = Number(r.unrealizedPnl) || 0;
    return `<tr>
      <td>${r.accountId}</td>
      <td>${r.token}</td>
      <td><strong>${r.netQty}</strong></td>
      <td>${fmtN(r.avgPrice)}</td>
      <td class="${pnlClass(mtm)}">${fmtN(mtm)}</td>
      <td class="${pnlClass(real)}">${fmtN(real)}</td>
      <td class="${pnlClass(unreal)}">${fmtN(unreal)}</td>
    </tr>`;
  }).join('');
}

async function exportPositions() {
  $('btn-export-positions').disabled = true;
  const accountId = parseInt($('pos-account-id').value) || 0;
  try {
    const data = await sendCommand(CMD.EXPORT_POSITIONS, { accountId });
    const csv  = typeof data === 'string' ? data : (data && data.csv ? data.csv : JSON.stringify(data));
    downloadCsv(csv, `positions_${fmtDateStamp()}.csv`);
    toast('Export downloaded', 'success');
  } catch (e) { toast('Export failed: ' + e.message, 'error'); }
  finally { $('btn-export-positions').disabled = false; }
}
