// Falcon Admin — traders page
(function () {
  'use strict';
  window.FP = window.FP || {};
  window.FP['traders'] = {
    html: `
    <div id="page-traders" class="page active">
      <h2>Traders</h2>
      <p class="page-sub">Manage user accounts, roles, and credentials.</p>
      <div class="card">
        <div class="card-header">
          <div class="card-title">All Traders</div>
          <button class="btn btn-primary btn-sm" id="btn-add-trader" onclick="openAddTrader()">+ Add Trader</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Login Name</th><th>Name</th><th>Email</th><th>Mobile</th>
                  <th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody id="traders-tbody">
              <tr class="empty-row"><td colspan="9">Login to load data</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
`,
    init: null
  };
})();
