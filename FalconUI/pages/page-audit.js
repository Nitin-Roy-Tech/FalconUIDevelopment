// Falcon Admin — audit page
(function () {
  'use strict';
  window.FP = window.FP || {};
  window.FP['audit'] = {
    html: `
    <div id="page-audit" class="page active">
      <h2>Audit Log</h2>
      <p class="page-sub">System event history for compliance and diagnostics.</p>
      <div class="card">
        <div class="form-row">
          <div class="form-group">
            <label>Trader ID (0 = all)</label>
            <input type="number" id="audit-trader-id" value="0" min="0">
          </div>
          <div class="form-group">
            <label>Module filter</label>
            <input type="text" id="audit-module" placeholder="e.g. Session, Order">
          </div>
          <div class="form-group">
            <label>Limit</label>
            <select id="audit-limit">
              <option value="50">50</option>
              <option value="100" selected>100</option>
              <option value="200">200</option>
              <option value="500">500</option>
            </select>
          </div>
          <div style="align-self:flex-end;">
            <button class="btn btn-primary" id="btn-fetch-audit" onclick="fetchAudit()">Fetch</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Trader ID</th><th>Module</th><th>Action</th><th>Description</th></tr>
            </thead>
            <tbody id="audit-tbody">
              <tr class="empty-row"><td colspan="5">Click Fetch to load data</td></tr>
            </tbody>
          </table>
        </div>
        <div id="audit-count" style="margin-top:10px; font-size:12px; color:var(--text-muted);"></div>
      </div>
    </div>
`,
    init: null
  };
})();

// ── Audit Log ─────────────────────────────────────────────────────────────────
async function fetchAudit() {
  $('btn-fetch-audit').disabled = true;
  $('audit-tbody').innerHTML = `<tr class="empty-row"><td colspan="5"><span class="spinner"></span>Loading...</td></tr>`;
  const traderId = parseInt($('audit-trader-id').value) || 0;
  const module_  = $('audit-module').value.trim();
  const limit    = parseInt($('audit-limit').value) || 100;
  try {
    const data = await sendCommand(CMD.GET_AUDIT_LOG, { traderId, module: module_, limit });
    const rows = typeof data === 'string' ? JSON.parse(data) : (Array.isArray(data) ? data : []);
    renderAuditTable(rows);
    $('audit-count').textContent = `${rows.length} event${rows.length !== 1 ? 's' : ''}`;
  } catch (e) {
    $('audit-tbody').innerHTML = `<tr class="empty-row"><td colspan="5" style="color:var(--danger)">${e.message}</td></tr>`;
    $('audit-count').textContent = '';
  } finally { $('btn-fetch-audit').disabled = false; }
}

function renderAuditTable(rows) {
  if (!rows.length) { $('audit-tbody').innerHTML = `<tr class="empty-row"><td colspan="5">No events found</td></tr>`; return; }
  $('audit-tbody').innerHTML = rows.map(r => `
    <tr>
      <td>${r.time||'—'}</td>
      <td>${r.traderId}</td>
      <td>${r.module||'—'}</td>
      <td>${r.action||'—'}</td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis">${r.desc||'—'}</td>
    </tr>`).join('');
}
