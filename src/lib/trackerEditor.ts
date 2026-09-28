const EDITOR_STYLES = `
  body.editing :is(table.trk,table.tracker) td, body.editing :is(table.trk,table.tracker) th,
  body[contenteditable="true"] :is(table.trk,table.tracker) td, body[contenteditable="true"] :is(table.trk,table.tracker) th { position: relative; }
  body.editing :is(table.trk,table.tracker) .tracker-selected,
  body[contenteditable="true"] :is(table.trk,table.tracker) .tracker-selected { outline: 3px solid #4f46e5 !important; outline-offset: -3px; }
  body.editing :is(table.trk,table.tracker) .tracker-group-selected,
  body[contenteditable="true"] :is(table.trk,table.tracker) .tracker-group-selected { box-shadow:inset 0 0 0 2px #4f46e5; }
  .tracker-fill-handle { display:none; position:absolute; width:11px; height:11px; right:-5px; bottom:-5px; z-index:20; border:2px solid #fff; background:#4f46e5; cursor:crosshair; box-shadow:0 0 0 1px #4f46e5; }
  body.editing .tracker-selected > .tracker-fill-handle,
  body[contenteditable="true"] .tracker-selected > .tracker-fill-handle { display:block; }
  body.tracker-filling :is(table.trk,table.tracker) td, body.tracker-filling :is(table.trk,table.tracker) th { cursor:crosshair; user-select:none; }
  body.tracker-filling .tracker-fill-target { box-shadow:inset 0 0 0 3px #16a34a; }
  .tracker-column-controls { display:none; gap:6px; align-items:center; }
  body.editing .tracker-column-controls, body[contenteditable="true"] .tracker-column-controls { display:flex; }
  .tracker-column-controls button { padding:9px 12px; }
  .tracker-colour-label { display:inline-flex; align-items:center; gap:6px; padding:7px 10px; border:1px solid #d4d4d8; border-radius:999px; background:#fff; color:#18181b; font:600 13px/1 Calibri,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.10); }
  .tracker-colour-label input { width:24px; height:24px; padding:0; border:0; background:transparent; cursor:pointer; }
`;

