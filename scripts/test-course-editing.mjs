import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir = mkdtempSync(join(tmpdir(), 'course-editing-'));
const output = join(dir, 'test.mjs');
await build({entryPoints:[resolve('scripts/test-course-editing.ts')], bundle:true, platform:'node', format:'esm', outfile:output, define:{'import.meta.env':'{}'}});
await import(pathToFileURL(output).href);
