// Falcon Admin — Positions Page
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