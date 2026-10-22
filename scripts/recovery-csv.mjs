import fs from 'node:fs';

/** Parse exported recovery CSV without writing learner data into the repo. */
export function readCsv(file) {
  const input = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { row.push(value); value = ''; }
    else if (c === '\n' && !quoted) { row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = ''; }
    else value += c;
  }
  if (quoted) throw new Error('Incomplete CSV: quoted value is not closed.');
  if (value || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row); }
  const headers = rows.shift();
  return rows.filter(r => r.some(Boolean)).map(r => {
    if (r.length !== headers.length) throw new Error('CSV column count mismatch.');
    return Object.fromEntries(headers.map((h, i) => [h, r[i]]));
  });
}
