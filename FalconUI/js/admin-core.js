// Falcon Admin — Core Application Logic
// Handles WebSocket communication, authentication, page routing, and global state

(function() {
  'use strict';

  // ── Global Namespace ────────────────────────────────────────────────────────
  window.FP = window.FP || {};
  window.AppState = {
    loggedIn: false,
    user: {},
    userRole: null, // 'admin' or 'trader'
    currentPage: 'dashboard'
  };

  // ── WebSocket Connection (placeholder for your backend) ────────────────────
  var ws = null;
  var wsConnected = false;

  window.initWebSocket = function(url) {
    try {
      ws = new WebSocket(url);
      
      ws.onopen = function() {
        wsConnected = true;
        log('✓ WebSocket connected', 'info');
      };

      ws.onmessage = function(event) {
        log('WebSocket message received', 'info');
      };

      ws.onerror = function(error) {
        log('✗ WebSocket error: ' + error.message, 'error');
        wsConnected = false;
      };

      ws.onclose = function() {
        wsConnected = false;
        log('✗ WebSocket disconnected', 'warn');
      };
    } catch(e) {
      log('Failed to initialize WebSocket: ' + e.message, 'error');
    }
  };

  // ── Backend Communication ──────────────────────────────────────────────────
  window.sendCommand = function(commandType, payload) {
    return new Promise(function(resolve, reject) {
      if (!wsConnected) {
        reject(new Error('WebSocket not connected. Initialize with initWebSocket(url)'));
        return;
      }

      try {
        var message = {
          type: commandType,
          payload: payload || {},
          timestamp: new Date().toISOString()
        };

        ws.send(JSON.stringify(message));
        log('Command sent: ' + commandType, 'info');
        
        // TODO: Implement proper message correlation/callbacks
        // For now, this is a placeholder
        resolve({ status: 'sent' });
      } catch(e) {
        reject(new Error('Failed to send command: ' + e.message));
      }
    });
  };

  // ── Page Management ────────────────────────────────────────────────────────
  window.showPage = function(pageName) {
    if (!window.FP[pageName]) {
      log('Page not found: ' + pageName, 'error');
      return;
    }

    // Hide all pages
    var pages = $$('.page');
    pages.forEach(function(p) { p.classList.remove('active'); });

    // Show selected page
    var pageHTML = window.FP[pageName].html;
    var mainEl = $('main');
    if (mainEl) {
      mainEl.innerHTML = pageHTML;
    }

    // Initialize page if it has init function
    if (window.FP[pageName].init) {
      window.FP[pageName].init();
    }

    // Update active nav item
    var navItems = $$('.nav-item');
    navItems.forEach(function(item) {
      item.classList.remove('active');
      if (item.dataset.page === pageName) {
        item.classList.add('active');
      }
    });

    AppState.currentPage = pageName;
    log('Page switched to: ' + pageName, 'info');
  };

  // ── Navigation Setup ──────────────────────────────────────────────────────
  window.initNavigation = function() {
    var navItems = $$('.nav-item');
    navItems.forEach(function(item) {
      item.addEventListener('click', function() {
        var page = this.dataset.page;
        if (page) {
          showPage(page);
        }
      });
    });
    log('Navigation initialized', 'info');
  };

  // ── Logout Handler ─────────────────────────────────────────────────────────
  window.logout = function() {
    AppState.loggedIn = false;
    AppState.user = {};
    sessionStorage.clear();
    window.location.href = 'login.html';
  };

  // ── Initialize App ────────────────────────────────────────────────────────
  window.initApp = function() {
    // Check if user is logged in
    var userData = sessionStorage.getItem('user');
    if (!userData) {
      window.location.href = 'login.html';
      return;
    }

    try {
      AppState.user = JSON.parse(userData);
      AppState.loggedIn = true;
      AppState.userRole = AppState.user.role;

      // Update topbar
      var userNameEl = $('topbar-user');
      if (userNameEl) {
        userNameEl.innerHTML = 'User: <span>' + AppState.user.name + '</span>';
      }

      // Setup logout button
      var logoutBtn = $('btn-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
      }

      // Initialize navigation
      initNavigation();

      // Load default page (dashboard)
      showPage('dashboard');

      log('✓ App initialized for: ' + AppState.user.name, 'info');
    } catch(e) {
      log('Error initializing app: ' + e.message, 'error');
      window.location.href = 'login.html';
    }
  };

  // ── Status/Error Display Helpers ──────────────────────────────────────────
  window.showStatus = function(message, type) {
    type = type || 'info';
    var statusEl = $('load-status');
    if (statusEl) {
      statusEl.innerHTML = message;
      statusEl.className = type;
      statusEl.style.display = '';
    }
  };

  window.hideStatus = function() {
    var statusEl = $('load-status');
    if (statusEl) {
      statusEl.style.display = 'none';
    }
  };

  window.showNseStatus = function(message, type) {
    type = type || 'info';
    var statusEl = $('nse-status');
    if (statusEl) {
      statusEl.innerHTML = message;
      statusEl.className = type;
      statusEl.style.display = '';
    }
  };

  // ── Global State Helpers ──────────────────────────────────────────────────
  window.state = AppState; // Alias for backward compatibility
  
  // Export to window for console debugging
  window.FalconDebug = {
    getState: function() { return AppState; },
    getConnected: function() { return wsConnected; },
    testCommand: function(cmd, payload) { 
      return sendCommand(cmd, payload).then(function(r) {
        console.log('Command result:', r);
        return r;
      }); 
    }
  };

  log('✓ Core application initialized', 'info');
})();