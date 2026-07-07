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

// ── Traders ───────────────────────────────────────────────────────────────────
async function loadTraders() {
  $('traders-tbody').innerHTML = `<tr class="empty-row"><td colspan="9"><span class="spinner"></span>Loading...</td></tr>`;
  try {
    const data = await sendCommand(CMD.GET_ALL_TRADERS, {});
    const arr  = typeof data === 'string' ? JSON.parse(data) : (Array.isArray(data) ? data : []);
    state.traders = arr;
    if ($('dash-trader-count')) { $('dash-trader-count').textContent = arr.length; }
    renderTradersTable(arr);
  } catch (e) {
    $('traders-tbody').innerHTML = `<tr class="empty-row"><td colspan="9" style="color:var(--danger)">${e.message}</td></tr>`;
  }
}

function renderTradersTable(rows) {
  if (!rows.length) { $('traders-tbody').innerHTML = `<tr class="empty-row"><td colspan="9">No traders found</td></tr>`; return; }
  $('traders-tbody').innerHTML = rows.map(r => `
    <tr>
      <td>${r.traderId}</td>
      <td><strong>${r.loginName}</strong></td>
      <td>${r.firstName||''} ${r.lastName||''}</td>
      <td>${r.email||'—'}</td>
      <td>${r.mobile||'—'}</td>
      <td>${roleBadge(r.roleId)}</td>
      <td>${activeBadge(r.status)}</td>
      <td>${r.createdOn||'—'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-sm" onclick="openEditTrader(${r.traderId})">Edit</button>
        <button class="btn btn-ghost btn-sm" style="margin-left:4px" onclick="openResetPw(${r.traderId},'${r.loginName}')">Reset PW</button>
        <button class="btn btn-sm ${r.status ? 'btn-danger' : 'btn-success'}" style="margin-left:4px"
          onclick="toggleTrader(${r.traderId},${r.status})">${r.status ? 'Disable' : 'Enable'}</button>
      </td>
    </tr>`).join('');
}

function openAddTrader() {
  $('modal-trader-title').textContent = 'Add Trader';
  $('mt-trader-id').value = '';
  $('mt-login').value = ''; $('mt-login').disabled = false;
  $('mt-password').value = ''; $('mt-pass-group').style.display = '';
  $('mt-first').value = ''; $('mt-last').value = '';
  $('mt-email').value = ''; $('mt-mobile').value = '';
  $('mt-role').value = '2';
  $('mt-error').textContent = '';
  openModal('modal-trader');
  $('mt-login').focus();
}

function openEditTrader(traderId) {
  const t = state.traders.find(x => x.traderId === traderId);
  if (!t) return;
  $('modal-trader-title').textContent = 'Edit Trader';
  $('mt-trader-id').value = t.traderId;
  $('mt-login').value = t.loginName; $('mt-login').disabled = true;
  $('mt-pass-group').style.display = 'none';
  $('mt-first').value  = t.firstName || '';
  $('mt-last').value   = t.lastName  || '';
  $('mt-email').value  = t.email     || '';
  $('mt-mobile').value = t.mobile    || '';
  $('mt-role').value   = String(t.roleId);
  $('mt-error').textContent = '';
  openModal('modal-trader');
}

async function saveTrader() {
  $('mt-error').textContent = '';
  $('btn-save-trader').disabled = true;
  const tid = $('mt-trader-id').value;
  try {
    if (!tid) {
      // Create
      const login = $('mt-login').value.trim();
      const pass  = $('mt-password').value;
      if (!login || !pass) { $('mt-error').textContent = 'Login name and password are required'; return; }
      await sendCommand(CMD.CREATE_TRADER, {
        loginName: login, password: pass,
        firstName: $('mt-first').value.trim(),
        lastName:  $('mt-last').value.trim(),
        email:     $('mt-email').value.trim(),
        mobile:    $('mt-mobile').value.trim(),
        roleId:    parseInt($('mt-role').value),
      });
    } else {
      // Update
      await sendCommand(CMD.UPDATE_TRADER, {
        traderId:  parseInt(tid),
        firstName: $('mt-first').value.trim(),
        lastName:  $('mt-last').value.trim(),
        email:     $('mt-email').value.trim(),
        mobile:    $('mt-mobile').value.trim(),
        roleId:    parseInt($('mt-role').value),
      });
    }
    closeModal('modal-trader');
    toast('Trader saved successfully', 'success');
    await loadTraders();
  } catch (e) {
    $('mt-error').textContent = e.message;
  } finally {
    $('btn-save-trader').disabled = false;
  }
}

async function toggleTrader(traderId, currentStatus) {
  const action = currentStatus ? 'disable' : 're-enable';
  if (!confirm(`Are you sure you want to ${action} trader ${traderId}?`)) return;
  try {
    await sendCommand(CMD.DISABLE_TRADER, { traderId, status: currentStatus ? 0 : 1 });
    toast(`Trader ${action}d`, 'success');
    await loadTraders();
  } catch (e) { toast(e.message, 'error'); }
}

function openResetPw(traderId, loginName) {
  $('rp-trader-id').value = traderId;
  $('rp-login-name').textContent = loginName;
  $('rp-new-pass').value = '';
  $('rp-error').textContent = '';
  openModal('modal-reset-pw');
  $('rp-new-pass').focus();
}

async function confirmResetPw() {
  $('rp-error').textContent = '';
  const pass = $('rp-new-pass').value;
  if (pass.length < 6) { $('rp-error').textContent = 'Password must be at least 6 characters'; return; }
  $('btn-confirm-reset-pw').disabled = true;
  try {
    await sendCommand(CMD.RESET_PASSWORD, { traderId: parseInt($('rp-trader-id').value), newPassword: pass });
    closeModal('modal-reset-pw');
    toast('Password reset successfully', 'success');
  } catch (e) {
    $('rp-error').textContent = e.message;
  } finally {
    $('btn-confirm-reset-pw').disabled = false;
  }
}
