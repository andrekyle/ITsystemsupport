const EDITOR_STYLES = `
  body.editing :is(table.trk,table.tracker) td, body.editing :is(table.trk,table.tracker) th,
  body[contenteditable="true"] :is(table.trk,table.tracker) td, body[contenteditable="true"] :is(table.trk,table.tracker) th { position: relative; }
  body.editing :is(table.trk,table.tracker) .tracker-selected,
  body[contenteditable="true"] :is(table.trk,table.tracker) .tracker-selected { outline: 3px solid #4f46e5 !important; outline-offset: -3px; }
  .tracker-fill-handle { display:none; position:absolute; width:11px; height:11px; right:-5px; bottom:-5px; z-index:20; border:2px solid #fff; background:#4f46e5; cursor:crosshair; box-shadow:0 0 0 1px #4f46e5; }
  body.editing .tracker-selected > .tracker-fill-handle,
  body[contenteditable="true"] .tracker-selected > .tracker-fill-handle { display:block; }
  body.tracker-filling :is(table.trk,table.tracker) td, body.tracker-filling :is(table.trk,table.tracker) th { cursor:crosshair; user-select:none; }
  body.tracker-filling .tracker-fill-target { box-shadow:inset 0 0 0 3px #16a34a; }
  .tracker-column-controls { display:none; gap:6px; align-items:center; }
  body.editing .tracker-column-controls, body[contenteditable="true"] .tracker-column-controls { display:flex; }
  .tracker-column-controls button { padding:9px 12px; }
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
  var fillSource = null;
  var fillTarget = null;
  var controls = document.createElement('span');
  controls.className = 'tracker-column-controls';
  controls.innerHTML = '<button type="button" data-col="left" title="Add a column to the left">+ Column left</button>' +
    '<button type="button" data-col="right" title="Add a column to the right">+ Column right</button>' +
    '<button type="button" data-col="delete" title="Delete the selected column">Delete column</button>';
  toolbar.insertBefore(controls, toolbar.firstChild);

  function isEditing() {
    return document.body.classList.contains('editing') || document.body.contentEditable === 'true';
  }
  function cells(row) { return Array.prototype.slice.call(row.cells); }
  function span(cell) { return Math.max(1, parseInt(cell.getAttribute('colspan') || '1', 10)); }
  function startColumn(cell) {
    var n = 0;
    cells(cell.parentElement).some(function (item) {
      if (item === cell) return true;
      n += span(item);
      return false;
    });
    return n;
  }
  function coveringCell(row, column) {
    var pos = 0;
    var list = cells(row);
    for (var i = 0; i < list.length; i++) {
      var end = pos + span(list[i]);
      if (column >= pos && column < end) return { cell:list[i], start:pos, end:end };
      pos = end;
    }
    return null;
  }
  function markDirty() {
    sheet.dispatchEvent(new Event('input', { bubbles:true }));
  }
  function selectCell(cell) {
    if (!cell || !table.contains(cell)) return;
    if (selected) selected.classList.remove('tracker-selected');
    selected = cell;
    selected.classList.add('tracker-selected');
    var handle = selected.querySelector(':scope > .tracker-fill-handle');
    if (!handle) {
      handle = document.createElement('span');
      handle.className = 'tracker-fill-handle';
      handle.setAttribute('contenteditable', 'false');
      handle.title = 'Drag to copy this cell';
      selected.appendChild(handle);
    }
  }
  function newCellLike(sample) {
    var tag = sample && sample.tagName === 'TH' ? 'th' : 'td';
    var cell = document.createElement(tag);
    if (sample) {
      cell.className = sample.className.replace(/(?:^|\s)tracker-selected|(?:^|\s)tracker-fill-target/g, '').trim();
      cell.style.cssText = sample.style.cssText;
    }
    cell.innerHTML = '&nbsp;';
    return cell;
  }
  function addColumn(side) {
    if (!selected) { alert('Select a table cell first.'); return; }
    var boundary = startColumn(selected) + (side === 'right' ? span(selected) : 0);
    Array.prototype.forEach.call(table.rows, function (row) {
      var hit = coveringCell(row, Math.max(0, boundary - (side === 'right' ? 1 : 0)));
      if (hit && boundary > hit.start && boundary < hit.end) {
        hit.cell.colSpan = span(hit.cell) + 1;
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
  }
  function deleteColumn() {
    if (!selected) { alert('Select a table cell first.'); return; }
    var column = startColumn(selected);
    Array.prototype.forEach.call(table.rows, function (row) {
      var hit = coveringCell(row, column);
      if (!hit) return;
      if (span(hit.cell) > 1) hit.cell.colSpan = span(hit.cell) - 1;
      else hit.cell.remove();
    });
    selected = null;
    markDirty();
  }
  function cleanHtml(cell) {
    var clone = cell.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('.tracker-fill-handle'), function (node) { node.remove(); });
    return clone.innerHTML;
  }
  function copyCell(source, target) {
    if (!source || !target || source === target) return;
    target.innerHTML = cleanHtml(source);
    markDirty();
    selectCell(target);
  }

  table.addEventListener('click', function (event) {
    if (!isEditing()) return;
    var cell = event.target.closest('td,th');
    if (cell && table.contains(cell)) selectCell(cell);
  });
  table.addEventListener('pointerdown', function (event) {
    if (!isEditing() || !event.target.classList.contains('tracker-fill-handle')) return;
    event.preventDefault();
    fillSource = event.target.parentElement;
    fillTarget = null;
    document.body.classList.add('tracker-filling');
    if (event.target.setPointerCapture) event.target.setPointerCapture(event.pointerId);
  });
  table.addEventListener('pointerover', function (event) {
    if (!fillSource) return;
    var target = event.target.closest('td,th');
    if (!target || target === fillSource) return;
    if (fillTarget) fillTarget.classList.remove('tracker-fill-target');
    fillTarget = target;
    fillTarget.classList.add('tracker-fill-target');
  });
  document.addEventListener('pointerup', function () {
    if (!fillSource) return;
    if (fillTarget) fillTarget.classList.remove('tracker-fill-target');
    copyCell(fillSource, fillTarget);
    fillSource = fillTarget = null;
    document.body.classList.remove('tracker-filling');
  });
  controls.addEventListener('click', function (event) {
    var action = event.target.getAttribute('data-col');
    if (action === 'delete') deleteColumn();
    if (action === 'left' || action === 'right') addColumn(action);
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
      return;
    }
    document.execCommand('insertText', false, text);
  });
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
