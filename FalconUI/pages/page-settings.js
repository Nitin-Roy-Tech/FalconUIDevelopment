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
    init: null
  };
})();

// ── Settings ──────────────────────────────────────────────────────────────────
async function loadSettings() {
  $('btn-refresh-settings').disabled = true;
  $('settings-tbody').innerHTML = `<tr class="empty-row"><td colspan="3"><span class="spinner"></span>Loading...</td></tr>`;
  try {
    const data = await sendCommand(CMD.GET_ALL_SETTINGS, {});
    const settings = typeof data === 'string' ? JSON.parse(data) : (Array.isArray(data) ? data : []);
    renderSettingsTable(settings);
  } catch (e) {
    $('settings-tbody').innerHTML = `<tr class="empty-row"><td colspan="3" style="color:var(--danger)">${e.message}</td></tr>`;
  } finally { $('btn-refresh-settings').disabled = false; }
}

function renderSettingsTable(rows) {
  if (!rows.length) { $('settings-tbody').innerHTML = `<tr class="empty-row"><td colspan="3">No settings found</td></tr>`; return; }
  $('settings-tbody').innerHTML = rows.map(r => `
    <tr>
      <td style="font-family:monospace;font-size:12px;color:var(--accent)">${r.key||r.settingKey||'—'}</td>
      <td>${r.value||r.settingValue||'—'}</td>
      <td><button class="btn btn-ghost btn-sm"
          data-k="${(r.key||r.settingKey||'').replace(/"/g,'&quot;')}"
          data-v="${(r.value||r.settingValue||'').replace(/"/g,'&quot;')}"
          onclick="openEditSetting(this.dataset.k,this.dataset.v)">Edit</button></td>
    </tr>`).join('');
}

function openEditSetting(key, value) {
  $('es-key').value       = key;
  $('es-key-label').textContent = key;
  $('es-value').value     = value;
  $('es-error').textContent = '';
  openModal('modal-setting');
  $('es-value').focus();
}

async function saveSetting() {
  $('es-error').textContent = '';
  $('btn-save-setting').disabled = true;
  const key   = $('es-key').value;
  const value = $('es-value').value;
  try {
    await sendCommand(CMD.SET_SETTING, { key, value });
    closeModal('modal-setting');
    toast('Setting saved', 'success');
    await loadSettings();
  } catch (e) {
    $('es-error').textContent = e.message;
  } finally { $('btn-save-setting').disabled = false; }
}
