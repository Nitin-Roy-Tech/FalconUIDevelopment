// Falcon Admin — Risk Limits Page
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