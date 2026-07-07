// Falcon Admin — Strategies Page
(function () {
  'use strict';
  window.FP = window.FP || {};
  window.FP['strategies'] = {
    html: `
    <div id="page-strategies" class="page active">
      <h2>Strategies</h2>
      <p class="page-sub">Create and manage automated trading strategies.</p>
      <div class="stat-row">
        <div class="stat">
          <div class="stat-label">Total Strategies</div>
          <div class="stat-value" id="strat-count">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Active Instances</div>
          <div class="stat-value" id="strat-active">—</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">All Strategies</div>
          <button class="btn btn-primary btn-sm" id="btn-create-strategy">+ Create Strategy</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Description</th><th>Status</th><th>Instances</th><th>Actions</th></tr>
            </thead>
            <tbody id="strategies-tbody">
              <tr class="empty-row"><td colspan="6">Login to load data</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    `,
    init: null
  };
})();