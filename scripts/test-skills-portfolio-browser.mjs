import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runBrowserTest } from './browser-test-runner.mjs';
const dir = mkdtempSync(join(tmpdir(), 'skills-portfolio-'));
const mocks = {
  'src/store.ts': `const profiles=[{id:'alice',name:'Alice Example',role:'Learner',createdAt:'2026-01-01',enrolment:{email:'alice@example.test',idNumber:'actual-id'}},{id:'bob',name:'Bob Example',role:'Learner',createdAt:'2026-01-01'}];const docs={alice:{'id-copy':{name:'Actual-ID.pdf',type:'application/pdf',size:10,path:'private/id.pdf',uploadedAt:'2026-01-01'}},bob:{}};export const loadProfiles=()=>profiles;export const loadProgress=()=>({units:{}});export const usePoe=id=>({docs:docs[id]||{},saveDoc:(key,doc)=>{(docs[id]??={})[key]=doc;return true}});`,
  'src/lib/directory.ts': `export const fetchCloudLearnerData=async()=>({profiles:[],poe:{},owners:{},progress:{},checklists:{}});export const cloudProfileIds=p=>new Set([p.id]);export const remoteOnlyProfiles=()=>[];export const mergeProfileWithCloud=p=>p;`,
  'src/lib/tenant.ts': `export const TENANT_ID='test';`,
  'src/lib/useSavedLessonQuizzes.ts': `export const useSavedLessonQuizzes=()=>({lessons:{},loading:false,error:''});`,
  'src/lib/files.ts': `export const userPrefix=async()=>'test/admin';export const uploadFile=async(prefix,file,progress)=>{progress(100);return {name:file.name,type:file.type,size:file.size,path:prefix+'/'+Date.now(),uploadedAt:new Date().toISOString()}};export const downloadDoc=async doc=>{globalThis.__downloaded=doc.name};`,
  'src/icons.tsx': `export const Icon=()=>null;`,
  'src/lib/supabase.ts': `globalThis.__rows??=new Map();export const supabase={auth:{getUser:async()=>({data:{user:{id:'admin-auth'}}})},from(){return {select(){return this},eq(){return this},like(_key,prefix){this.prefix=prefix.slice(0,-1);return this},order(){return this},range(){return this},async abortSignal(){return {data:[...globalThis.__rows.values()].filter(row=>row.key.startsWith(this.prefix)),error:null}},async upsert(rows){if(globalThis.__failSave){globalThis.__failSave=false;return {error:{message:'offline'}}}for(const row of rows)globalThis.__rows.set(row.user_id+row.key,row);return {error:null}}}}};`,
};
await build({ entryPoints: [resolve('scripts/test-skills-portfolio-browser.tsx')], bundle: true, outfile: join(dir, 'test.js'), jsx: 'automatic', define: { 'import.meta.env': '{}' },
  plugins: [{ name: 'isolated-platform', setup(builder) { builder.onResolve({filter:/^\//},args=>({path:args.path,external:true})); builder.onLoad({ filter: /\.[tj]sx?$/ }, args => {
    const key = args.path.replaceAll('\\','/').slice(resolve('.').replaceAll('\\','/').length + 1);
    return mocks[key] ? { contents: mocks[key], loader: 'tsx' } : undefined;
  }); } }],
});
writeFileSync(join(dir, 'index.html'), '<!doctype html><html data-theme="dark"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="test.css"><body><div id="fixture"></div><pre id="result">Running</pre><script src="test.js"></script></body></html>');
for (const width of [1400, 390]) await runBrowserTest(dir, { width, height: 1000 });
