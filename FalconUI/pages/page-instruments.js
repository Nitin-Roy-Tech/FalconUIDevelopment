// Falcon Admin — Instruments Page
(function () {
  'use strict';
  
  // ── State Objects ────────────────────────────────────────────────────────────
  window.nseState = {
    contractText: null,
    streamText: null
  };
  
  window.browseState = {
    symbols: [],
    selectedStream: null,
    selectedSymbol: null
  };

  // ── Helper Functions ─────────────────────────────────────────────────────────
  
  // Show/hide NSE vs generic sections based on exchange
  window.onExchangeChange = function() {
    var exchId = parseInt($('sel-exchange').value);
    var nseSection = $('nse-section');
    var genericSection = $('generic-section');
    
    if (exchId === 1) { // NSE
      nseSection.style.display = '';
      genericSection.style.display = 'none';
    } else {
      nseSection.style.display = 'none';
      genericSection.style.display = '';
    }
  };

  // Reload instrument count from backend
  window.refreshCount = async function() {
    try {
      var result = await sendCommand(CMD.GET_INSTRUMENT_COUNT, {
        exchangeId: parseInt($('sel-exchange').value)
      });
      var count = typeof result === 'string' ? JSON.parse(result).count : result.count;
      $('inst-count').textContent = (count || 0).toLocaleString();
    } catch(e) {
      log('Error refreshing count: ' + e.message, 'error');
    }
  };

  // Load stream list for selected exchange/segment
  window.loadSymbols = async function() {
    try {
      var result = await sendCommand(CMD.GET_SYMBOLS_BY_STREAM, {
        exchangeId: parseInt($('sel-exchange').value),
        segmentId: parseInt($('sel-segment').value)
      });
      
      var data = typeof result === 'string' ? JSON.parse(result) : result;
      var streams = data.streams || [];
      
      browseState.symbols = streams;
      renderStreamList(streams);
      
      // Clear symbol/expiry panels
      $('sym-list').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Select a stream</div>';
      $('exp-list').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Select a symbol</div>';
      $('chain-tbody').innerHTML = '';
      $('chain-head').innerHTML = '<tr><th colspan="4" style="padding:20px;text-align:center;color:var(--text-muted);font-weight:400;">Select a symbol and expiry</th></tr>';
    } catch(e) {
      log('Error loading symbols: ' + e.message, 'error');
    }
  };

  // Render stream list
  function renderStreamList(streams) {
    var html = '';
    if (!streams || streams.length === 0) {
      html = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No streams available</div>';
    } else {
      streams.forEach(function(stream) {
        html += '<div style="padding:8px 12px;cursor:pointer;color:var(--text-muted);font-size:12px;border-bottom:1px solid var(--border);" onclick="onStreamSelect(\'' + 
                stream.streamId + '\')">' + stream.name + '</div>';
      });
    }
    $('stream-list').innerHTML = html;
  }

  // Render symbol list (used for filtering)
  window.renderSymbolList = function(symbols) {
    var filter = ($('sym-filter').value || '').toLowerCase();
    var filtered = symbols.filter(function(s) { 
      return !filter || s.symbol.toLowerCase().includes(filter); 
    });
    
    var html = '';
    if (!filtered || filtered.length === 0) {
      html = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No symbols</div>';
    } else {
      filtered.forEach(function(sym) {
        html += '<div style="padding:8px 12px;cursor:pointer;color:var(--text-muted);font-size:12px;border-bottom:1px solid var(--border);" onclick="onSymbolSelect(\'' +
                sym.token + '\')">' + sym.symbol + '</div>';
      });
    }
    $('sym-list').innerHTML = html;
    $('sym-count').textContent = filtered.length.toLocaleString();
  };

  // Stream selection handler
  window.onStreamSelect = function(streamId) {
    browseState.selectedStream = streamId;
    var symbols = browseState.symbols.filter(function(s) { return s.streamId == streamId; });
    renderSymbolList(symbols);
  };

  // Symbol selection handler
  window.onSymbolSelect = function(token) {
    browseState.selectedSymbol = token;
    // TODO: Load expiries for selected symbol
    // var sym = browseState.symbols.find(s => s.token == token);
  };

  // ── NSE File Handling ────────────────────────────────────────────────────────

  // Setup drag-drop zone for NSE files
  window.nseSetupDrop = function(dropZoneId, fileInputId, stateKey, labelId) {
    var dropZone = $(dropZoneId);
    var fileInput = $(fileInputId);
    var label = $(labelId);
    
    function loadFile(file) {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        nseState[stateKey] = e.target.result;
        label.textContent = file.name;
        label.style.color = 'var(--success)';
        dropZone.classList.add('has-file');
        checkNseReady();
      };
      reader.onerror = function() {
        label.textContent = 'Error reading file';
        label.style.color = 'var(--danger)';
      };
      reader.readAsText(file);
    }
    
    dropZone.ondragover = function(e) { 
      e.preventDefault(); 
      dropZone.classList.add('drag-over'); 
    };
    dropZone.ondragleave = function() { 
      dropZone.classList.remove('drag-over'); 
    };
    dropZone.ondrop = function(e) { 
      e.preventDefault(); 
      dropZone.classList.remove('drag-over'); 
      loadFile(e.dataTransfer.files[0]); 
    };
    dropZone.onclick = function(e) { 
      if (e.target.tagName !== 'SPAN') fileInput.click(); 
    };
    fileInput.onchange = function() { 
      loadFile(fileInput.files[0]); 
    };
  };

  // Check if NSE files are ready for upload
  function checkNseReady() {
    var ready = nseState.contractText !== null;
    $('btn-nse-load').disabled = !ready || !state.loggedIn;
    $('btn-nse-clear').style.display = ready ? '' : 'none';
  }

  // ── NSE Parsers ──────────────────────────────────────────────────────────────

  // Parse NSE contract.txt format
  window.parseNseContractTxt = function(text) {
    var lines = text.split('\n');
    var records = [];
    var skipped = 0;
    
    // Skip header if it exists
    var startIdx = 0;
    if (lines[0] && lines[0].includes('token')) startIdx = 1;
    
    for (var i = startIdx; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      
      try {
        // Expected format: token|symbol|name|series|...
        var fields = line.split('|');
        if (fields.length < 2) { skipped++; continue; }
        
        records.push({
          token: fields[0],
          symbol: fields[1],
          name: fields[2] || '',
          series: fields[3] || '',
          expiryDate: fields[4] || '',
          strikePrice: fields[5] || '0',
          optionType: fields[6] || '',
          exch_token: fields[7] || '',
          isin: fields[8] || '',
          streamId: 0
        });
      } catch(e) {
        skipped++;
      }
    }
    
    return { records: records, skipped: skipped };
  };

  // Parse NSE stream CSV
  window.parseNseStreamCsv = function(text) {
    var lines = text.split('\n');
    var map = {};
    
    // Skip header
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      
      try {
        // Expected format: token,streamid,streamname
        var fields = line.split(',');
        if (fields.length >= 2) {
          map[fields[0]] = fields[1];
        }
      } catch(e) {}
    }
    
    return map;
  };

  // Convert records to CSV format
  window.nseRecordsToCsv = function(records) {
    if (!records || records.length === 0) return '';
    
    var lines = [];
    records.forEach(function(rec) {
      lines.push([
        rec.token,
        rec.symbol,
        rec.name,
        rec.series,
        rec.expiryDate,
        rec.strikePrice,
        rec.optionType,
        rec.exch_token,
        rec.isin,
        rec.streamId || 0
      ].join(','));
    });
    
    return lines.join('\n');
  };

  // ── Page Definition ──────────────────────────────────────────────────────────
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
              <option value="1">CM — Cash / Equity</option>
              <option value="2" selected>FO — Futures & Options</option>
              <option value="3">CD — Currency Derivatives</option>
              <option value="4">COM — Commodity</option>
            </select>
          </div>
        </div>

        <!-- NSE MTBT pickers (visible when exchange = NSE) -->
        <div id="nse-section">
          <div class="form-row" style="align-items:flex-start;margin-bottom:16px;">
            <div class="form-group" style="flex:1;">
              <label>contract.txt <span style="color:var(--danger)">*</span></label>
              <div id="nse-drop-contract" class="nse-drop-zone">
                <span style="font-size:20px;">📄</span>
                <span id="nse-contract-name" style="color:var(--text-muted);font-size:12px;">Drop file or click to browse</span>
              </div>
              <input type="file" id="nse-file-contract" accept=".txt" style="display:none">
            </div>
            <div class="form-group" style="flex:1;">
              <label>fo_contract_stream_info.csv <span style="color:var(--accent);font-size:11px;">(optional for StreamID)</span></label>
              <div id="nse-drop-stream" class="nse-drop-zone">
                <span style="font-size:20px;">📄</span>
                <span id="nse-stream-name" style="color:var(--text-muted);font-size:12px;">Drop file or click to browse</span>
              </div>
              <input type="file" id="nse-file-stream" accept=".csv" style="display:none">
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;">
            <button class="btn btn-primary" id="btn-nse-load" disabled>Parse & Load NSE Files</button>
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
            <div class="dz-icon">📄</div>
            <div class="dz-text">Drop CSV file here or <span onclick="document.getElementById('file-input').click()">browse</span></div>
            <div id="file-name"></div>
          </div>
          <input type="file" id="file-input" accept=".csv,.txt">
          <div style="display:flex;gap:10px;align-items:center;margin-top:16px;">
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
            <div style="padding:8px 12px;font-size:11px;font-weight:600;color:var(--text-muted);letter-spacing:.06em;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;">
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
            <div style="padding:8px 12px;font-size:11px;font-weight:600;color:var(--text-muted);letter-spacing:.06em;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;">
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
      // Initialize exchange selector
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
        $('file-name').textContent = ''; 
        dropZone.classList.remove('has-file');
        $('btn-load').disabled = true; 
        $('btn-clear-file').style.display = 'none';
        fileInput.value = ''; 
        hideStatus();
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
          showStatus('✓ Loaded <strong>' + result.loaded + '</strong> of <strong>' +
            result.submitted + '</strong> instruments successfully.', 'success');
          await refreshCount();
          await loadSymbols();
        } catch(e) {
          showStatus('✗ Error: ' + e.message, 'error');
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
          showStatus('✓ Instruments deleted.', 'success');
          await refreshCount();
          await loadSymbols();
        } catch(e) {
          showStatus('✗ Error: ' + e.message, 'error');
        } finally { $('btn-delete').disabled = false; }
      };
      
      $('sym-filter').oninput = function() { renderSymbolList(browseState.symbols); };

      // ── NSE file pickers ─────────────────────────────────────────────────────
      nseSetupDrop('nse-drop-contract', 'nse-file-contract', 'contractText', 'nse-contract-name');
      nseSetupDrop('nse-drop-stream',   'nse-file-stream',   'streamText',   'nse-stream-name');
      
      $('btn-nse-clear').onclick = function () {
        nseState.contractText = null; 
        nseState.streamText = null;
        ['nse-drop-contract','nse-drop-stream'].forEach(function(id){ $(id).classList.remove('has-file'); });
        $('nse-contract-name').textContent = 'Drop file or click to browse';
        $('nse-contract-name').style.color = '';
        $('nse-stream-name').textContent   = 'Drop file or click to browse';
        $('nse-stream-name').style.color   = '';
        $('nse-file-contract').value = ''; 
        $('nse-file-stream').value = '';
        $('btn-nse-load').disabled = true; 
        $('btn-nse-clear').style.display = 'none';
        $('nse-status').style.display = 'none'; 
        $('nse-record-count').textContent = '';
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
                records[ri].streamId = streamMap[records[ri].token]; 
                streamsMapped++;
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
            totalLoaded    += result.loaded; 
            totalSubmitted += result.submitted;
            $('nse-progress-bar').style.width = pct + '%';
          }
          
          $('nse-progress-bar').style.width = '100%';
          $('nse-progress-label').textContent = 'Done.';
          showNseStatus('Loaded <strong>' + totalLoaded + '</strong> of <strong>' + totalSubmitted +
            '</strong> instruments' + (nseState.streamText ? ' with StreamID' : ' (StreamID=0)') +
            (skipped ? '; ' + skipped + ' rows skipped' : '') + '.', 'success');
          await refreshCount();
          await loadSymbols();
        } catch(e) {
          $('nse-progress-bar').style.width = '0%';
          showNseStatus('Error: ' + e.message, 'error');
        } finally { $('btn-nse-load').disabled = !state.loggedIn; }
      };
      
      // Load initial data
      refreshCount();
      loadSymbols();
    }
  };
})();
