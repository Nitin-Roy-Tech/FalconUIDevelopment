// Falcon Admin — instruments page
(function () {
  'use strict';
  window.FP = window.FP || {};
  window.FP['instruments'] = {
    html: `
    <div id="page-instruments" class="page active">
      <h2>Securities / Instruments</h2>
      <p class="page-sub">Load contract master files into the database. Each file corresponds to one exchange segment.</p>
      <div class="stat-row">
        <div class="stat">
          <div class="stat-label">Total Instruments</div>
          <div class="stat-value" id="inst-count">—</div>
        </div>
      </div>
      <!-- Unified Instrument Loader -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Load Exchange Contract Files</div>
          <button class="btn btn-danger btn-sm" id="btn-delete" disabled>Delete Segment</button>
        </div>
        <div class="form-row" style="margin-bottom:16px;">
          <div class="form-group">
            <label>Exchange</label>
            <select id="sel-exchange" onchange="onExchangeChange()">
              <option value="1">NSE</option>
              <option value="2">BSE</option>
              <option value="3">MCX</option>
            </select>
          </div>
          <div class="form-group">
            <label>Segment</label>
            <select id="sel-segment">
              <option value="1">CM &mdash; Cash / Equity</option>
              <option value="2" selected>FO &mdash; Futures &amp; Options</option>
              <option value="3">CD &mdash; Currency Derivatives</option>
              <option value="4">COM &mdash; Commodity</option>
            </select>
          </div>
        </div>

        <!-- NSE MTBT pickers (visible when exchange = NSE) -->
        <div id="nse-section">
          <div class="form-row" style="align-items:flex-start;margin-bottom:16px;">
            <div class="form-group" style="flex:1;">
              <label>contract.txt <span style="color:var(--danger)">*</span></label>
              <div id="nse-drop-contract" class="nse-drop-zone">
                <span style="font-size:20px;">&#128196;</span>
                <span id="nse-contract-name" style="color:var(--text-muted);font-size:12px;">Drop file or click to browse</span>
              </div>
              <input type="file" id="nse-file-contract" accept=".txt" style="display:none">
            </div>
            <div class="form-group" style="flex:1;">
              <label>fo_contract_stream_info.csv <span style="color:var(--accent);font-size:11px;">(needed for StreamID)</span></label>
              <div id="nse-drop-stream" class="nse-drop-zone">
                <span style="font-size:20px;">&#128196;</span>
                <span id="nse-stream-name" style="color:var(--text-muted);font-size:12px;">Drop file or click to browse</span>
              </div>
              <input type="file" id="nse-file-stream" accept=".csv" style="display:none">
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;">
            <button class="btn btn-primary" id="btn-nse-load" disabled>Parse &amp; Load NSE Files</button>
            <button class="btn btn-ghost" id="btn-nse-clear" style="display:none">Clear</button>
            <span id="nse-record-count" style="color:var(--text-muted);font-size:12px;margin-left:4px;"></span>
          </div>
          <div id="nse-progress-wrap" style="display:none;margin-bottom:6px;">
            <div style="background:var(--surface2);border-radius:4px;height:6px;overflow:hidden;">
              <div id="nse-progress-bar" style="height:100%;background:var(--accent);width:0%;transition:width 0.3s;"></div>
            </div>
            <div id="nse-progress-label" style="color:var(--text-muted);font-size:11px;margin-top:4px;"></div>
          </div>
          <div id="nse-status"></div>
        </div>

        <!-- Generic CSV section (visible when exchange = BSE / MCX / other) -->
        <div id="generic-section" style="display:none;">
          <p style="color:var(--text-muted);font-size:13px;margin-bottom:12px;">
            A native parser for this exchange is not yet available. Upload a pre-formatted CSV instead.
          </p>
          <div id="drop-zone">
            <div class="dz-icon">&#128196;</div>
            <div class="dz-text">Drop CSV file here or <span onclick="document.getElementById('file-input').click()">browse</span></div>
            <div id="file-name"></div>
          </div>
          <input type="file" id="file-input" accept=".csv,.txt">
          <details style="margin-bottom:16px;color:var(--text-muted);font-size:12px;">
            <summary style="cursor:pointer;user-select:none;">Expected CSV format</summary>
            <div style="margin-top:8px;background:var(--surface2);border-radius:6px;padding:10px;font-family:monospace;font-size:11px;overflow-x:auto;white-space:pre;">token,symbol,series,instrumentType,expiry,strike,optionType,lotSize,tickSize,underlyingToken,pricePrecision,qtyPrecision,freezeQty,streamId
35001,NIFTY,EQ,EQ,,0.0,,1,0.05,0,2,1,500,0
35002,BANKNIFTY,EQ,EQ,,0.0,,1,0.05,0,2,1,100,0</div>
          </details>
          <div style="display:flex;gap:10px;align-items:center;">
            <button class="btn btn-primary" id="btn-load" disabled>Load Instruments</button>
            <button class="btn btn-ghost" id="btn-clear-file" style="display:none">Clear file</button>
          </div>
          <div id="load-status"></div>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px 10px;border-bottom:1px solid var(--border);">
          <div class="card-title" style="margin:0;">Browse Instruments</div>
          <input type="text" id="sym-filter" placeholder="Search symbols..." style="height:30px;padding:0 10px;font-size:13px;width:200px;border-radius:6px;border:1px solid var(--border);background:var(--surface2);color:var(--text);">
        </div>
        <div style="display:grid;grid-template-columns:200px 220px 160px 1fr;height:520px;">

          <!-- Panel 1: Streams -->
          <div style="border-right:1px solid var(--border);display:flex;flex-direction:column;min-height:0;">
            <div style="padding:8px 12px;font-size:11px;font-weight:600;color:var(--text-muted);letter-spacing:.06em;border-bottom:1px solid var(--border);flex-shrink:0;">STREAMS</div>
            <div id="stream-list" style="flex:1;min-height:0;overflow-y:auto;padding:4px 0;">
              <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;"><span class="spinner"></span></div>
            </div>
          </div>

          <!-- Panel 2: Symbols -->
          <div style="border-right:1px solid var(--border);display:flex;flex-direction:column;min-height:0;">
            <div style="padding:8px 12px;font-size:11px;font-weight:600;color:var(--text-muted);letter-spacing:.06em;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;flex-shrink:0;">
              <span>SYMBOLS</span><span id="sym-count" style="color:var(--accent);">—</span>
            </div>
            <div id="sym-list" style="flex:1;min-height:0;overflow-y:auto;padding:4px 0;">
              <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Select a stream</div>
            </div>
          </div>

          <!-- Panel 3: Expiries -->
          <div style="border-right:1px solid var(--border);display:flex;flex-direction:column;min-height:0;">
            <div style="padding:8px 12px;font-size:11px;font-weight:600;color:var(--text-muted);letter-spacing:.06em;border-bottom:1px solid var(--border);flex-shrink:0;">EXPIRIES</div>
            <div id="exp-list" style="flex:1;min-height:0;overflow-y:auto;padding:4px 0;">
              <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Select a symbol</div>
            </div>
          </div>

          <!-- Panel 4: Option Chain -->
          <div style="display:flex;flex-direction:column;min-height:0;">
            <div style="padding:8px 12px;font-size:11px;font-weight:600;color:var(--text-muted);letter-spacing:.06em;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
              <span id="chain-title">OPTION CHAIN</span>
              <span id="chain-fut" style="font-size:12px;color:var(--accent);font-weight:400;"></span>
            </div>
            <div style="flex:1;min-height:0;overflow:auto;">
              <table id="chain-table" style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead id="chain-head" style="position:sticky;top:0;background:var(--surface2);z-index:1;">
                  <tr>
                    <th colspan="4" style="padding:20px;text-align:center;color:var(--text-muted);font-weight:400;">Select a symbol and expiry</th>
                  </tr>
                </thead>
                <tbody id="chain-tbody"></tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
`,
    init: function () {
    onExchangeChange();
    $('sel-exchange').onchange = onExchangeChange;

    // ── CSV drop zone (generic section) ─────────────────────────────────────
    var dropZone  = $('drop-zone');
    var fileInput = $('file-input');
    function loadFile(file) {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        state.csvText = e.target.result;
        $('file-name').textContent = file.name + ' (' + file.size.toLocaleString() + ' bytes)';
        dropZone.classList.add('has-file');
        $('btn-load').disabled = !state.loggedIn;
        $('btn-clear-file').style.display = '';
        hideStatus();
      };
      reader.readAsText(file);
    }
    dropZone.ondragover  = function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); };
    dropZone.ondragleave = function()  { dropZone.classList.remove('drag-over'); };
    dropZone.ondrop      = function(e) { e.preventDefault(); dropZone.classList.remove('drag-over'); loadFile(e.dataTransfer.files[0]); };
    dropZone.onclick     = function(e) { if (e.target.tagName !== 'SPAN') fileInput.click(); };
    fileInput.onchange   = function()  { loadFile(fileInput.files[0]); };

    $('btn-clear-file').onclick = function() {
      state.csvText = null;
      $('file-name').textContent = ''; dropZone.classList.remove('has-file');
      $('btn-load').disabled = true; $('btn-clear-file').style.display = 'none';
      fileInput.value = ''; hideStatus();
    };
    $('btn-load').onclick = async function() {
      if (!state.csvText) return;
      $('btn-load').disabled = true;
      showStatus('<span class="spinner"></span>Uploading and parsing CSV...', 'info');
      try {
        var data = await sendCommand(CMD.LOAD_INSTRUMENTS, {
          exchangeId: parseInt($('sel-exchange').value),
          segmentId:  parseInt($('sel-segment').value),
          csv: state.csvText,
        });
        var result = typeof data === 'string' ? JSON.parse(data) : data;
        showStatus('&#10003; Loaded <strong>' + result.loaded + '</strong> of <strong>' +
          result.submitted + '</strong> instruments successfully.', 'success');
        await refreshCount();
        loadStreamStats();
      } catch(e) {
        showStatus('&#10007; Error: ' + e.message, 'error');
      } finally { $('btn-load').disabled = false; }
    };
    $('btn-delete').onclick = async function() {
      var selExch = $('sel-exchange'), selSeg = $('sel-segment');
      var segLabel = selExch.options[selExch.selectedIndex].text + ' / ' +
                     selSeg.options[selSeg.selectedIndex].text;
      if (!confirm('Delete ALL instruments for ' + segLabel + '?\nThis cannot be undone.')) return;
      $('btn-delete').disabled = true;
      showStatus('<span class="spinner"></span>Deleting...', 'info');
      try {
        await sendCommand(CMD.DELETE_INSTRUMENTS, { exchangeId: parseInt($('sel-exchange').value) });
        showStatus('&#10003; Instruments deleted.', 'success');
        await refreshCount();
        loadStreamStats();
      } catch(e) {
        showStatus('&#10007; Error: ' + e.message, 'error');
      } finally { $('btn-delete').disabled = false; }
    };
    $('sym-filter').oninput = function() { renderSymbolList(browseState.symbols); };

    // ── NSE file pickers ─────────────────────────────────────────────────────
    nseSetupDrop('nse-drop-contract', 'nse-file-contract', 'contractText', 'nse-contract-name');
    nseSetupDrop('nse-drop-stream',   'nse-file-stream',   'streamText',   'nse-stream-name');
    $('btn-nse-clear').onclick = function () {
      nseState.contractText = null; nseState.streamText = null;
      ['nse-drop-contract','nse-drop-stream'].forEach(function(id){ $(id).classList.remove('has-file'); });
      $('nse-contract-name').textContent = 'Drop file or click to browse';
      $('nse-contract-name').style.color = '';
      $('nse-stream-name').textContent   = 'Drop file or click to browse';
      $('nse-stream-name').style.color   = '';
      $('nse-file-contract').value = ''; $('nse-file-stream').value = '';
      $('btn-nse-load').disabled = true; $('btn-nse-clear').style.display = 'none';
      $('nse-status').style.display = 'none'; $('nse-record-count').textContent = '';
      $('nse-progress-wrap').style.display = 'none';
    };
    $('btn-nse-load').onclick = async function () {
      if (!nseState.contractText) { return; }
      $('btn-nse-load').disabled = true;
      $('nse-progress-wrap').style.display = '';
      $('nse-progress-bar').style.width = '0%';
      $('nse-progress-label').textContent = 'Parsing contract.txt...';
      showNseStatus('<span class="spinner"></span> Parsing NSE contract files...', 'info');
      try {
        var parsed = parseNseContractTxt(nseState.contractText);
        var records = parsed.records, skipped = parsed.skipped;
        $('nse-record-count').textContent = records.length.toLocaleString() + ' records parsed';
        $('nse-progress-bar').style.width = '10%';
        if (records.length === 0) { showNseStatus('Error: No valid records found.', 'error'); return; }
        var streamsMapped = 0;
        if (nseState.streamText) {
          $('nse-progress-label').textContent = 'Joining stream info...';
          var streamMap = parseNseStreamCsv(nseState.streamText);
          for (var ri = 0; ri < records.length; ri++) {
            if (streamMap[records[ri].token] !== undefined) {
              records[ri].streamId = streamMap[records[ri].token]; streamsMapped++;
            }
          }
          $('nse-progress-label').textContent = 'StreamID mapped for ' + streamsMapped.toLocaleString() + ' tokens.';
        }
        $('nse-progress-bar').style.width = '20%';
        var kBatch = 5000;
        var exchId = parseInt($('sel-exchange').value);
        var segId  = parseInt($('sel-segment').value);
        var numBatches = Math.ceil(records.length / kBatch);
        var totalLoaded = 0, totalSubmitted = 0;
        for (var b = 0; b < numBatches; b++) {
          var batch = records.slice(b * kBatch, (b + 1) * kBatch);
          var csv   = nseRecordsToCsv(batch);
          var pct   = 20 + Math.round(78 * (b + 1) / numBatches);
          $('nse-progress-label').textContent = 'Uploading batch ' + (b+1) + ' / ' + numBatches + '...';
          showNseStatus('<span class="spinner"></span> Uploading batch ' + (b+1) + ' of ' + numBatches + '...', 'info');
          var data   = await sendCommand(CMD.LOAD_INSTRUMENTS, { exchangeId: exchId, segmentId: segId, csv: csv });
          var result = typeof data === 'string' ? JSON.parse(data) : data;
          totalLoaded    += result.loaded; totalSubmitted += result.submitted;
          $('nse-progress-bar').style.width = pct + '%';
        }
        $('nse-progress-bar').style.width = '100%';
        $('nse-progress-label').textContent = 'Done.';
        showNseStatus('Loaded <strong>' + totalLoaded + '</strong> of <strong>' + totalSubmitted +
          '</strong> instruments' + (nseState.streamText ? ' with StreamID' : ' (StreamID=0)') +
          (skipped ? '; ' + skipped + ' rows skipped' : '') + '.', 'success');
        await refreshCount();
        loadStreamStats();
      } catch(e) {
        $('nse-progress-bar').style.width = '0%';
        showNseStatus('Error: ' + e.message, 'error');
      } finally { $('btn-nse-load').disabled = !state.loggedIn; }
    };
  }
  };
})();

