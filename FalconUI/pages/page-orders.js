// Falcon Admin — orders page
(function () {
  'use strict';
  window.FP = window.FP || {};
  window.FP['orders'] = {
    html: `
    <div id="page-orders" class="page active">
      <h2>Orders</h2>
      <p class="page-sub">Read-only view of all orders. Filter by account to narrow results.</p>
      <div class="card">
        <div class="form-row">
          <div class="form-group">
            <label>Account ID (0 = all)</label>
            <input type="number" id="ord-account-id" value="0" min="0">
          </div>
          <div style="display:flex; gap:8px; align-items:flex-end;">
            <button class="btn btn-primary" id="btn-fetch-orders" onclick="fetchOrders()">Fetch Orders</button>
            <button class="btn btn-ghost" id="btn-export-orders" onclick="exportOrders()">Export CSV</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Order ID</th><th>Account</th><th>Token</th><th>Side</th><th>Type</th>
                  <th>Price</th><th>Qty</th><th>Filled Qty</th><th>Status</th></tr>
            </thead>
            <tbody id="orders-tbody">
              <tr class="empty-row"><td colspan="9">Click Fetch Orders to load data</td></tr>
            </tbody>
          </table>
        </div>
        <div id="orders-count" style="margin-top:10px; font-size:12px; color:var(--text-muted);"></div>
      </div>
    </div>
`,
    init: null
  };
})();

// ── Orders ────────────────────────────────────────────────────────────────────
async function fetchOrders() {
  $('btn-fetch-orders').disabled = true;
  $('orders-tbody').innerHTML = `<tr class="empty-row"><td colspan="9"><span class="spinner"></span>Loading...</td></tr>`;
  const accountId = parseInt($('ord-account-id').value) || 0;
  try {
    const data = await sendCommand(CMD.GET_ORDERS_BY_TRADER, { accountId });
    const rows = typeof data === 'string' ? JSON.parse(data) : (Array.isArray(data) ? data : []);
    renderOrdersTable(rows);
    $('orders-count').textContent = `${rows.length} order${rows.length !== 1 ? 's' : ''} fetched`;
  } catch (e) {
    $('orders-tbody').innerHTML = `<tr class="empty-row"><td colspan="9" style="color:var(--danger)">${e.message}</td></tr>`;
    $('orders-count').textContent = '';
  } finally {
    $('btn-fetch-orders').disabled = false;
  }
}

function renderOrdersTable(rows) {
  if (!rows.length) { $('orders-tbody').innerHTML = `<tr class="empty-row"><td colspan="9">No orders found</td></tr>`; return; }
  $('orders-tbody').innerHTML = rows.map(r => `
    <tr>
      <td>${r.orderId}</td>
      <td>${r.accountId}</td>
      <td>${r.token}</td>
      <td>${sideBadge(r.side)}</td>
      <td>${r.type||'—'}</td>
      <td>${fmtN(r.price)}</td>
      <td>${fmtN(r.qty)}</td>
      <td>${fmtN(r.filledQty)}</td>
      <td>${statusBadge(r.status)}</td>
    </tr>`).join('');
}

async function exportOrders() {
  $('btn-export-orders').disabled = true;
  const accountId = parseInt($('ord-account-id').value) || 0;
  try {
    const data = await sendCommand(CMD.EXPORT_ORDERS, { accountId });
    const csv  = typeof data === 'string' ? data : (data && data.csv ? data.csv : JSON.stringify(data));
    downloadCsv(csv, `orders_${fmtDateStamp()}.csv`);
    toast('Export downloaded', 'success');
  } catch (e) { toast('Export failed: ' + e.message, 'error'); }
  finally { $('btn-export-orders').disabled = false; }
}
