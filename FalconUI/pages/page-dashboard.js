// Falcon Admin — Dashboard Page
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