/**
 * js/admin-core.js
 * Core application: WebSocket, authentication, command handling, routing
 */

// ── Global Application State ──
const state = {
  ws: null,
  connected: false,
  loggedIn: false,
  traderId: 0,
  sessionId: 0,
  roleId: 0,
  loginName: '',
  cmdId: 1,
  pending: {},
  csvText: null,
  traders: [],
};

// ── Router State ──
let _currentPage = 'dashboard';

// ── Instruments Browser State ──
const browseState = {
  stream: 0,
  symbol: '',
  expiry: '',
  symbols: [],
};

const nseState = {
  contractText: null,
  streamText: null,
};

// ── WebSocket Transport ──

function send(channel, obj) {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    const msg = JSON.stringify({ ch: channel, ...obj });
    state.ws.send(msg);
  }
}

function sendCommand(type, extra = {}) {
  return new Promise((resolve, reject) => {
    const id = state.cmdId++;
    state.pending[id] = { resolve, reject };
    
    setTimeout(() => {
      if (state.pending[id]) {
        delete state.pending[id];
        reject(new Error('Command timeout'));
      }
    }, 15000);
    
    send(CH.COMMAND, { type, id, ...extra });
  });
}

// ── Message Handler ──

function onMessage(ev) {
  try {
    const msg = JSON.parse(ev.data);
    const ch = msg.ch;
    
    if (ch === CH.COMMAND) {
      // Command response
      const cb = state.pending[msg.id];
      if (cb) {
        delete state.pending[msg.id];
        if (msg.error) {
          cb.reject(new Error(msg.error));
        } else {
          cb.resolve(msg.data);
        }
      }
    } else if (ch === CH.EVENT) {
      // Event message
      if (msg.type === MSG.LOGIN) {
        state.loggedIn = true;
        state.traderId = msg.traderId;
        state.sessionId = msg.sessionId;
        state.roleId = msg.roleId;
        state.loginName = msg.loginName;
        setConnState(true);
        showMainApp();
        onLoggedIn();
      } else if (msg.type === MSG.LOGOUT) {
        state.loggedIn = false;
        setConnState(false);
        showSplash();
      }
    }
  } catch (e) {
    console.error('Message parse error:', e);
  }
}

// ── WebSocket Connection ──

function connect() {
  const url = $('splash-url').value.trim();
  if (!url) {
    setSplashStatus('Enter WebSocket URL');
    return;
  }
  
  setSplashStatus('Connecting...');
  state.ws = new WebSocket(url);
  
  state.ws.onopen = () => {
    setSplashStatus('Connected. Waiting for login...');
    setConnState(true);
  };
  
  state.ws.onmessage = onMessage;
  
  state.ws.onerror = () => {
    setSplashStatus('Connection error');
    setConnState(false);
  };
  
  state.ws.onclose = () => {
    setConnState(false);
    showSplash();
  };
}

function disconnect() {
  if (state.ws) state.ws.close();
}

function doLogin() {
  const name = $('inp-name').value.trim();
  const pass = $('inp-pass').value.trim();
  
  if (!name || !pass) {
    setSplashStatus('Enter login name and password');
    return;
  }
  
  setSplashStatus('Logging in...');
  send(CH.COMMAND, { 
    type: MSG.LOGIN,
    loginName: name,
    password: pass,
  });
}

// ── Page Router ──

function showPage(name) {
  if (_currentPage === name) return;
  
  const pg = (window.FP || {})[name];
  if (!pg) {
    console.error('Page not found:', name);
    return;
  }
  
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.page === name) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Render page
  const content = $('content');
  if (content) {
    content.innerHTML = pg.html || '';
  }
  
  _currentPage = name;
  
  // Initialize page if handler exists
  if (pg.init && typeof pg.init === 'function') {
    pg.init();
  }
}

function onLoggedIn() {
  showPage('dashboard');
}

// ── Collapsible Cards ──

function initCollapsibleCards() {
  document.querySelectorAll('.card-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card');
      const wrap = card.querySelector('.card-body-wrap');
      if (wrap) {
        wrap.classList.toggle('is-collapsed');
        btn.classList.toggle('is-collapsed');
      }
    });
  });
}

// ── Auto-login Check ──

function checkAutoLogin() {
  const saved = localStorage.getItem('falcon_ws_url');
  if (saved) {
    $('splash-url').value = saved;
  }
  initCollapsibleCards();
}

// ── Event Bindings (when DOM is ready) ──

document.addEventListener('DOMContentLoaded', () => {
  // Splash screen bindings
  $('splash-url').onkeydown = e => { if (e.key === 'Enter') connect(); };
  $('btn-connect').onclick = connect;
  
  $('inp-name').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
  $('inp-pass').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
  $('btn-login').onclick = doLogin;
  
  $('btn-logout').onclick = () => {
    if (confirm('Logout?')) {
      send(CH.COMMAND, { type: MSG.LOGOUT });
    }
  };
  
  // Nav item bindings
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (page) showPage(page);
    });
  });
  
  // Initialize
  checkAutoLogin();
});
