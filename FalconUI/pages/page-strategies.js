// Falcon Admin -- Strategies page
// Manages strategy templates (catalog) and instances.

alert("Loading page-strategies.js");

(function () {
  'use strict';
  window.FP = window.FP || {};
  window.FP['strategies'] = window.FP['strategies'] || { html: '', init: null };

  // ── Strategy admin command types ──────────────────────────────────────────
  var SC = {
    CREATE_STRATEGY    : 48,
    UPDATE_STRATEGY    : 49,
    GET_ALL_STRATEGIES : 50,
    GET_ALL_INSTANCES  : 51,
    CREATE_INSTANCE    : 52,
    DELETE_INSTANCE    : 54,
    ENABLE_INSTANCE    : 55,
    SET_PARAMETER      : 56,
    GET_PARAMETERS     : 57,
    ADD_INSTRUMENT     : 58,
    KILL_ALL           : 60,
    GET_INSTRUMENTS    : 61
  };

  // ── Page state ────────────────────────────────────────────────────────────
  var ss = {
    catalog      : [],
    instances    : [],
    stratMap     : {},
    selectedId   : 0,
    editedParams : {},
    newLegs      : [],
    newParams    : [],
    editingStrat : null
  };

  // ── DOM helper ────────────────────────────────────────────────────────────
  function ge(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function statusStyle(status) {
    var u = (status || '').toUpperCase();
    if (u === 'ACTIVE')  { return 'background:#d1fae5;color:#065f46'; }
    if (u === 'CREATED') { return 'background:#dbeafe;color:#1e3a8a'; }
    if (u === 'REMOVED') { return 'background:#fee2e2;color:#991b1b'; }
    return 'background:var(--surface2);color:var(--text-muted)';
  }

  function stratName(id) { return ss.stratMap[id] || ('ID:' + id); }

  var INP = 'padding:7px 8px;border:1px solid var(--border);border-radius:6px;'
          + 'background:var(--surface2);color:var(--text);font-size:12px;';

  // ── Build HTML strings (avoid long literals by concatenation) ────────────
  function buildPageHtml() {
    var TH = 'padding:8px 12px;text-align:left;font-size:11px;color:var(--text-muted);'
           + 'font-weight:600;border-bottom:1px solid var(--border)';
    return '<div id="page-strategies" class="page active">'
      + '<h2>Strategies</h2>'
      + '<p class="page-sub">Manage strategy templates and all trader instances.</p>'

      // Templates card
      + '<div class="card">'
      +   '<div class="card-header">'
      +     '<div class="card-title">Strategy Templates</div>'
      +     '<div style="display:flex;gap:8px">'
      +       '<button class="btn btn-ghost btn-sm" id="btn-refresh-catalog">Refresh</button>'
      +       '<button class="btn btn-sm" id="btn-new-template" style="background:var(--accent);'
      +         'color:#fff;border:none;padding:5px 14px;border-radius:6px;cursor:pointer;'
      +         'font-size:12px;font-weight:600">+ New Template</button>'
      +     '</div>'
      +   '</div>'
      +   '<div class="table-wrap"><table>'
      +     '<thead><tr>'
      +       '<th>ID</th><th>Name</th><th>DLL</th><th>Description</th>'
      +       '<th>Ver</th><th>Leg Count</th><th>Status</th><th></th>'
      +     '</tr></thead>'
      +     '<tbody id="catalog-tbody">'
      +       '<tr class="empty-row"><td colspan="8">Login to load</td></tr>'
      +     '</tbody>'
      +   '</table></div>'
      + '</div>'

      // Instances card
      + '<div class="card" style="overflow:hidden">'
      +   '<div class="card-header">'
      +     '<div class="card-title">All Instances</div>'
      +     '<div style="display:flex;gap:8px">'
      +       '<button class="btn btn-ghost btn-sm" id="btn-refresh-instances">Refresh</button>'
      +       '<button class="btn btn-sm" id="btn-new-instance" style="background:var(--accent);'
      +         'color:#fff;border:none;padding:5px 14px;border-radius:6px;cursor:pointer;'
      +         'font-size:12px;font-weight:600">+ New Instance</button>'
      +       '<button class="btn btn-sm" id="btn-kill-all" style="background:var(--danger);'
      +         'color:#fff;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;'
      +         'font-size:12px;font-weight:600">&#9888; Kill All</button>'
      +     '</div>'
      +   '</div>'
      +   '<div style="display:flex;gap:0;min-height:240px">'

        // Instance list
        +   '<div style="flex:1;min-width:0;overflow:auto">'
        +     '<table style="width:100%;border-collapse:collapse;font-size:13px">'
        +       '<thead><tr style="background:var(--surface2)">'
        +         '<th style="' + TH + '">ID</th>'
        +         '<th style="' + TH + '">Name</th>'
        +         '<th style="' + TH + '">Template</th>'
        +         '<th style="' + TH + '">Trader</th>'
        +         '<th style="' + TH + '">Status</th>'
        +         '<th style="' + TH + '">Created</th>'
        +         '<th style="padding:8px 12px;border-bottom:1px solid var(--border)"></th>'
        +       '</tr></thead>'
        +       '<tbody id="instances-tbody">'
        +         '<tr><td colspan="7" style="padding:20px;text-align:center;'
        +           'color:var(--text-muted)">Login to load</td></tr>'
        +       '</tbody>'
        +     '</table>'
        +   '</div>'

        // Detail panel
        +   '<div id="instance-detail-panel" style="display:none;width:320px;flex-shrink:0;'
        +     'border-left:1px solid var(--border);padding:16px;overflow-y:auto;'
        +     'background:var(--surface2)">'
        +     '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
        +       '<span style="font-weight:600;font-size:14px" id="detail-inst-name">&#8212;</span>'
        +       '<button class="btn btn-ghost btn-sm" id="btn-close-detail"'
        +         ' style="padding:3px 8px;font-size:11px">&#x2715;</button>'
        +     '</div>'
        +     '<div style="display:flex;align-items:center;gap:6px;margin-bottom:16px;flex-wrap:wrap">'
        +       '<span id="detail-status-badge" style="font-size:11px;padding:2px 8px;'
        +         'border-radius:10px;font-weight:600"></span>'
        +       '<button class="btn btn-ghost btn-sm" id="btn-enable-instance"'
        +         ' style="font-size:11px;padding:3px 10px">Enable</button>'
        +       '<button class="btn btn-ghost btn-sm" id="btn-kill-instance"'
        +         ' style="font-size:11px;padding:3px 10px">Kill</button>'
        +       '<button class="btn btn-ghost btn-sm" id="btn-delete-instance"'
        +         ' style="font-size:11px;padding:3px 10px;color:var(--danger);'
        +         'border-color:var(--danger)">Delete</button>'
        +     '</div>'
        +     '<div style="font-size:10px;font-weight:600;color:var(--text-muted);'
        +       'text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Legs</div>'
        +     '<div id="detail-legs-list" style="margin-bottom:16px;font-size:12px;'
        +       'color:var(--text-muted)">&#8212;</div>'
        +     '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
        +       '<div style="font-size:10px;font-weight:600;color:var(--text-muted);'
        +         'text-transform:uppercase;letter-spacing:.8px">Parameters</div>'
        +       '<button class="btn btn-ghost btn-sm" id="btn-save-params"'
        +         ' style="font-size:11px;padding:3px 10px">Save</button>'
        +     '</div>'
        +     '<div id="detail-params-list" style="font-size:12px">&#8212;</div>'
        +   '</div>'
      +   '</div>'
      + '</div>'
      + '</div>';
  }

  function buildTmplModal() {
    var iS = 'width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);'
           + 'border-radius:6px;background:var(--surface2);color:var(--text);font-size:13px';
    function row(id, lbl, ph, xtra) {
      return '<div style="margin-bottom:12px">'
        + '<label style="display:block;font-size:12px;font-weight:600;'
        + 'color:var(--text-muted);margin-bottom:4px">' + lbl + '</label>'
        + '<input id="' + id + '" type="text" placeholder="' + ph + '"'
        + ' style="' + (xtra || iS) + '"></div>';
    }
    return '<div id="mod-strategy-template" style="display:none;position:fixed;inset:0;'
      + 'background:rgba(0,0,0,.55);z-index:2000;align-items:center;justify-content:center">'
      + '<div style="background:var(--surface);border:1px solid var(--border);'
      + 'border-radius:12px;padding:24px;width:460px;max-height:80vh;overflow-y:auto">'
      + '<h3 id="mod-tmpl-title" style="margin:0 0 20px;font-size:16px;font-weight:700">'
      + 'New Strategy Template</h3>'
      + row('tmpl-name',    'Name *',         'e.g. NSE Options Pair', '')
      + row('tmpl-dll',     'DLL / Plugin *', 'e.g. options_pair.dll', '')
      + row('tmpl-desc',    'Description',    'Brief description',     '')
      + row('tmpl-version', 'Version',        '1.0',
              'width:140px;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);'
              + 'border-radius:6px;background:var(--surface2);color:var(--text);font-size:13px')

    + row('tmpl-legcount', 'Leg Count',       '2',
          'width:80px;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);'
          + 'border-radius:6px;background:var(--surface2);color:var(--text);font-size:13px;'
          + 'margin-bottom:20px')

      + '<div id="tmpl-err" style="color:var(--danger);font-size:12px;margin-bottom:10px;'
      + 'display:none"></div>'
      + '<div style="display:flex;justify-content:flex-end;gap:8px">'
      + '<button class="btn btn-ghost" onclick="window._strat.closeTmplModal()">Cancel</button>'
      + '<button class="btn btn-primary" id="btn-save-template"'
      + ' onclick="window._strat.saveTemplate()">Create</button>'
      + '</div></div></div>';
  }

  function buildInstModal() {
    var gS = 'width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);'
           + 'border-radius:6px;background:var(--surface2);color:var(--text);font-size:13px';
    function gRow(id, lbl, tag) {
      return '<div><label style="display:block;font-size:12px;font-weight:600;'
        + 'color:var(--text-muted);margin-bottom:4px">' + lbl + '</label>' + tag + '</div>';
    }
    function inp(id, type, ph, val) {
      return '<input id="' + id + '" type="' + type + '" placeholder="' + ph + '"'
        + (val !== undefined ? ' value="' + val + '"' : '')
        + ' style="' + gS + '">';
    }
    function sel(id, opts) {
      return '<select id="' + id + '" style="' + gS + '">' + opts + '</select>';
    }
    return '<div id="mod-new-instance" style="display:none;position:fixed;inset:0;'
      + 'background:rgba(0,0,0,.55);z-index:2000;align-items:center;justify-content:center">'
      + '<div style="background:var(--surface);border:1px solid var(--border);'
      + 'border-radius:12px;padding:24px;width:560px;max-height:88vh;overflow-y:auto">'
      + '<h3 style="margin:0 0 20px;font-size:16px;font-weight:700">New Strategy Instance</h3>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'
      +   gRow('ni-strategy', 'Template *',
            sel('ni-strategy', '<option value="">-- Select --</option>'))
      +   gRow('ni-name',     'Instance Name *', inp('ni-name',   'text',   'e.g. NIFTY Pairs 1', undefined))
      +   gRow('ni-trader',   'Trader ID *',     inp('ni-trader', 'number', '1',                  undefined))
      +   gRow('ni-account',  'Account ID',      inp('ni-account','number', '0',                  '0'))
      + '</div>'
      // Legs
      + '<div style="font-size:11px;font-weight:700;color:var(--text-muted);'
      + 'text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Legs</div>'
      + '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">'
      +   '<input id="ni-leg-token"  type="number" placeholder="Token"  style="width:80px;'  + INP + '">'
      +   '<input id="ni-leg-label"  type="text"   placeholder="Symbol" style="flex:1;min-width:80px;' + INP + '">'
      +   '<select id="ni-leg-role" style="width:82px;' + INP + '">'
      +     '<option>LEG1</option><option>LEG2</option><option>LEG3</option>'
      +     '<option>LEG4</option><option>HEDGE</option>'
      +   '</select>'
      +   '<input id="ni-leg-weight" type="number" value="1" min="0.01" step="0.01" style="width:58px;' + INP + '">'
      +   '<button onclick="window._strat.addLeg()" style="padding:7px 12px;'
      +     'border:1px solid var(--border);border-radius:6px;background:var(--surface2);'
      +     'color:var(--text);font-size:12px;cursor:pointer">+ Add</button>'
      + '</div>'
      + '<div id="ni-legs-list" style="font-size:12px;min-height:36px;border:1px solid var(--border);'
      + 'border-radius:6px;padding:8px;margin-bottom:16px;color:var(--text-muted)">No legs added</div>'
      // Params
      + '<div style="font-size:11px;font-weight:700;color:var(--text-muted);'
      + 'text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Parameters</div>'
      + '<div style="display:flex;gap:6px;margin-bottom:8px">'
      +   '<input id="ni-param-key"   type="text" placeholder="Parameter name" style="flex:1;' + INP + '">'
      +   '<input id="ni-param-value" type="text" placeholder="Value"          style="flex:1;' + INP + '">'
      +   '<button onclick="window._strat.addParam()" style="padding:7px 12px;'
      +     'border:1px solid var(--border);border-radius:6px;background:var(--surface2);'
      +     'color:var(--text);font-size:12px;cursor:pointer">+ Add</button>'
      + '</div>'
      + '<div id="ni-params-list" style="font-size:12px;min-height:36px;'
      + 'border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:16px;'
      + 'color:var(--text-muted)">No parameters added</div>'
      + '<div id="ni-err" style="color:var(--danger);font-size:12px;margin-bottom:10px;'
      + 'display:none"></div>'
      + '<div style="display:flex;justify-content:flex-end;gap:8px">'
      + '<button class="btn btn-ghost" onclick="window._strat.closeInstModal()">Cancel</button>'
      + '<button class="btn btn-primary"'
      + ' onclick="window._strat.createInstance()">Create Instance</button>'
      + '</div></div></div>';
  }

  // ── Inject modals into body once ──────────────────────────────────────────
  function injectModals() {
    if (!ge('mod-strategy-template')) {
      var d1 = document.createElement('div');
      d1.innerHTML = buildTmplModal();
      document.body.appendChild(d1.firstElementChild);
    }
    if (!ge('mod-new-instance')) {
      var d2 = document.createElement('div');
      d2.innerHTML = buildInstModal();
      document.body.appendChild(d2.firstElementChild);
    }
  }

  // ── Catalog ───────────────────────────────────────────────────────────────
  async function loadCatalog() {
    var tbody = ge('catalog-tbody');
    if (!tbody) { return; }
    tbody.innerHTML = '<tr><td colspan="7" style="padding:16px;text-align:center;'
      + 'color:var(--text-muted)">Loading...</td></tr>';
    try {
      var raw = await sendCommand(SC.GET_ALL_STRATEGIES, {});
      ss.catalog  = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw));
      ss.stratMap = {};
      ss.catalog.forEach(function(s) { ss.stratMap[s.strategyId] = s.name; });
      renderCatalog();
    } catch(e) {
      var tb2 = ge('catalog-tbody');
      if (tb2) { tb2.innerHTML = '<tr><td colspan="7" style="padding:12px;color:var(--danger)">Error: ' + esc(e.message) + '</td></tr>'; }
    }
  }

  function renderCatalog() {
    var tbody = ge('catalog-tbody');
    if (!tbody) { return; }
    if (!ss.catalog.length) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No templates. Click "+ New Template".</td></tr>';
      return;
    }
    tbody.innerHTML = ss.catalog.map(function(s) {
      var on = s.enabled
        ? '<span style="color:#3fb950;font-size:11px;font-weight:600">ENABLED</span>'
        : '<span style="color:#f85149;font-size:11px;font-weight:600">DISABLED</span>';
      return '<tr>'
        + '<td style="padding:7px 12px;color:var(--text-muted)">' + s.strategyId + '</td>'
        + '<td style="padding:7px 12px;font-weight:600">' + esc(s.name) + '</td>'
        + '<td style="padding:7px 12px;font-size:11px;color:var(--text-muted)">' + esc(s.dllName || '') + '</td>'
        + '<td style="padding:7px 12px;font-size:11px">' + esc(s.description || '') + '</td>'
        + '<td style="padding:7px 12px;font-size:11px">' + esc(s.version || '') + '</td>'
        + '<td style="padding:7px 12px;text-align:center">' + (s.legCount || 2) + '</td>'
        + '<td style="padding:7px 12px">' + on + '</td>'
        + '<td style="padding:7px 12px">'
        + '<button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px"'
        + ' onclick="window._strat.editTemplate(' + s.strategyId + ')">Edit</button>'
        + '</td></tr>';
    }).join('');
  }

  // ── Instances ─────────────────────────────────────────────────────────────
  async function loadInstances() {
    var tbody = ge('instances-tbody');
    if (!tbody) { return; }
    tbody.innerHTML = '<tr><td colspan="7" style="padding:16px;text-align:center;'
      + 'color:var(--text-muted)">Loading...</td></tr>';
    try {
      var raw = await sendCommand(SC.GET_ALL_INSTANCES, {});
      ss.instances = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw));
      renderInstances();
    } catch(e) {
      var tb2 = ge('instances-tbody');
      if (tb2) { tb2.innerHTML = '<tr><td colspan="7" style="padding:12px;color:var(--danger)">Error: ' + esc(e.message) + '</td></tr>'; }
    }
  }

  function renderInstances() {
    var tbody = ge('instances-tbody');
    if (!tbody) { return; }
    if (!ss.instances.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="padding:20px;text-align:center;'
        + 'color:var(--text-muted)">No instances found</td></tr>';
      return;
    }
    tbody.innerHTML = ss.instances.map(function(inst) {
      var badge = '<span style="font-size:11px;padding:2px 7px;border-radius:8px;font-weight:600;'
        + statusStyle(inst.status) + '">' + esc(inst.status) + '</span>';
      var sel = inst.instanceId === ss.selectedId;
      var bg  = sel ? 'background:rgba(0,200,255,.06);border-left:2px solid var(--accent)'
                    : 'border-left:2px solid transparent';
      return '<tr data-id="' + inst.instanceId + '" style="cursor:pointer;' + bg + '"'
        + ' onclick="window._strat.selectInstance(' + inst.instanceId + ')">'
        + '<td style="padding:7px 12px;color:var(--text-muted);font-size:12px">' + inst.instanceId + '</td>'
        + '<td style="padding:7px 12px;font-weight:600">' + esc(inst.name) + '</td>'
        + '<td style="padding:7px 12px;font-size:12px;color:var(--text-muted)">' + esc(stratName(inst.strategyId)) + '</td>'
        + '<td style="padding:7px 12px;font-size:12px">' + inst.traderId + '</td>'
        + '<td style="padding:7px 12px">' + badge + '</td>'
        + '<td style="padding:7px 12px;font-size:11px;color:var(--text-muted)">' + esc((inst.createdOn || '').slice(0, 10)) + '</td>'
        + '<td style="padding:7px 12px">'
        + '<button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px"'
        + ' onclick="event.stopPropagation();window._strat.deleteInstance(' + inst.instanceId + ')">Del</button>'
        + '</td></tr>';
    }).join('');
  }

  // ── Detail panel ──────────────────────────────────────────────────────────
  async function selectInstance(instanceId) {
    ss.selectedId   = instanceId;
    ss.editedParams = {};
    var inst = null;
    for (var i = 0; i < ss.instances.length; i++) {
      if (ss.instances[i].instanceId === instanceId) { inst = ss.instances[i]; break; }
    }
    if (!inst) { return; }

    document.querySelectorAll('#instances-tbody tr').forEach(function(r) {
      var isSel = parseInt(r.dataset.id, 10) === instanceId;
      r.style.background = isSel ? 'rgba(0,200,255,.06)' : '';
      r.style.borderLeft = isSel ? '2px solid var(--accent)' : '2px solid transparent';
    });

    var panel = ge('instance-detail-panel');
    if (panel) { panel.style.display = ''; }

    var nameEl = ge('detail-inst-name');
    if (nameEl) { nameEl.textContent = inst.name; }

    var badge = ge('detail-status-badge');
    if (badge) {
      badge.textContent = inst.status;
      badge.style.cssText = 'font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;' + statusStyle(inst.status);
    }

    await Promise.all([loadLegsDetail(instanceId), loadParamsDetail(instanceId)]);
  }

  async function loadLegsDetail(instanceId) {
    var c = ge('detail-legs-list');
    if (!c) { return; }
    c.textContent = 'Loading...';
    try {
      var raw  = await sendCommand(SC.GET_INSTRUMENTS, { instanceId: instanceId });
      var legs = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw));
      if (!legs.length) { c.textContent = 'No legs assigned'; return; }
      c.innerHTML = legs.map(function(l) {
        return '<div style="display:flex;justify-content:space-between;padding:4px 0;'
          + 'border-bottom:1px solid var(--border)">'
          + '<span style="font-weight:600">' + esc(l.role) + '</span>'
          + '<span style="color:var(--text-muted)">Token:' + l.token + ' W:' + l.weight + '</span>'
          + '</div>';
      }).join('');
    } catch(e) {
      var c2 = ge('detail-legs-list');
      if (c2) { c2.textContent = 'Error: ' + e.message; }
    }
  }

  async function loadParamsDetail(instanceId) {
    var c = ge('detail-params-list');
    if (!c) { return; }
    c.textContent = 'Loading...';
    try {
      var raw    = await sendCommand(SC.GET_PARAMETERS, { instanceId: instanceId });
      var params = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw));
      ss.editedParams = {};
      if (!params.length) {
        c.innerHTML = '<span style="color:var(--text-muted)">No parameters</span>'; return;
      }
      c.innerHTML = params.map(function(p) {
        return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">'
          + '<span style="flex:1;color:var(--text-muted);font-size:11px">' + esc(p.parameter) + '</span>'
          + '<input type="text" value="' + esc(p.value) + '" data-key="' + esc(p.parameter) + '"'
          + ' onchange="window._strat.paramEdited(this.dataset.key,this.value)"'
          + ' style="width:100px;padding:3px 6px;border:1px solid var(--border);border-radius:4px;'
          + 'background:var(--surface);color:var(--text);font-size:12px">'
          + '</div>';
      }).join('');
    } catch(e) {
      var c2 = ge('detail-params-list');
      if (c2) { c2.textContent = 'Error: ' + e.message; }
    }
  }

  async function saveParams() {
    if (!ss.selectedId) { return; }
    var keys = Object.keys(ss.editedParams);
    if (!keys.length) { return; }
    try {
      for (var i = 0; i < keys.length; i++) {
        await sendCommand(SC.SET_PARAMETER, {
          instanceId: ss.selectedId, parameter: keys[i], value: ss.editedParams[keys[i]]
        });
      }
      ss.editedParams = {};
    } catch(e) { /* ignore */ }
  }

  async function enableInstance(instanceId, enable) {
    try {
      await sendCommand(SC.ENABLE_INSTANCE, { instanceId: instanceId, enable: enable ? '1' : '0' });
      loadInstances();
    } catch(e) { /* ignore */ }
  }

  async function killInstance(instanceId) {
    if (!instanceId || !confirm('Mark instance ' + instanceId + ' as REMOVED?')) { return; }
    enableInstance(instanceId, false);
  }

  async function deleteInstance(instanceId) {
    if (!instanceId || !confirm('Delete instance ' + instanceId + '? Cannot be undone.')) { return; }
    try {
      await sendCommand(SC.DELETE_INSTANCE, { instanceId: instanceId });
      ss.selectedId = 0;
      var panel = ge('instance-detail-panel');
      if (panel) { panel.style.display = 'none'; }
      loadInstances();
    } catch(e) { /* ignore */ }
  }

  async function killAll() {
    if (!confirm('Kill ALL active strategy instances? Cannot be undone.')) { return; }
    try { await sendCommand(SC.KILL_ALL, {}); loadInstances(); } catch(e) { /* ignore */ }
  }

  // ── Template modal ────────────────────────────────────────────────────────
  function editTemplate(strategyId) {
    var s = null;
    for (var i = 0; i < ss.catalog.length; i++) {
      if (ss.catalog[i].strategyId === strategyId) { s = ss.catalog[i]; break; }
    }
    ss.editingStrat = s;
    openTmplModal(s);
  }

  function openTmplModal(s) {
    var m = ge('mod-strategy-template');
    if (!m) { return; }
    var t = ge('mod-tmpl-title'); if (t) { t.textContent = s ? 'Edit Strategy Template' : 'New Strategy Template'; }
    var n = ge('tmpl-name');    if (n) { n.value = s ? (s.name        || '') : ''; }
    var d = ge('tmpl-dll');     if (d) { d.value = s ? (s.dllName     || '') : ''; }
    var x = ge('tmpl-desc');    if (x) { x.value = s ? (s.description || '') : ''; }
    var v = ge('tmpl-version'); if (v) { v.value = s ? (s.version || '1.0') : '1.0'; }
    var lc = ge('tmpl-legcount');if (lc) { lc.value = s ? (s.legCount || 2) : 2; }
    var b = ge('btn-save-template'); if (b) { b.textContent = s ? 'Save Changes' : 'Create'; }
    var e = ge('tmpl-err'); if (e) { e.style.display = 'none'; e.textContent = ''; }
    m.style.display = 'flex';
  }

  function closeTmplModal() {
    var m = ge('mod-strategy-template');
    if (m) { m.style.display = 'none'; }
    ss.editingStrat = null;
  }

  async function saveTemplate() {
    var name    = (ge('tmpl-name').value    || '').trim();
    var dll     = (ge('tmpl-dll').value     || '').trim();
    var desc    = (ge('tmpl-desc').value    || '').trim();
    var version = (ge('tmpl-version').value || '1.0').trim();
    var legCount = parseInt(ge('tmpl-legcount').value || '2', 10);
    if (legCount < 1 || legCount > 8)
    {
        errEl.textContent = 'Leg Count must be between 1 and 8';
        errEl.style.display = 'block';
        return;
    }
    var errEl   = ge('tmpl-err');
    if (!name) { errEl.textContent = 'Name is required';    errEl.style.display = 'block'; return; }
    if (!dll)  { errEl.textContent = 'DLL name is required'; errEl.style.display = 'block'; return; }
    errEl.style.display = 'none';
    try {
      if (ss.editingStrat) {
        await sendCommand(SC.UPDATE_STRATEGY, {
          strategyId: ss.editingStrat.strategyId, name: name, dllName: dll,
          description: desc, version: version, legCount: legCount, enabled: ss.editingStrat.enabled
        });
      } else {
        await sendCommand(SC.CREATE_STRATEGY, { name: name, dllName: dll, description: desc, version: version, legCount: legCount });
      }
      closeTmplModal();
      loadCatalog();
    } catch(e) {
      errEl.textContent = 'Failed: ' + e.message; errEl.style.display = 'block';
    }
  }

  // ── New Instance modal ────────────────────────────────────────────────────
  function openInstModal() {
    ss.newLegs   = [];
    ss.newParams = [];
    renderNiLegs();
    renderNiParams();
    var sel = ge('ni-strategy');
    if (sel) {
      sel.innerHTML = '<option value="">-- Select --</option>'
        + ss.catalog.map(function(s) {
          return '<option value="' + s.strategyId + '">' + esc(s.name) + '</option>';
        }).join('');
    }
    var n = ge('ni-name');    if (n) { n.value = ''; }
    var t = ge('ni-trader');  if (t) { t.value = ''; }
    var a = ge('ni-account'); if (a) { a.value = '0'; }
    var e = ge('ni-err');     if (e) { e.style.display = 'none'; }
    var m = ge('mod-new-instance');
    if (m) { m.style.display = 'flex'; }
  }

  function closeInstModal() {
    var m = ge('mod-new-instance');
    if (m) { m.style.display = 'none'; }
  }

  function addLeg() {
    var token  = parseInt((ge('ni-leg-token').value  || ''), 10);
    var label  = (ge('ni-leg-label').value  || '').trim();
    var role   = ge('ni-leg-role').value;
    var weight = parseFloat(ge('ni-leg-weight').value || '1') || 1;
    if (!token || isNaN(token)) { alert('Enter a valid token number'); return; }
    for (var i = 0; i < ss.newLegs.length; i++) {
      if (ss.newLegs[i].role === role) { alert('Role ' + role + ' already added'); return; }
    }
    ss.newLegs.push({ token: token, label: label, role: role, weight: weight });
    ge('ni-leg-token').value = '';
    ge('ni-leg-label').value = '';
    renderNiLegs();
  }

  function removeLeg(idx) { ss.newLegs.splice(idx, 1); renderNiLegs(); }

  function renderNiLegs() {
    var c = ge('ni-legs-list');
    if (!c) { return; }
    if (!ss.newLegs.length) { c.textContent = 'No legs added'; return; }
    c.innerHTML = ss.newLegs.map(function(l, i) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;'
        + 'padding:3px 0;border-bottom:1px solid var(--border)">'
        + '<span><b>' + esc(l.role) + '</b>' + (l.label ? ' &mdash; ' + esc(l.label) : '') + '</span>'
        + '<span style="color:var(--text-muted)">Token:' + l.token + ' W:' + l.weight + '</span>'
        + '<button onclick="window._strat.removeLeg(' + i + ')"'
        + ' style="padding:2px 7px;border:1px solid var(--border);border-radius:4px;'
        + 'cursor:pointer;font-size:11px;background:none;color:var(--danger)">&#x2715;</button>'
        + '</div>';
    }).join('');
  }

  function addParam() {
    var key   = (ge('ni-param-key').value   || '').trim();
    var value = (ge('ni-param-value').value || '').trim();
    if (!key) { alert('Enter a parameter name'); return; }
    for (var i = 0; i < ss.newParams.length; i++) {
      if (ss.newParams[i].key === key) { alert('Parameter "' + key + '" already added'); return; }
    }
    ss.newParams.push({ key: key, value: value });
    ge('ni-param-key').value   = '';
    ge('ni-param-value').value = '';
    renderNiParams();
  }

  function removeParam(idx) { ss.newParams.splice(idx, 1); renderNiParams(); }

  function renderNiParams() {
    var c = ge('ni-params-list');
    if (!c) { return; }
    if (!ss.newParams.length) { c.textContent = 'No parameters added'; return; }
    c.innerHTML = ss.newParams.map(function(p, i) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;'
        + 'padding:3px 0;border-bottom:1px solid var(--border)">'
        + '<span style="flex:1">' + esc(p.key) + '</span>'
        + '<span style="color:var(--text-muted);flex:1">' + esc(p.value) + '</span>'
        + '<button onclick="window._strat.removeParam(' + i + ')"'
        + ' style="padding:2px 7px;border:1px solid var(--border);border-radius:4px;'
        + 'cursor:pointer;font-size:11px;background:none;color:var(--danger)">&#x2715;</button>'
        + '</div>';
    }).join('');
  }

  async function createInstance() {
    var strategyId = parseInt(ge('ni-strategy').value || '0', 10);
    var name       = (ge('ni-name').value   || '').trim();
    var traderId   = parseInt(ge('ni-trader').value  || '0', 10);
    var accountId  = parseInt(ge('ni-account').value || '0', 10);
    var errEl      = ge('ni-err');
    errEl.style.display = 'none';
    if (!strategyId) { errEl.textContent = 'Select a strategy template'; errEl.style.display = 'block'; return; }
    if (!name)       { errEl.textContent = 'Enter an instance name';      errEl.style.display = 'block'; return; }
    if (!traderId)   { errEl.textContent = 'Enter a Trader ID';           errEl.style.display = 'block'; return; }
    var legs   = ss.newLegs.slice();
    var params = ss.newParams.slice();
    try {
      var raw = await sendCommand(SC.CREATE_INSTANCE, {
        strategyId: strategyId, traderId: traderId, accountId: accountId, name: name
      });
      var instanceId = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw)).instanceId;
      if (!instanceId) { throw new Error('No instanceId returned'); }
      for (var i = 0; i < legs.length; i++) {
        await sendCommand(SC.ADD_INSTRUMENT, {
          instanceId: instanceId, token: legs[i].token, role: legs[i].role, weight: legs[i].weight
        });
      }
      for (var j = 0; j < params.length; j++) {
        await sendCommand(SC.SET_PARAMETER, {
          instanceId: instanceId, parameter: params[j].key, value: params[j].value
        });
      }
      closeInstModal();
      loadInstances();
    } catch(e) {
      errEl.textContent = 'Failed: ' + e.message; errEl.style.display = 'block';
    }
  }

  // ── Global bridge (onclick handlers in dynamic HTML reference these) ──────
  window._strat = {
    selectInstance : selectInstance,
    editTemplate   : editTemplate,
    closeTmplModal : closeTmplModal,
    saveTemplate   : saveTemplate,
    closeInstModal : closeInstModal,
    addLeg         : addLeg,
    removeLeg      : removeLeg,
    addParam       : addParam,
    removeParam    : removeParam,
    createInstance : createInstance,
    deleteInstance : deleteInstance,
    paramEdited    : function(key, value) { ss.editedParams[key] = value; }
  };

  // ── Page init (called by showPage()) ─────────────────────────────────────
  window.FP['strategies'].init = function () {
    injectModals();
    loadCatalog();
    loadInstances();

    var r  = ge('btn-refresh-catalog');   if (r)  { r.onclick  = loadCatalog; }
    var nt = ge('btn-new-template');      if (nt) { nt.onclick = function() { ss.editingStrat = null; openTmplModal(null); }; }
    var ri = ge('btn-refresh-instances'); if (ri) { ri.onclick = loadInstances; }
    var ni = ge('btn-new-instance');      if (ni) { ni.onclick = openInstModal; }
    var ka = ge('btn-kill-all');          if (ka) { ka.onclick = killAll; }

    var cd = ge('btn-close-detail');
    if (cd) {
      cd.onclick = function() {
        var panel = ge('instance-detail-panel');
        if (panel) { panel.style.display = 'none'; }
        ss.selectedId = 0;
        document.querySelectorAll('#instances-tbody tr').forEach(function(r2) {
          r2.style.background = ''; r2.style.borderLeft = '2px solid transparent';
        });
      };
    }

    var ki = ge('btn-kill-instance');    if (ki) { ki.onclick = function() { killInstance(ss.selectedId); }; }
    var en = ge('btn-enable-instance');  if (en) { en.onclick = function() { enableInstance(ss.selectedId, true); }; }
    var di = ge('btn-delete-instance');  if (di) { di.onclick = function() { deleteInstance(ss.selectedId); }; }
    var sp = ge('btn-save-params');      if (sp) { sp.onclick = saveParams; }
  };

  // ── Register page html ────────────────────────────────────────────────────
  window.FP['strategies'].html = buildPageHtml();

})();
