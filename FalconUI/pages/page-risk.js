// Falcon Admin — risk page
(function () {
  'use strict';
  window.FP = window.FP || {};
  window.FP['risk'] = {
    html: `
    <div id="page-risk" class="page active">
      <h2>Risk Limits</h2>
      <p class="page-sub">Configure global and per-trader risk parameters.</p>

      <div class="card">
        <div class="card-title">Global Risk</div>
        <div class="form-row">
          <div class="form-group">
            <label>Max Loss (INR)</label>
            <input type="number" id="risk-max-loss" placeholder="e.g. 100000" step="1000">
          </div>
          <div class="form-group">
            <label>Max Open Orders</label>
            <input type="number" id="risk-max-orders" placeholder="e.g. 100" min="1">
          </div>
          <div class="form-group">
            <label>Max Exposure (INR)</label>
            <input type="number" id="risk-max-exp" placeholder="e.g. 5000000" step="10000">
          </div>
          <div class="form-group">
            <label>Max Orders/Sec</label>
            <input type="number" id="risk-max-ops" placeholder="e.g. 10" min="1">
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-ghost" id="btn-load-global-risk" onclick="loadGlobalRisk()">Load</button>
          <button class="btn btn-primary" id="btn-save-global-risk" onclick="saveGlobalRisk()">Save Global Risk</button>
        </div>
        <div id="risk-global-msg" style="margin-top:10px; font-size:12px; min-height:16px;"></div>
      </div>

      <div class="card">
        <div class="card-title">Trader Risk</div>
        <div class="form-row">
          <div class="form-group">
            <label>Trader ID</label>
            <input type="number" id="trisk-trader-id" placeholder="e.g. 1" min="1">
          </div>
          <div style="align-self:flex-end;">
            <button class="btn btn-ghost" id="btn-load-trader-risk" onclick="loadTraderRisk()">Load</button>
          </div>
        </div>
        <div class="form-row" id="trader-risk-fields" style="display:none">
          <div class="form-group">
            <label>Max Loss (INR)</label>
            <input type="number" id="trisk-max-loss" step="1000">
          </div>
          <div class="form-group">
            <label>Max Position</label>
            <input type="number" id="trisk-max-pos" min="1">
          </div>
          <div class="form-group">
            <label>Max Order Qty</label>
            <input type="number" id="trisk-max-qty" min="1">
          </div>
        </div>
        <button class="btn btn-primary" id="btn-save-trader-risk" onclick="saveTraderRisk()" style="display:none">Save Trader Risk</button>
        <div id="risk-trader-msg" style="margin-top:10px; font-size:12px; min-height:16px;"></div>
      </div>
    </div>
`,
    init: null
  };
})();

// ── Risk ──────────────────────────────────────────────────────────────────────
async function loadGlobalRisk() {
  $('risk-global-msg').textContent = '';
  try {
    const data = await sendCommand(CMD.GET_GLOBAL_RISK, {});
    const r    = typeof data === 'string' ? JSON.parse(data) : data;
    $('risk-max-loss').value   = r.maxLoss           ?? '';
    $('risk-max-orders').value = r.maxOpenOrders     ?? '';
    $('risk-max-exp').value    = r.maxExposure       ?? '';
    $('risk-max-ops').value    = r.maxOrdersPerSecond ?? '';
    $('risk-global-msg').style.color = 'var(--success)';
    $('risk-global-msg').textContent = 'Loaded';
  } catch (e) {
    $('risk-global-msg').style.color = 'var(--danger)';
    $('risk-global-msg').textContent = e.message;
  }
}

async function saveGlobalRisk() {
  $('risk-global-msg').textContent = '';
  $('btn-save-global-risk').disabled = true;
  try {
    await sendCommand(CMD.SET_GLOBAL_RISK, {
      maxLoss:           parseFloat($('risk-max-loss').value)   || 0,
      maxOpenOrders:     parseInt($('risk-max-orders').value)   || 0,
      maxExposure:       parseFloat($('risk-max-exp').value)    || 0,
      maxOrdersPerSecond:parseInt($('risk-max-ops').value)      || 0,
    });
    $('risk-global-msg').style.color = 'var(--success)';
    $('risk-global-msg').textContent = 'Saved successfully';
    toast('Global risk saved', 'success');
    loadDashboard();
  } catch (e) {
    $('risk-global-msg').style.color = 'var(--danger)';
    $('risk-global-msg').textContent = e.message;
  } finally { $('btn-save-global-risk').disabled = false; }
}

async function loadTraderRisk() {
  const tid = parseInt($('trisk-trader-id').value);
  if (!tid) { $('risk-trader-msg').textContent = 'Enter a trader ID'; return; }
  $('risk-trader-msg').textContent = '';
  try {
    const data = await sendCommand(CMD.GET_TRADER_RISK, { traderId: tid });
    const r    = typeof data === 'string' ? JSON.parse(data) : data;
    $('trisk-max-loss').value = r.maxLoss;
    $('trisk-max-pos').value  = r.maxPosition;
    $('trisk-max-qty').value  = r.maxOrderQty;
    $('trader-risk-fields').style.display   = '';
    $('btn-save-trader-risk').style.display = '';
    $('risk-trader-msg').style.color = 'var(--success)';
    $('risk-trader-msg').textContent = 'Loaded';
  } catch (e) {
    $('risk-trader-msg').style.color = 'var(--danger)';
    $('risk-trader-msg').textContent = e.message;
  }
}

async function saveTraderRisk() {
  const tid = parseInt($('trisk-trader-id').value);
  $('btn-save-trader-risk').disabled = true;
  try {
    await sendCommand(CMD.SET_TRADER_RISK, {
      traderId:    tid,
      maxLoss:     parseFloat($('trisk-max-loss').value) || 0,
      maxPosition: parseInt($('trisk-max-pos').value)   || 0,
      maxOrderQty: parseInt($('trisk-max-qty').value)   || 0,
    });
    $('risk-trader-msg').style.color = 'var(--success)';
    $('risk-trader-msg').textContent = 'Saved successfully';
    toast('Trader risk saved', 'success');
  } catch (e) {
    $('risk-trader-msg').style.color = 'var(--danger)';
    $('risk-trader-msg').textContent = e.message;
  } finally { $('btn-save-trader-risk').disabled = false; }
}
