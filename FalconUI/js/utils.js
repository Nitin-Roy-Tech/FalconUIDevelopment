/**
 * js/utils.js
 * Shared UI and utility helpers used across all pages
 */

// ── DOM Helper ──
const $ = id => document.getElementById(id);

// ── Splash Screen ──
function setSplashStatus(msg) {
  const el = $('splash-status');
  if (el) el.textContent = msg;
}

function showSplash() {
  const splash = $('splash-screen');
  const main = $('main-app');
  if (splash) splash.style.display = 'flex';
  if (main) main.style.display = 'none';
}

function showMainApp() {
  const splash = $('splash-screen');
  const main = $('main-app');
  if (splash) splash.style.display = 'none';
  if (main) main.style.display = 'flex';
}

// ── Connection State ──
function setConnState(isConnected) {
  const el = $('conn-state');
  if (!el) return;
  el.className = isConnected ? 'connected' : 'disconnected';
  el.textContent = isConnected ? '● Connected' : '● Disconnected';
}

// ── Toast Notifications ──
let toastTimer = null;
function toast(msg, type = 'info') {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast ' + type;
  el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.display = 'none';
  }, 4000);
}

// ── Status Messages (Load/Upload) ──
function showStatus(msg, type) {
  const el = $('load-status');
  if (!el) return;
  el.style.display = 'block';
  el.className = type;
  el.innerHTML = msg;
}

function hideStatus() {
  const el = $('load-status');
  if (el) el.style.display = 'none';
}

// ── NSE Status Messages ──
function showNseStatus(msg, type) {
  const el = $('nse-status');
  if (!el) return;
  el.style.display = 'block';
  el.className = type;
  el.innerHTML = msg;
}

// ── Modal Dialogs ──
function openModal(id) {
  const el = $(id);
  if (el) {
    el.classList.remove('hidden');
    el.style.display = 'flex';
  }
}

function closeModal(id) {
  const el = $(id);
  if (el) {
    el.classList.add('hidden');
    el.style.display = 'none';
  }
}

// ── Formatting Helpers ──

// Format number with thousands separator and optional decimals
function fmtN(n, decimals = 2) {
  if (n === null || n === undefined) return '—';
  if (typeof n !== 'number') n = parseFloat(n);
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// PnL color class
function pnlClass(val) {
  if (val === null || val === undefined) return '';
  return val > 0 ? 'green' : val < 0 ? 'red' : '';
}

// ── Badge Helpers ──

// Instrument type badge
function typeBadge(type) {
  const typeMap = {
    'FUT': 'Futures',
    'OPT': 'Option',
    'STK': 'Stock',
  };
  return typeMap[type] || type;
}

// Side badge (BUY/SELL)
function sideBadge(side) {
  return side === 'B' ? 'BUY' : side === 'S' ? 'SELL' : side;
}

// Order status badge
function statusBadge(status) {
  const statusMap = {
    'PND': 'Pending',
    'OPN': 'Open',
    'FLD': 'Filled',
    'CXL': 'Cancelled',
    'REJ': 'Rejected',
  };
  return statusMap[status] || status;
}

// Trader role badge
function roleBadge(roleId) {
  const roleMap = {
    1: 'Admin',
    2: 'Trader',
    3: 'Monitor',
  };
  return roleMap[roleId] || `Role ${roleId}`;
}

// Active/Inactive badge
function activeBadge(isActive) {
  return isActive ? 'Active' : 'Inactive';
}

// ── File/Export Helpers ──

// Download CSV file
function downloadCsv(filename, csvData) {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Format date with timestamp
function fmtDateStamp(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
