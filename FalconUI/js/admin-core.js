// Falcon Admin — core application logic
window.FP = window.FP || {};

const state = window.state || {
  ws:        null,
  connected: false,
  loggedIn:  false,
  traderId:  0,
  sessionId: 0,
  roleId:    0,
  loginName: '',
  cmdId:     1,
  pending:   {},
  csvText:   null,
  traders:   [],
};
window.state = state;

const COMMAND_TIMEOUT_MS = 15000;

function getContentHost() {
  return $('content') || $('page-content');
}

function setTopbarUser(name) {
  if ($('topbar-username')) {
    $('topbar-username').textContent = name;
    return;
  }
  if ($('topbar-user')) {
    $('topbar-user').textContent = name ? 'Logged in as ' + name : '';
  }
}

// ── WebSocket send helpers ───────────────────────────────────────────────────
function send(ch, data) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) { return; }
  state.ws.send(JSON.stringify({ ch, data }));
}

function sendCommand(type, extra) {
  return new Promise((resolve, reject) => {
    const id = state.cmdId++;
    state.pending[id] = { resolve, reject };
    setTimeout(() => {
      if (state.pending[id]) { delete state.pending[id]; reject(new Error('Timeout')); }
    }, COMMAND_TIMEOUT_MS);
    send(CH.COMMAND, { type, id, ...extra });
  });
}
window.sendCommand = sendCommand;

function showStatus(msg, type) {
  const el = $('load-status');
  if (!el) { return; }
  el.style.display = 'block';
  el.className = type;
  el.innerHTML = msg;
}

function hideStatus() {
  const el = $('load-status');
  if (el) { el.style.display = 'none'; }
}

function showNseStatus(msg, type) {
  const el = $('nse-status');
  if (!el) { return; }
  el.style.display = 'block';
  el.className = type;
  el.innerHTML = msg;
}

// ── Message handler ──────────────────────────────────────────────────────────
function onMessage(raw) {
  let msg;
  try { msg = JSON.parse(raw); } catch { return; }
  if (msg.ch === CH.EVENT) {
    const d = msg.data;
    if (d.type === MSG.LOGIN_ACK) {
      state.loggedIn = true;
      state.traderId = d.traderId;
      state.sessionId = d.sessionId;
      state.roleId = d.roleId;
      setTopbarUser(state.loginName);
      showMainApp();
      onLoggedIn();
      return;
    }
    if (d.type === MSG.LOGIN_NACK) {
      if ($('login-error')) { $('login-error').textContent = d.error || 'Login failed'; }
      if ($('btn-login')) { $('btn-login').disabled = false; }
      if ($('inp-pass')) { $('inp-pass').focus(); }
      return;
    }
    if (d.commandId !== undefined) {
      const cb = state.pending[d.commandId];
      if (cb) {
        delete state.pending[d.commandId];
        if (d.success) {
          cb.resolve(d.data);
        } else {
          if (d.error && d.error.startsWith('Session expired')) {
            Object.values(state.pending).forEach(p => p.reject(new Error('Session expired')));
            state.pending = {};
            state.loggedIn = false;
            toast('Session expired. Please log in again.', 'error');
            disconnect();
            return;
          }
          cb.reject(new Error(d.error || 'Command failed'));
        }
      }
    }
  }
}

function onLoggedIn() {
  showPage('dashboard');
}

// ── Connect / disconnect ─────────────────────────────────────────────────────
function connect() {
  const urlEl = $('splash-url');
  const url = urlEl ? urlEl.value.trim() : '';
  if (!url) { return; }
  setSplashStatus('Connecting...', 'info');
  if ($('splash-btn-connect')) { $('splash-btn-connect').disabled = true; }
  state.ws = new WebSocket(url);
  state.ws.onopen = () => {
    state.connected = true;
    showSplash('login');
  };
  state.ws.onmessage = e => onMessage(e.data);
  state.ws.onerror = () => {};
  state.ws.onclose = () => {
    state.connected = false;
    state.loggedIn = false;
    state.cmdId = 1;
    state.pending = {};
    var el;
    if ((el = $('btn-load'))) { el.disabled = true; }
    if ((el = $('btn-delete'))) { el.disabled = true; }
    if ((el = $('btn-nse-load'))) { el.disabled = true; }
    if ((el = $('inst-count'))) { el.textContent = '—'; }
    if ($('splash')) {
      showSplash('connect');
    } else if (window.location.pathname.endsWith('/admin.html') || window.location.pathname.endsWith('admin.html')) {
      window.location.href = 'login.html';
    }
  };
}

