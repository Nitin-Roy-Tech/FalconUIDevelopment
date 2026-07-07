// Falcon UI — Shared Utilities
// Common functions used across all pages

(function() {
  'use strict';
  
  // ── DOM Helpers ────────────────────────────────────────────────────────────
  window.$ = function(id) {
    return document.getElementById(id);
  };

  window.$$ = function(selector) {
    return document.querySelectorAll(selector);
  };

  // ── String Utilities ──────────────────────────────────────────────────────
  window.escapeHtml = function(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  // ── Number Formatting ────────────────────────────────────────────────────
  window.formatNumber = function(value) {
    var n = parseFloat(value);
    if (isNaN(n)) { return '-'; }
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  window.formatCurrency = function(value) {
    var n = parseFloat(value);
    if (isNaN(n)) { return '-'; }
    return '₹ ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ── Toast Notifications ────────────────────────────────────────────────────
  window.showToast = function(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    
    var toast = $('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'show ' + type;
    
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function() {
      toast.className = '';
    }, duration);
  };

  // ── Modal Helpers ──────────────────────────────────────────────────────────
  window.openModal = function(id) {
    var modal = $(id);
    if (modal) { modal.classList.remove('hidden'); }
  };

  window.closeModal = function(id) {
    var modal = $(id);
    if (modal) { modal.classList.add('hidden'); }
  };

  // ── Console Logging (with prefix) ──────────────────────────────────────────
  window.log = function(message, type) {
    type = type || 'log';
    console[type]('[Falcon UI] ' + message);
  };

  // ── WebSocket Communication (placeholder - override in main script) ────────
  window.sendCommand = function(type, payload) {
    return new Promise(function(reject) {
      reject(new Error('sendCommand not initialized. WebSocket connection required.'));
    });
  };

  log('✓ Utils initialized');
})();