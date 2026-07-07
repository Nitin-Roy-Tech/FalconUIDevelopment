// Falcon Admin — orders page
(function () {
  'use strict';
  window.FP = window.FP || {};
  window.FP['orders'] = {
    html: `
    <div id="page-orders" class="page active">
      <h2>Orders</h2>
      <p class="page-sub">Read-only view of all orders. Filter by account to narrow results.</p>
      <div class="card">
        <div class="form-row">
          <div class="form-group">
            <label>Account ID (0 = all)</label>
            <input type="number" id="ord-account-id" value="0" min="0">
          </div>
          <div style="display:flex; gap:8px; align-items:flex-end;">
            <button class="btn btn-primary" id="btn-fetch-orders" onclick="fetchOrders()">Fetch Orders</button>
            <button class="btn btn-ghost" id="btn-export-orders" onclick="exportOrders()">Export CSV</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Order ID</th><th>Account</th><th>Token</th><th>Side</th><th>Type</th>
                  <th>Price</th><th>Qty</th><th>Filled Qty</th><th>Status</th></tr>
            </thead>
            <tbody id="orders-tbody">
              <tr class="empty-row"><td colspan="9">Click Fetch Orders to load data</td></tr>
            </tbody>
          </table>
        </div>
        <div id="orders-count" style="margin-top:10px; font-size:12px; color:var(--text-muted);"></div>
      </div>
    </div>
`,
    init: null
  };
})();