function disconnect() {
  if (state.ws) { state.ws.close(); state.ws = null; }
}

function doLogin() {
  const loginEl = $('inp-user');
  const passEl = $('inp-pass');
  const loginName = loginEl ? loginEl.value.trim() : '';
  const password = passEl ? passEl.value : '';
  if (!loginName || !password) {
    if ($('login-error')) { $('login-error').textContent = 'Enter username and password'; }
    return;
  }
  if ($('login-error')) { $('login-error').textContent = ''; }
  if ($('btn-login')) { $('btn-login').disabled = true; }
  state.loginName = loginName;
  send(CH.EVENT, {
    type: MSG.LOGIN, traderId: 0, sessionId: 0,
    loginName, password, ip: '127.0.0.1', machine: 'browser', version: '1.0',
  });
  setTimeout(() => { if ($('btn-login')) { $('btn-login').disabled = false; } }, 5000);
}

// ── Page registry & router ───────────────────────────────────────────────────
var _currentPage = null;
var _coreBound = false;

function showPage(name) {
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var navItem = document.querySelector('.nav-item[data-page="' + name + '"]');
  if (navItem) { navItem.classList.add('active'); }

  var pg = (window.FP || {})[name];
  if (!pg) { console.warn('Falcon: page not registered:', name); return; }
  var host = getContentHost();
  if (!host) { return; }
  host.innerHTML = pg.html;
  var pageEl = host.querySelector('.page');
  if (pageEl) { pageEl.classList.add('active'); }
  initCollapsibleCards();
  if (pg.init) { pg.init(); }

  if (state.loggedIn) {
    if (name === 'dashboard') { loadDashboard(); }
    if (name === 'traders') { loadTraders(); }
    if (name === 'instruments') { loadStreamStats(); refreshCount(); }
    if (name === 'strategies') { loadStrategiesPage(); }
  }
  _currentPage = name;
}

// ── Navigation ───────────────────────────────────────────────────────────────
function bindCoreEvents() {
  if (_coreBound) { return; }
  _coreBound = true;

  if ($('splash-btn-connect')) { $('splash-btn-connect').onclick = connect; }
  if ($('splash-url')) { $('splash-url').onkeydown = e => { if (e.key === 'Enter') connect(); }; }
  if ($('btn-login')) { $('btn-login').onclick = doLogin; }
  if ($('splash-btn-disconnect')) { $('splash-btn-disconnect').onclick = disconnect; }
  if ($('inp-pass')) { $('inp-pass').onkeydown = e => { if (e.key === 'Enter') doLogin(); }; }
  if ($('inp-user')) { $('inp-user').onkeydown = e => { if (e.key === 'Enter' && $('inp-pass')) $('inp-pass').focus(); }; }

  if ($('btn-logout')) {
    $('btn-logout').onclick = () => {
      send(CH.EVENT, { type: MSG.LOGOUT, traderId: state.traderId, sessionId: state.sessionId });
      disconnect();
    };
  }

  if ($('btn-save-trader') && typeof saveTrader === 'function') { $('btn-save-trader').onclick = saveTrader; }
  if ($('btn-confirm-reset-pw') && typeof confirmResetPw === 'function') { $('btn-confirm-reset-pw').onclick = confirmResetPw; }

  document.querySelectorAll('.nav-item[data-page]').forEach(function(item) {
    item.addEventListener('click', function() {
      showPage(item.dataset.page);
    });
  });
}