const EDITOR_SCRIPT = String.raw`
(function () {
  if (window.__trackerSpreadsheetEditor) return;
  window.__trackerSpreadsheetEditor = true;

  var table = document.querySelector('table.trk, table.tracker');
  var toolbar = document.querySelector('.edit-toolbar');
  var sheet = document.querySelector('.sheet') || document.body;
  if (!table || !toolbar || !sheet) return;

  var selected = null;
  var selectedCells = [];
  var selectionMode = 'cell';
  var fillSource = null;
  var fillTarget = null;
  var fillTargets = [];
  var history = [];
  var recordingTimer = 0;
  var restoring = false;
  var controls = document.createElement('span');
  controls.className = 'tracker-column-controls';
  controls.setAttribute('contenteditable', 'false');
  controls.innerHTML = '<button type="button" data-col="left" title="Add a column to the left">+ Column left</button>' +
    '<button type="button" data-col="right" title="Add a column to the right">+ Column right</button>' +
    '<button type="button" data-select="row" title="Select the whole data row">Select row</button>' +
    '<button type="button" data-select="column" title="Select the whole data column">Select column</button>' +
    '<button type="button" data-row="delete" title="Delete the selected row">Delete row</button>' +
    '<button type="button" data-col="delete" title="Delete the selected column">Delete column</button>' +
    '<label class="tracker-colour-label" title="Choose a background colour for the selected cell">Cell fill <input type="color" data-fill="colour" value="#ffff00"></label>' +
    '<button type="button" data-fill="clear" title="Remove the selected cell background colour">Clear fill</button>' +
    '<button type="button" data-col="undo" title="Undo the last tracker change (Ctrl+Z)">Undo</button>';
  toolbar.insertBefore(controls, toolbar.firstChild);

  function isEditing() {
    return document.body.classList.contains('editing') || document.body.contentEditable === 'true';
  }
  function cells(row) { return Array.prototype.slice.call(row.cells); }
  function span(cell) { return Math.max(1, parseInt(cell.getAttribute('colspan') || '1', 10)); }
  function rowSpan(cell) { return Math.max(1, parseInt(cell.getAttribute('rowspan') || '1', 10)); }
  function gridMap() {
    var grid = [];
    var positions = new Map();
    Array.prototype.forEach.call(table.rows, function (row, rowIndex) {
      if (!grid[rowIndex]) grid[rowIndex] = [];
      var column = 0;
      cells(row).forEach(function (cell) {
        while (grid[rowIndex][column]) column++;
        var width = span(cell);
        var height = rowSpan(cell);
        positions.set(cell, { row:rowIndex, column:column, width:width, height:height });
        for (var r = rowIndex; r < rowIndex + height; r++) {
          if (!grid[r]) grid[r] = [];
          for (var c = column; c < column + width; c++) grid[r][c] = cell;
        }
        column += width;
      });
    });
    return { grid:grid, positions:positions };
  }
  function startColumn(cell) {
    var position = gridMap().positions.get(cell);
    return position ? position.column : 0;
  }
  function coveringCell(row, column) {
    var map = gridMap();
    var cell = map.grid[row.rowIndex] && map.grid[row.rowIndex][column];
    if (!cell) return null;
    var position = map.positions.get(cell);
    return position ? { cell:cell, start:position.column, end:position.column + position.width } : null;
  }
  function markDirty() {
    sheet.dispatchEvent(new Event('input', { bubbles:true }));
  }
  function snapshot() {
    var clone = table.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('.tracker-fill-handle'), function (node) { node.remove(); });
    Array.prototype.forEach.call(clone.querySelectorAll('.tracker-selected,.tracker-group-selected,.tracker-fill-target'), function (node) {
      node.classList.remove('tracker-selected', 'tracker-group-selected', 'tracker-fill-target');
    });
    return clone.innerHTML;
  }
  function record() {
    if (restoring) return;
    var state = snapshot();
    if (history[history.length - 1] !== state) history.push(state);
    if (history.length > 60) history.shift();
  }
  function recordSoon() {
    clearTimeout(recordingTimer);
    recordingTimer = setTimeout(record, 350);
  }
  function undo() {
    clearTimeout(recordingTimer);
    record();
    if (history.length < 2) return;
    history.pop();
    restoring = true;
    table.innerHTML = history[history.length - 1];
    restoring = false;
    selected = null;
    selectedCells = [];
    selectionMode = 'cell';
    markDirty();
  }
  function dataRows() {
    return Array.prototype.filter.call(table.rows, function (row) {
      return row.cells.length && row.cells[0].tagName === 'TD' && !row.classList.contains('flt');
    });
  }
  function clearSelection() {
    Array.prototype.forEach.call(table.querySelectorAll('.tracker-selected,.tracker-group-selected'), function (cell) {
      cell.classList.remove('tracker-selected', 'tracker-group-selected');
    });
    Array.prototype.forEach.call(table.querySelectorAll('.tracker-fill-handle'), function (handle) { handle.remove(); });
    selectedCells = [];
  }
  function attachHandle(cell, title) {
    if (!cell) return;
    cell.classList.add('tracker-selected');
    var handle = document.createElement('span');
    handle.className = 'tracker-fill-handle';
    handle.setAttribute('contenteditable', 'false');
    handle.title = title;
    cell.appendChild(handle);
  }
  function selectCell(cell) {
    if (!cell || !table.contains(cell)) return;
    clearSelection();
    selected = cell;
    selectedCells = [cell];
    selectionMode = 'cell';
    attachHandle(cell, 'Drag to fill-copy this cell');
  }
  function selectWholeRow() {
    if (!selected || selected.tagName !== 'TD') { alert('Select a cell in a learner row first.'); return; }
    var anchor = selected;
    clearSelection();
    selected = anchor;
    selectionMode = 'row';
    selectedCells = cells(anchor.parentElement);
    selectedCells.forEach(function (cell) { cell.classList.add('tracker-group-selected'); });
    attachHandle(selectedCells[selectedCells.length - 1], 'Drag to copy this whole row');
  }
  function selectWholeColumn() {
    if (!selected) { alert('Select a table cell first.'); return; }
    var anchor = selected;
    var column = startColumn(anchor);
    clearSelection();
    selected = anchor;
    selectionMode = 'column';
    selectedCells = [];
    dataRows().forEach(function (row) {
      var hit = coveringCell(row, column);
      if (hit && selectedCells.indexOf(hit.cell) < 0) selectedCells.push(hit.cell);
    });
    selectedCells.forEach(function (cell) { cell.classList.add('tracker-group-selected'); });
    attachHandle(selectedCells[selectedCells.length - 1], 'Drag to copy this whole column');
  }
  function newCellLike(sample) {
    var tag = sample && sample.tagName === 'TH' ? 'th' : 'td';
    var cell = document.createElement(tag);
    if (sample) {
      cell.className = sample.className.replace(/(?:^|\s)tracker-selected|(?:^|\s)tracker-group-selected|(?:^|\s)tracker-fill-target/g, '').trim();
      cell.style.cssText = sample.style.cssText;
    }
    cell.innerHTML = '&nbsp;';
    return cell;
  }
  function addColumn(side) {
    if (!selected) { alert('Select a table cell first.'); return; }
    var boundary = startColumn(selected) + (side === 'right' ? span(selected) : 0);
    var adjusted = [];
    Array.prototype.forEach.call(table.rows, function (row) {
      var hit = coveringCell(row, Math.max(0, boundary - (side === 'right' ? 1 : 0)));
      if (hit && boundary > hit.start && boundary < hit.end) {
        if (adjusted.indexOf(hit.cell) < 0) {
          hit.cell.colSpan = span(hit.cell) + 1;
          adjusted.push(hit.cell);
        }
        return;
      }
      var before = null;
      var pos = 0;
      cells(row).some(function (cell) {
        if (pos >= boundary) { before = cell; return true; }
        pos += span(cell);
        return false;
      });
      var sample = before || row.cells[row.cells.length - 1] || selected;
      row.insertBefore(newCellLike(sample), before);
    });
    markDirty();
    record();
  }
  function deleteColumn() {
    if (!selected) { alert('Select a table cell first.'); return; }
    var column = startColumn(selected);
    var map = gridMap();
    var adjusted = [];
    Array.prototype.forEach.call(table.rows, function (row) {
      var cell = map.grid[row.rowIndex] && map.grid[row.rowIndex][column];
      if (cell && adjusted.indexOf(cell) < 0) adjusted.push(cell);
    });
    adjusted.forEach(function (cell) {
      if (span(cell) > 1) cell.colSpan = span(cell) - 1;
      else cell.remove();
    });
    selected = null;
    selectedCells = [];
    markDirty();
    record();
  }
  function deleteRow() {
    if (!selected || selected.tagName !== 'TD') { alert('Select a cell in the row you want to delete.'); return; }
    selected.parentElement.remove();
    selected = null;
    selectedCells = [];
    selectionMode = 'cell';
    markDirty();
    record();
  }
  function cleanHtml(cell) {
    var clone = cell.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('.tracker-fill-handle'), function (node) { node.remove(); });
    return clone.innerHTML;
  }
  function cellsInFillRange(source, target) {
    if (!source || !target) return [];
    var fromRow = source.parentElement.rowIndex;
    var toRow = target.parentElement.rowIndex;
    var fromCol = startColumn(source);
    var toCol = startColumn(target);
    var rowDistance = Math.abs(toRow - fromRow);
    var colDistance = Math.abs(toCol - fromCol);
    var result = [];
    var seen = [];

    if (selectionMode === 'row') {
      var rowStart = Math.min(selected.parentElement.rowIndex, target.parentElement.rowIndex);
      var rowEnd = Math.max(selected.parentElement.rowIndex, target.parentElement.rowIndex);
      dataRows().forEach(function (row) {
        if (row.rowIndex < rowStart || row.rowIndex > rowEnd || row === selected.parentElement) return;
        cells(row).forEach(function (cell) { result.push(cell); });
      });
      return result;
    }
    if (selectionMode === 'column') {
      var sourceColumn = startColumn(selected);
      var targetColumn = startColumn(target);
      var colStart = Math.min(sourceColumn, targetColumn);
      var colEnd = Math.max(sourceColumn, targetColumn);
      dataRows().forEach(function (row) {
        for (var groupCol = colStart; groupCol <= colEnd; groupCol++) {
          if (groupCol === sourceColumn) continue;
          var groupHit = coveringCell(row, groupCol);
          if (groupHit && seen.indexOf(groupHit.cell) < 0) { seen.push(groupHit.cell); result.push(groupHit.cell); }
        }
      });
      return result;
    }

    // Like Excel's fill handle, follow the dominant drag direction. This
    // avoids unexpectedly overwriting a rectangle when the pointer wobbles.
    if (rowDistance >= colDistance) {
      var firstRow = Math.min(fromRow, toRow);
      var lastRow = Math.max(fromRow, toRow);
      for (var r = firstRow; r <= lastRow; r++) {
        var vertical = table.rows[r] && coveringCell(table.rows[r], fromCol);
        if (vertical && vertical.cell !== source && seen.indexOf(vertical.cell) < 0) {
          seen.push(vertical.cell);
          result.push(vertical.cell);
        }
      }
    } else {
      var firstCol = Math.min(fromCol, toCol);
      var lastCol = Math.max(fromCol, toCol);
      for (var c = firstCol; c <= lastCol; c++) {
        var horizontal = coveringCell(source.parentElement, c);
        if (horizontal && horizontal.cell !== source && seen.indexOf(horizontal.cell) < 0) {
          seen.push(horizontal.cell);
          result.push(horizontal.cell);
        }
      }
    }
    return result;
  }
  function showFillRange(source, target) {
    fillTargets.forEach(function (cell) { cell.classList.remove('tracker-fill-target'); });
    fillTargets = cellsInFillRange(source, target);
    fillTargets.forEach(function (cell) { cell.classList.add('tracker-fill-target'); });
  }
  function copyFillRange(source, target) {
    if (!source || !target || source === target) return;
    var targets = cellsInFillRange(source, target);
    if (!targets.length) return;
    function copyCellAppearance(from, to) {
      var sourceStyle = window.getComputedStyle(from);
      to.innerHTML = cleanHtml(from);
      to.style.backgroundColor = sourceStyle.backgroundColor;
      to.style.color = sourceStyle.color;
    }
    if (selectionMode === 'row') {
      var sourceRowCells = cells(selected.parentElement);
      var targetRows = [];
      targets.forEach(function (cell) {
        if (targetRows.indexOf(cell.parentElement) < 0) targetRows.push(cell.parentElement);
      });
      targetRows.forEach(function (row) {
        cells(row).forEach(function (cell, index) {
          if (sourceRowCells[index]) copyCellAppearance(sourceRowCells[index], cell);
        });
      });
    } else if (selectionMode === 'column') {
      var sourceColumn = startColumn(selected);
      var targetColumn = startColumn(target);
      var colStart = Math.min(sourceColumn, targetColumn);
      var colEnd = Math.max(sourceColumn, targetColumn);
      dataRows().forEach(function (row) {
        var sourceHit = coveringCell(row, sourceColumn);
        if (!sourceHit) return;
        for (var c = colStart; c <= colEnd; c++) {
          if (c === sourceColumn) continue;
          var destinationHit = coveringCell(row, c);
          if (destinationHit) copyCellAppearance(sourceHit.cell, destinationHit.cell);
        }
      });
    } else {
      targets.forEach(function (cell) { copyCellAppearance(source, cell); });
    }
    markDirty();
    record();
    selectCell(target);
  }

  history.push(snapshot());

  table.addEventListener('click', function (event) {
    if (!isEditing()) return;
    var cell = event.target.closest('td,th');
    if (cell && table.contains(cell)) selectCell(cell);
  });
  table.addEventListener('pointerdown', function (event) {
    if (!isEditing() || !event.target.classList.contains('tracker-fill-handle')) return;
    event.preventDefault();
    fillSource = selectionMode === 'cell' ? event.target.parentElement : selected;
    fillTarget = null;
    fillTargets = [];
    document.body.classList.add('tracker-filling');
  });
  document.addEventListener('pointermove', function (event) {
    if (!fillSource) return;
    var underPointer = document.elementFromPoint(event.clientX, event.clientY);
    var target = underPointer && underPointer.closest('td,th');
    if (!target) return;
    if (!table.contains(target)) return;
    fillTarget = target;
    showFillRange(fillSource, fillTarget);
  });
  document.addEventListener('pointerup', function () {
    if (!fillSource) return;
    fillTargets.forEach(function (cell) { cell.classList.remove('tracker-fill-target'); });
    copyFillRange(fillSource, fillTarget);
    fillSource = fillTarget = null;
    fillTargets = [];
    document.body.classList.remove('tracker-filling');
  });
  controls.addEventListener('click', function (event) {
    var action = event.target.getAttribute('data-col');
    var selectAction = event.target.getAttribute('data-select');
    var rowAction = event.target.getAttribute('data-row');
    var fillAction = event.target.getAttribute('data-fill');
    if (action === 'undo') undo();
    if (action === 'delete') deleteColumn();
    if (action === 'left' || action === 'right') addColumn(action);
    if (selectAction === 'row') selectWholeRow();
    if (selectAction === 'column') selectWholeColumn();
    if (rowAction === 'delete') deleteRow();
    if (fillAction === 'clear') {
      if (!selected) { alert('Select a table cell first.'); return; }
      (selectedCells.length ? selectedCells : [selected]).forEach(function (cell) {
        cell.style.removeProperty('background-color');
        cell.style.removeProperty('color');
      });
      markDirty();
      record();
    }
  });
  controls.addEventListener('input', function (event) {
    if (event.target.getAttribute('data-fill') !== 'colour') return;
    if (!selected) { alert('Select a table cell first.'); return; }
    (selectedCells.length ? selectedCells : [selected]).forEach(function (cell) {
      cell.style.backgroundColor = event.target.value;
    });
    markDirty();
    record();
  });

  sheet.addEventListener('paste', function (event) {
    if (!isEditing()) return;
    var cell = event.target.closest('td,th');
    var text = event.clipboardData && event.clipboardData.getData('text/plain');
    if (text == null) return;
    event.preventDefault();
    var rows = text.replace(/\r/g, '').split('\n');
    if (rows.length > 1 || rows[0].indexOf('\t') >= 0) {
      if (!cell || !table.contains(cell)) return;
      var rowIndex = cell.parentElement.rowIndex;
      var colIndex = startColumn(cell);
      rows.forEach(function (line, r) {
        if (!line && r === rows.length - 1) return;
        line.split('\t').forEach(function (value, c) {
          var row = table.rows[rowIndex + r];
          var hit = row && coveringCell(row, colIndex + c);
          if (hit) hit.cell.textContent = value;
        });
      });
      markDirty();
      record();
      return;
    }
    document.execCommand('insertText', false, text);
    recordSoon();
  });
  table.addEventListener('input', recordSoon);
  document.addEventListener('keydown', function (event) {
    if (!isEditing() || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
    var selection = window.getSelection();
    var anchor = selection && selection.anchorNode;
    var anchorElement = anchor && (anchor.nodeType === 1 ? anchor : anchor.parentElement);
    if (!anchorElement || !table.contains(anchorElement)) return;
    event.preventDefault();
    undo();
  }, true);
})();
`;

/** Adds spreadsheet-style editing without requiring the stored report to be replaced. */
export function enhanceTrackerHtml(html: string): string {
  if (html.includes("__trackerSpreadsheetEditor")) return html;
  const style = `<style data-tracker-editor>${EDITOR_STYLES}</style>`;
  const script = `<script data-tracker-editor>${EDITOR_SCRIPT}</script>`;
  const withStyle = html.includes("</head>") ? html.replace("</head>", `${style}</head>`) : style + html;
  return withStyle.includes("</body>") ? withStyle.replace("</body>", `${script}</body>`) : withStyle + script;
}
