import assert from 'node:assert/strict';
import { builtinModules } from 'node:module';
import { build } from 'esbuild';

// Neutral resolution deliberately skips package browser aliases, as deployment
// dependency tracing may follow the Node entry before applying those aliases.
const builtins = new Set(builtinModules.flatMap(name => [name, `node:${name}`]));
const result = await build({
  entryPoints: ['api/qualification-pack.ts', 'api/build-learner-workbook.ts'],
  bundle: true, platform: 'neutral', mainFields: ['module', 'main'],
  format: 'esm', outdir: 'edge-check', write: false, metafile: true,
  external: [...builtins], logLevel: 'silent',
});
const unsupported = [];
for (const [file, metadata] of Object.entries(result.metafile.inputs)) {
  for (const dependency of metadata.imports) {
    if (dependency.external && builtins.has(dependency.path)) unsupported.push(`${file}: ${dependency.path}`);
  }
}
assert.deepEqual(unsupported, [], `Edge functions reference unsupported Node modules:\n${unsupported.join('\n')}`);
console.log('Edge dependency checks passed: qualification pack and workbook handlers contain no Node built-in imports.');