// ── After login ──────────────────────────────────────────────────────────────
function onExchangeChange()
{
    const isNse = $('sel-exchange').value === '1';
    $('nse-section').style.display     = isNse ? '' : 'none';
    $('generic-section').style.display = isNse ? 'none' : '';
    // Re-evaluate load button states on exchange switch
    $('btn-nse-load').disabled = !state.loggedIn || !nseState.contractText;
    $('btn-load').disabled     = !state.loggedIn || !state.csvText;
}

// ── Instruments ───────────────────────────────────────────────────────────────
async function refreshCount() {
  try {
    const data   = await sendCommand(CMD.GET_INSTRUMENT_COUNT, {});
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const c = (parsed.count ?? '—').toLocaleString();
    if ($('inst-count'))      { $('inst-count').textContent      = c; }
    if ($('dash-inst-count')) { $('dash-inst-count').textContent = c; }
  } catch { if ($('inst-count')) { $('inst-count').textContent = '—'; } }
}

// ── Browse Instruments: Stream -> Symbols -> Expiries -> Option Chain ───────────
const browseState = { stream: 0, symbol: '', expiry: '', symbols: [] };

async function loadStreamStats() {
  const list = $('stream-list');
  list.innerHTML = '<div style="padding:12px 16px;color:var(--text-muted);font-size:12px;"><span class="spinner"></span> Loading...</div>';
  try {
    const data  = await sendCommand(CMD.GET_STREAM_STATS, {});
    const stats = typeof data === 'string' ? JSON.parse(data) : (Array.isArray(data) ? data : []);
    if (!stats.length) {
      list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No streams loaded</div>';
      return;
    }
    list.innerHTML = stats.map(s => `
      <div onclick="selectStream(${s.streamId})" id="stream-row-${s.streamId}"
           style="padding:8px 12px;cursor:pointer;border-radius:4px;margin:2px 4px;">
        <div style="font-size:13px;font-weight:600;">Stream ${s.streamId}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
          ${s.tokenCount.toLocaleString()} tokens &nbsp;·&nbsp; ${s.symbolCount.toLocaleString()} symbols
        </div>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = `<div style="padding:12px;color:var(--danger);font-size:12px;">${e.message}</div>`;
  }
}

function highlightStream(streamId) {
  document.querySelectorAll('[id^="stream-row-"]').forEach(el => {
    const sid = parseInt(el.id.replace('stream-row-',''));
    el.style.background = sid === streamId ? 'rgba(88,166,255,.12)' : '';
    el.style.color      = sid === streamId ? 'var(--accent)' : '';
  });
}

async function selectStream(streamId) {
  browseState.stream = streamId;
  browseState.symbol = '';
  browseState.expiry = '';
  highlightStream(streamId);
  $('sym-list').innerHTML = '<div style="padding:12px 16px;color:var(--text-muted);font-size:12px;"><span class="spinner"></span> Loading...</div>';
  $('exp-list').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Select a symbol</div>';
  clearChain();
  try {
    const data = await sendCommand(CMD.GET_SYMBOLS_BY_STREAM, { streamId });
    const syms = typeof data === 'string' ? JSON.parse(data) : (Array.isArray(data) ? data : []);
    browseState.symbols = syms;
    $('sym-count').textContent = syms.length.toLocaleString();
    renderSymbolList(syms);
  } catch (e) {
    $('sym-list').innerHTML = `<div style="padding:12px;color:var(--danger);font-size:12px;">${e.message}</div>`;
  }
}

function renderSymbolList(syms) {
  const filter = ($('sym-filter').value || '').toUpperCase();
  const visible = filter ? syms.filter(s => s.toUpperCase().includes(filter)) : syms;
  if (!visible.length) {
    $('sym-list').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No symbols match</div>';
    return;
  }
  $('sym-list').innerHTML = visible.map(s => {
    const active = s === browseState.symbol ? 'background:rgba(88,166,255,.12);color:var(--accent);font-weight:600;' : '';
    return `<div onclick="selectSymbol('${s}')" style="padding:6px 14px;cursor:pointer;font-size:13px;${active}border-radius:4px;margin:1px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${s}">${s}</div>`;
  }).join('');
}

async function selectSymbol(symbol) {
  browseState.symbol = symbol;
  browseState.expiry = '';
  renderSymbolList(browseState.symbols);
  $('exp-list').innerHTML = '<div style="padding:12px 16px;color:var(--text-muted);font-size:12px;"><span class="spinner"></span> Loading...</div>';
  clearChain();
  try {
    const data = await sendCommand(CMD.GET_EXPIRIES_BY_STREAM, { streamId: browseState.stream, symbol });
    const exps = typeof data === 'string' ? JSON.parse(data) : (Array.isArray(data) ? data : []);
    renderExpiryList(exps);
  } catch (e) {
    $('exp-list').innerHTML = `<div style="padding:12px;color:var(--danger);font-size:12px;">${e.message}</div>`;
  }
}

function renderExpiryList(exps) {
  if (!exps.length) {
    $('exp-list').innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:12px;">No expiries (EQ)</div>';
    loadOptionChain(browseState.symbol, '');
    return;
  }
  $('exp-list').innerHTML = exps.map(e => {
    const active = e === browseState.expiry ? 'background:rgba(88,166,255,.12);color:var(--accent);font-weight:600;' : '';
    const d = new Date(e);
    const label = isNaN(d) ? e : d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' });
    return `<div onclick="selectExpiry('${e}')" style="padding:6px 14px;cursor:pointer;font-size:13px;${active}border-radius:4px;margin:1px 4px;">${label}</div>`;
  }).join('');
}

async function selectExpiry(expiry) {
  browseState.expiry = expiry;
  $('exp-list').querySelectorAll('div').forEach(d => {
    const active = d.getAttribute('onclick') === `selectExpiry('${expiry}')`;
    d.style.background = active ? 'rgba(88,166,255,.12)' : '';
    d.style.color      = active ? 'var(--accent)'        : '';
    d.style.fontWeight = active ? '600'                  : '';
  });
  await loadOptionChain(browseState.symbol, expiry);
}

async function loadOptionChain(symbol, expiry) {
  $('chain-title').textContent = symbol + (expiry ? ' · ' + expiry : '');
  $('chain-fut').textContent   = '';
  $('chain-head').innerHTML    = '<tr><th colspan="5" style="padding:12px;text-align:center;color:var(--text-muted);font-weight:400;"><span class="spinner"></span> Loading...</th></tr>';
  $('chain-tbody').innerHTML   = '';
  try {
    const streamId = browseState.stream;
    const args = expiry ? { symbol, expiry, streamId } : { symbol, streamId };
    const data  = await sendCommand(CMD.SEARCH_INSTRUMENTS, args);
    const rows  = typeof data === 'string' ? JSON.parse(data) : (Array.isArray(data) ? data : []);
    renderOptionChain(rows);
  } catch (e) {
    $('chain-head').innerHTML = `<tr><td colspan="5" style="padding:12px;color:var(--danger);">${e.message}</td></tr>`;
  }
}

function renderOptionChain(rows) {
  const futs = rows.filter(r => r.type && r.type.startsWith('FUT'));
  const ces  = rows.filter(r => r.optionType === 'CE');
  const pes  = rows.filter(r => r.optionType === 'PE');
  const eqs  = rows.filter(r => !futs.includes(r) && !ces.includes(r) && !pes.includes(r));

  if (futs.length) {
    $('chain-fut').textContent = 'FUT: Tk ' + futs.map(f => f.token).join(', ') + '  Lot ' + (futs[0].lotSize || '—');
  }

  if (ces.length || pes.length) {
    const strikeMap = {};
    ces.forEach(r => { strikeMap[r.strike] = strikeMap[r.strike] || {}; strikeMap[r.strike].ce = r; });
    pes.forEach(r => { strikeMap[r.strike] = strikeMap[r.strike] || {}; strikeMap[r.strike].pe = r; });
    const strikes = Object.keys(strikeMap).map(Number).sort((a,b) => a-b);

    $('chain-head').innerHTML = `
      <tr style="background:var(--bg-card);">
        <th colspan="2" style="padding:7px 12px;text-align:center;border-bottom:1px solid var(--border);color:var(--accent);">CALL (CE)</th>
        <th style="padding:7px 8px;text-align:center;border-bottom:1px solid var(--border);border-left:1px solid var(--border);border-right:1px solid var(--border);">STRIKE</th>
        <th colspan="2" style="padding:7px 12px;text-align:center;border-bottom:1px solid var(--border);color:#f8a261;">PUT (PE)</th>
      </tr>
      <tr style="background:var(--bg-card);font-size:11px;color:var(--text-muted);">
        <th style="padding:4px 12px;text-align:right;border-bottom:1px solid var(--border);">Token</th>
        <th style="padding:4px 8px;text-align:right;border-bottom:1px solid var(--border);">Lot</th>
        <th style="padding:4px 8px;text-align:center;border-bottom:1px solid var(--border);border-left:1px solid var(--border);border-right:1px solid var(--border);">Rs</th>
        <th style="padding:4px 8px;text-align:left;border-bottom:1px solid var(--border);">Token</th>
        <th style="padding:4px 12px;text-align:left;border-bottom:1px solid var(--border);">Lot</th>
      </tr>`;

    $('chain-tbody').innerHTML = strikes.map(strike => {
      const ce = strikeMap[strike].ce;
      const pe = strikeMap[strike].pe;
      return `<tr style="border-bottom:1px solid rgba(255,255,255,.04);">
        <td style="padding:5px 12px;text-align:right;font-family:monospace;color:var(--accent);">${ce ? ce.token : '—'}</td>
        <td style="padding:5px 8px;text-align:right;color:var(--text-muted);">${ce ? ce.lotSize : '—'}</td>
        <td style="padding:5px 8px;text-align:center;font-weight:600;border-left:1px solid var(--border);border-right:1px solid var(--border);">${Number(strike).toFixed(0)}</td>
        <td style="padding:5px 8px;text-align:left;font-family:monospace;color:#f8a261;">${pe ? pe.token : '—'}</td>
        <td style="padding:5px 12px;text-align:left;color:var(--text-muted);">${pe ? pe.lotSize : '—'}</td>
      </tr>`;
    }).join('');

  } else {
    const all = [...futs, ...eqs];
    $('chain-head').innerHTML = `<tr style="background:var(--bg-card);">
      <th style="padding:7px 8px;border-bottom:1px solid var(--border);">Token</th>
      <th style="padding:7px 8px;border-bottom:1px solid var(--border);">Symbol</th>
      <th style="padding:7px 8px;border-bottom:1px solid var(--border);">Type</th>
      <th style="padding:7px 8px;border-bottom:1px solid var(--border);">Expiry</th>
      <th style="padding:7px 8px;border-bottom:1px solid var(--border);">Lot</th>
      <th style="padding:7px 8px;border-bottom:1px solid var(--border);">Tick</th>
    </tr>`;
    $('chain-tbody').innerHTML = all.map(r => `<tr style="border-bottom:1px solid rgba(255,255,255,.04);">
      <td style="padding:5px 8px;font-family:monospace;">${r.token}</td>
      <td style="padding:5px 8px;font-weight:600;">${r.symbol}</td>
      <td style="padding:5px 8px;">${typeBadge(r.type)}</td>
      <td style="padding:5px 8px;">${r.expiry||'—'}</td>
      <td style="padding:5px 8px;">${r.lotSize}</td>
      <td style="padding:5px 8px;">${r.tickSize}</td>
    </tr>`).join('') || '<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--text-muted);">No data</td></tr>';
  }
}

function clearChain() {
  var el;
  if ((el = $('chain-title'))) { el.textContent = 'OPTION CHAIN'; }
  if ((el = $('chain-fut')))   { el.textContent = ''; }
  if ((el = $('chain-head')))  { el.innerHTML   = '<tr><th colspan="5" style="padding:20px;text-align:center;color:var(--text-muted);font-weight:400;">Select a symbol and expiry</th></tr>'; }
  if ((el = $('chain-tbody'))) { el.innerHTML   = ''; }
}


function nseEpochToDate(secs)
{
    if (!secs || secs <= 0) { return ''; }
    return new Date((secs + NSE_EPOCH_OFFSET) * 1000).toISOString().slice(0, 10);
}

function parseNseContractTxt(text)
{
    const records = [];
    let skipped = 0;
    const lines = text.split('\n');
    for (let i = 1; i < lines.length; i++) // skip NEATFO|7.0.4| header
    {
        const line = lines[i].trimEnd();
        if (!line) { continue; }
        const f = line.split('|');
        if (f.length < 33) { skipped++; continue; }
        try
        {
            const token        = parseInt(f[0]);
            const underlyingTk = parseInt(f[1]) || 0;
            const instrType    = f[2].trim();
            const symbol       = f[3].trim();
            const series       = f[4].trim() || 'XX';
            const expirySecs   = parseInt(f[6]) || 0;
            const strikePaise  = parseInt(f[7]);
            const optType      = f[8].trim();
            const pricePrecision = parseInt(f[14]) || 2;
            const lotSize      = parseInt(f[30]) || 1;
            const tickPaise    = parseInt(f[32]) || 5;
            if (isNaN(token) || token <= 0) { skipped++; continue; }
            const expiry     = nseEpochToDate(expirySecs);
            const strike     = (strikePaise > 0) ? (strikePaise / 100).toFixed(2) : '0.00';
            const optionType = (optType === 'XX' || optType === '') ? '' : optType;
            const tickSize   = (tickPaise / 100).toFixed(2);
            records.push({ token, symbol, series, instrType, expiry, strike,
                           optionType, lotSize, tickSize, underlyingTk,
                           pricePrecision, qtyPrecision: 0, freezeQty: 0 });
        }
        catch (_) { skipped++; }
    }
    return { records, skipped };
}

function parseNseStreamCsv(text)
{
    // Format: C,StreamID,Token,Instrument,Symbol,ExpiryDate,StrikePrice,OptionType
    // Header line: timestamp,count,
    const map = {}; // token -> streamId
    const lines = text.split('\n');
    for (let i = 1; i < lines.length; i++)
    {
        const line = lines[i].trim();
        if (!line || line[0] !== 'C') { continue; }
        const f = line.split(',');
        if (f.length < 3) { continue; }
        const streamId = parseInt(f[1]);
        const token    = parseInt(f[2]);
        if (!isNaN(token) && !isNaN(streamId)) { map[token] = streamId; }
    }
    return map;
}

function nseRecordsToCsv(records)
{
    const hdr = 'token,symbol,series,instrumentType,expiry,strike,optionType,lotSize,tickSize,underlyingToken,pricePrecision,qtyPrecision,freezeQty,streamId';
    const rows = records.map(r =>
        `${r.token},${r.symbol},${r.series},${r.instrType},${r.expiry},${r.strike},${r.optionType},${r.lotSize},${r.tickSize},${r.underlyingTk},${r.pricePrecision},${r.qtyPrecision},${r.freezeQty},${r.streamId||0}`
    );
    return [hdr, ...rows].join('\n');
}

function showNseStatus(msg, type)
{
    const el = $('nse-status');
    el.style.display = 'block'; el.className = type; el.innerHTML = msg;
}

const nseState = { contractText: null, streamText: null };

function nseSetupDrop(dropId, inputId, stateKey, labelId)
{
    const dz = $(dropId), inp = $(inputId);
    function onFile(file)
    {
        if (!file) { return; }
        const reader = new FileReader();
        reader.onload = ev =>
        {
            nseState[stateKey] = ev.target.result;
            $(labelId).textContent = file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
            $(labelId).style.color = 'var(--success)';
            dz.classList.add('has-file');
            $('btn-nse-load').disabled = !state.loggedIn || !nseState.contractText;
            $('btn-nse-clear').style.display = '';
            $('nse-status').style.display = 'none';
        };
        reader.readAsText(file);
    }
    dz.ondragover  = e => { e.preventDefault(); dz.classList.add('drag-over'); };
    dz.ondragleave = () => dz.classList.remove('drag-over');
    dz.ondrop      = e => { e.preventDefault(); dz.classList.remove('drag-over'); onFile(e.dataTransfer.files[0]); };
    dz.onclick     = () => inp.click();
    inp.onchange   = () => onFile(inp.files[0]);
}
