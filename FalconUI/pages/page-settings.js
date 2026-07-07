// Falcon Admin — settings page
(function () {
  'use strict';
  window.FP = window.FP || {};
  window.FP['settings'] = {
    html: `
    <div id="page-settings" class="page active">
      <h2>Settings</h2>
      <p class="page-sub">Application configuration key-value store.</p>
      <div class="card">
        <div class="card-header">
          <div class="card-title">All Settings</div>
          <button class="btn btn-ghost btn-sm" id="btn-refresh-settings" onclick="loadSettings()">Refresh</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Key</th><th>Value</th><th>Action</th></tr>
            </thead>
            <tbody id="settings-tbody">
              <tr class="empty-row"><td colspan="3">Login to load data</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
`,
    init: function () {
      loadSettings();
    }
  };
})();