// ── Collapsible Cards ────────────────────────────────────────────────────────
function initCollapsibleCards()
{
  document.querySelectorAll('.card').forEach(function(card, idx)
  {
    // Skip cards already wired (chevron button already present)
    if (card.querySelector('.card-toggle-btn')) { return; }

    var children = Array.from(card.children);
    if (children.length < 2) { return; }   // nothing to collapse

    var header = children[0];
    var id = 'cc-' + (card.id || ('auto-' + idx));

    // Make header a flex row so chevron sits on the right.
    // card-header is already flex; card-title and custom headers are not.
    if (!header.classList.contains('card-header'))
    {
      header.style.display        = 'flex';
      header.style.alignItems     = 'center';
      header.style.justifyContent = 'space-between';
    }

    // Remove the bottom spacing from the header and transfer it to the body
    // wrapper so it disappears when the card is collapsed.
    var bodyTopPadding = '0px';
    if (header.classList.contains('card-title'))
    {
      header.style.marginBottom = '0';
      bodyTopPadding = '16px';
    }
    else if (header.classList.contains('card-header'))
    {
      header.style.marginBottom = '0';
      bodyTopPadding = '16px';
    }
    // Browse card (padding:0, custom header) — grid starts right below
    // the border, no extra spacing needed.

    // ── Chevron button ────────────────────────────────────────────────────
    var btn = document.createElement('button');
    btn.className = 'card-toggle-btn';
    btn.title     = 'Collapse / Expand';
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none">' +
      '<path d="M2 5l5 5 5-5" stroke="currentColor" stroke-width="1.8"' +
      ' stroke-linecap="round" stroke-linejoin="round"/></svg>';
    header.appendChild(btn);

    // ── Wrap remaining children in a collapsible body div ─────────────────
    var body = document.createElement('div');
    body.className = 'card-body-wrap';
    if (bodyTopPadding !== '0px') { body.style.paddingTop = bodyTopPadding; }
    children.slice(1).forEach(function(c) { body.appendChild(c); });
    card.appendChild(body);

    // ── Toggle handler ────────────────────────────────────────────────────
    function applyState(collapsed)
    {
      body.classList.toggle('is-collapsed', collapsed);
      btn.classList.toggle('is-collapsed', collapsed);
    }

    btn.addEventListener('click', function(e)
    {
      e.stopPropagation();
      var collapsed = !body.classList.contains('is-collapsed');
      applyState(collapsed);
      try { localStorage.setItem(id, collapsed ? '1' : '0'); } catch(ex) {}
    });

    // ── Restore saved state ───────────────────────────────────────────────
    var saved;
    try { saved = localStorage.getItem(id); } catch(ex) {}
    applyState(saved === '1');
  });
}


// ── Auto-login from login.html ───────────────────────────────────────────────
function checkAutoLogin()
{
  var raw = sessionStorage.getItem('falcon_auth');
  if (!raw) { return; } // no auto-login — splash handles it normally
  sessionStorage.removeItem('falcon_auth');
  var auth;
  try { auth = JSON.parse(raw); } catch(e) { return; }
  if (!auth.wsUrl || !auth.loginName || !auth.password) { return; }
  state.loginName = auth.loginName;
  var ws2 = new WebSocket(auth.wsUrl);
  state.ws = ws2;
  ws2.onopen = function()
  {
    state.connected = true;
    send(CH.EVENT, {
      type: MSG.LOGIN, traderId: 0, sessionId: 0,
      loginName: auth.loginName, password: auth.password,
      ip: '127.0.0.1', machine: 'browser', version: '1.0'
    });
  };
  ws2.onmessage = function(e) { onMessage(e.data); };
  ws2.onerror   = function() { window.location.href = 'login.html'; };
  ws2.onclose   = function()
  {
    state.connected = false;
    state.loggedIn  = false;
    state.cmdId     = 1;
    state.pending   = {};
    window.location.href = 'login.html';
  };
}


function initApp() {
  bindCoreEvents();
  initCollapsibleCards();
  if ($('splash')) {
    showSplash('connect');
    checkAutoLogin();
    return;
  }
  checkAutoLogin();
  if (!_currentPage && window.FP && window.FP.dashboard) {
    showPage('dashboard');
  }
}

window.initApp = initApp;
window.showPage = showPage;
window.connect = connect;
window.disconnect = disconnect;
window.doLogin = doLogin;
window.showStatus = showStatus;
window.hideStatus = hideStatus;
window.showNseStatus = showNseStatus;
