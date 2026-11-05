const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (module, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  module._compile(code, filename);
};
Module._extensions['.css'] = () => {};
const load = Module._load;
Module._load = function (request, parent, isMain) {
  if (parent?.filename?.endsWith('Practical114076.tsx') && request === './DocumentActions') return { DocumentActions: () => null };
  if (parent?.filename?.endsWith('Practical114076.tsx') && request === '../lib/documentSignatures') return { canSignDocumentField: () => true };
  if (parent?.filename?.endsWith('DocumentSignature.tsx') && request === './EditingSidebar') return { EditingTools: ({ children }) => children };
  return load.call(this, request, parent, isMain);
};
const { Practical114076 } = require('../src/components/Practical114076.tsx');
const markup = renderToStaticMarkup(React.createElement(Practical114076, {
  profile: { id: 'preview', name: 'Preview', role: 'Super User' }, values: {}, onChange() {},
}));
const pageNumbers = [...markup.matchAll(/data-page="(\d+)"/g)].map(match => Number(match[1]));
if (pageNumbers.length !== 15 || pageNumbers.some((number, index) => number !== index + 1)) {
  throw new Error(`Expected PDF pages 1–15 in order; found ${pageNumbers.join(', ')}`);
}
for (const heading of ['LEARNER’S NOTICE OF ASSESSMENT APPEAL', 'INITIAL MEETING CHECKLIST', 'LEARNER ASSESSMENT PLAN', 'Integrated Summative Assessment Tool', 'Attitudes and Attributes Assessment Tool', 'FEEDBACK SECTION', 'ASSESSMENT DECISION', 'EVALUATION OF ASSESSMENT']) {
  if (!markup.includes(heading)) throw new Error(`Missing source section: ${heading}`);
}
const shared = fs.readFileSync('src/styles.css', 'utf8');
const specific = fs.readFileSync('src/components/practical-114076.css', 'utf8');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'practical-114076-preview-'));
const logo = 'file:///' + path.resolve('public/logos/eruditio.svg').replace(/\\/g, '/');
const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><style>${shared}\n${specific}\nbody{margin:0}.p76-document{padding:0}</style><style>@media print { @page { size:A4 portrait; margin:0; } }</style></head><body>${markup.replaceAll('src="/logos/eruditio.svg"', `src="${logo}"`)}</body></html>`;
const fullOutput = path.join(directory, 'full.html');
fs.writeFileSync(fullOutput, fullHtml);
console.log(fullOutput);
for (const page of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${shared}\n${specific}\nbody{margin:0;background:#ddd}.p76-document{padding:0}.p76-document .lw-page{width:794px;max-width:794px;min-height:1123px;box-shadow:none}.p76-document .lw-page:not(.lw-cover){min-height:1123px;padding:65px 58px;overflow:hidden}.p76-document .lw-page:not([data-page="${page}"]){display:none!important}</style></head><body>${markup.replaceAll('src="/logos/eruditio.svg"', `src="${logo}"`)}</body></html>`;
  const output = path.join(directory, `page-${page}.html`);
  fs.writeFileSync(output, html);
  console.log(output);
}
