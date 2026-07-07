// Falcon Admin — DOM & utility helpers
const $ = id => document.getElementById(id);

function log() {
  if (typeof console !== 'undefined' && console.log) {
    console.log.apply(console, arguments);
  }
}

function setSplashStatus(msg, type) {
  const el = $('splash-status');
  if (!el) { return; }
  el.textContent = msg;
  el.className = type || 'info';
}

function showSplash(step) {
  const mainApp = $('main-app');
  const splash = $('splash');
  if (mainApp) { mainApp.style.display = 'none'; }
  if (!splash) { return; }
  splash.style.display = 'flex';
  if (step === 'login') {
    if ($('splash-step-connect')) { $('splash-step-connect').style.display = 'none'; }
    if ($('splash-step-login')) { $('splash-step-login').style.display = ''; }
    if ($('login-error')) { $('login-error').textContent = ''; }
    if ($('btn-login')) { $('btn-login').disabled = false; }
    setTimeout(() => { if ($('inp-user')) { $('inp-user').focus(); } }, 50);
  } else {
    if ($('splash-step-connect')) { $('splash-step-connect').style.display = ''; }
    if ($('splash-step-login')) { $('splash-step-login').style.display = 'none'; }
    setSplashStatus('', 'info');
    if ($('splash-btn-connect')) { $('splash-btn-connect').disabled = false; }
  }
}

function showMainApp() {
  if ($('splash')) { $('splash').style.display = 'none'; }
  if ($('main-app')) { $('main-app').style.display = 'flex'; }
}

// kept for compatibility with any remaining references
function setConnState(s) {}

let toastTimer = null;
function toast(msg, type = 'info') {
  const el = document.getElementById('__toast__') || document.createElement('div');
  el.id = '__toast__';
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  if (toastTimer) { clearTimeout(toastTimer); }
  toastTimer = setTimeout(() => el.remove(), 3500);
}

function openModal(id) { const el = $(id); if (el) { el.classList.remove('hidden'); } }
function closeModal(id) { const el = $(id); if (el) { el.classList.add('hidden'); } }

function pnlClass(v) { return v >= 0 ? 'pnl-pos' : 'pnl-neg'; }
function fmtN(v) { return (v === undefined || v === null) ? '—' : Number(v).toLocaleString('en-IN', {maximumFractionDigits: 2}); }

function typeBadge(t) {
  const map = { EQ:'badge-eq', FUT:'badge-fut', CE:'badge-ce', PE:'badge-pe' };
  return `<span class="badge ${map[t]||'badge-def'}">${t||'—'}</span>`;
}
function sideBadge(s) {
  return `<span class="badge ${s==='BUY'||s==='B'?'badge-buy':'badge-sell'}">${s||'—'}</span>`;
}
function statusBadge(s) {
  const cls = {FILLED:'badge-filled',OPEN:'badge-open',PENDING:'badge-open',CANCELLED:'badge-canc',REJECTED:'badge-rej'};
  return `<span class="badge ${cls[s]||'badge-def'}">${s||'—'}</span>`;
}
function roleBadge(rid) {
  return rid === 1 ? '<span class="badge badge-admin">Admin</span>' : '<span class="badge badge-trader">Trader</span>';
}
function activeBadge(status) {
  return status ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-disabled">Disabled</span>';
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtDateStamp() {
  const d = new Date();
  return d.getFullYear().toString()
    + String(d.getMonth()+1).padStart(2,'0')
    + String(d.getDate()).padStart(2,'0')
    + '_' + String(d.getHours()).padStart(2,'0')
    + String(d.getMinutes()).padStart(2,'0')
    + String(d.getSeconds()).padStart(2,'0');
}
