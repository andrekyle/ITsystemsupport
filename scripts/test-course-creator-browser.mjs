import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { runBrowserTest } from './browser-test-runner.mjs';

const dir = mkdtempSync(join(tmpdir(), 'course-creator-'));
const entry = `
import {createRoot} from 'react-dom/client';
import {CourseCreator} from './src/components/CourseCreator';
const tick=()=>new Promise(r=>setTimeout(r,25));
const until=async f=>{for(let i=0;i<150;i++){if(f())return;await tick()}throw Error('Timed out: '+document.body.textContent)};
const assert=(v,m)=>{if(!v)throw Error(m)};
function input(label,value){const el=[...document.querySelectorAll('label')].find(el=>el.querySelector('span')?.textContent===label).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));}
function click(label){[...document.querySelectorAll('button')].find(el=>el.textContent===label).click()}
let calls=0;let covers=0;let fail=true;let requested;const originalFetch=window.fetch;
window.fetch=async(url,options)=>{if(String(url).startsWith('data:'))return originalFetch(url);if(url==='/api/cover-image'){covers++;if(covers===3)return Response.json({error:'Cover service unavailable'},{status:502});return Response.json({image:'data:image/jpeg;base64,/9j/2Q=='})}calls++;requested=JSON.parse(options.body);if(fail)return Response.json({error:'Try generation again'},{status:502});return Response.json({modules:requested.unitCounts.map((count,m)=>({name:'Generated module '+(m+1),description:'Module summary',outcomes:['Module outcome'],units:Array.from({length:count},(_,u)=>({us:''+(m+1)+(u+1),title:'Generated unit '+(m+1)+'.'+(u+1),nqf:5,credits:3,description:'Unit summary',outcomes:['Unit outcome']}))}))})};
(async()=>{try{
let closed=false;createRoot(document.getElementById('root')).render(<CourseCreator onClose={()=>closed=true}/>);
await until(()=>document.querySelector('label'));
input('Course name','Example course');input('SAQA ID','12345');input('Number of modules','2');await tick();
input('Module 1: number of unit standards','2');input('Module 2: number of unit standards','1');await tick();
document.querySelector('.modal-overlay').click();window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));assert(!closed,'Outside clicks and Escape preserve the draft');
click('Generate course metadata');await until(()=>document.querySelector('[role=alert]'));assert(document.querySelector('input').value==='Example course','Failed generation preserves input');
fail=false;click('Generate course metadata');await until(()=>document.querySelector('[aria-label="Generated course metadata"]'));
assert(JSON.stringify(requested.unitCounts)==='[2,1]','Requested module structure');assert(document.body.textContent.includes('Generated unit 2.1'),'Preview every module');
assert(!localStorage.length,'Generation does not save a course');
click('Create course');await until(()=>document.querySelector('[role=alert]'));assert(!window.savedCourse,'A partial cover failure does not save the course');click('Retry save');await until(()=>window.savedCourse);assert(window.savedCourse.modules.length===2,'Save generated modules');assert(window.savedCourse.modules[0].units.length===2,'Save requested units');assert(calls===2,'Saving does not regenerate metadata');assert(covers===6,'Retry resumes missing covers without regenerating completed ones');assert(window.savedCourse.modules[0].image,'Module cover saved');assert(window.savedCourse.modules[0].units[0].imageIncludesText,'Unit cover avoids duplicate title overlay');
document.body.dataset.result='passed';document.getElementById('result').textContent='PASS: module counts, generation failure recovery, metadata preview, explicit dismissal and course save.';
}catch(e){document.body.dataset.result='failed';document.getElementById('result').textContent=e.stack}})();`;
const mocks = {
  'src/lib/supabase.ts': 'export const supabase={auth:{async getSession(){return{data:{session:{access_token:"test"}}}}},storage:{from(){return{async upload(){return{error:null}},getPublicUrl(path){return{data:{publicUrl:"https://example.invalid/"+path}}}}}}};',
  'src/lib/tenant.ts': 'export const TENANT_ID="test";',
  'src/lib/sync.ts': 'export async function flushKey(){}',
  'src/lib/tokens.ts': 'export const loadContentModel=()=>"gpt-4.1-mini";',
  'src/data/courses/index.ts': 'export const courseStorageKey=id=>id;export const createCourse=(details,modules)=>({id:"custom-test",meta:details,modules});export function saveCustomCourse(course){window.savedCourse=course;localStorage.setItem(course.id,JSON.stringify(course))}export function setActiveCourse(){}',
};
await build({ stdin: { contents: entry, resolveDir: resolve('.'), sourcefile: 'course-creator-test.tsx', loader: 'tsx' }, bundle: true, outfile: join(dir, 'test.js'), jsx: 'automatic', plugins: [{ name: 'mocks', setup(b) { b.onLoad({ filter: /\.[tj]sx?$/ }, args => { const key = args.path.replaceAll('\\', '/').slice(resolve('.').replaceAll('\\', '/').length + 1); return mocks[key] ? { contents: mocks[key], loader: 'tsx' } : undefined; }); } }] });
writeFileSync(join(dir, 'index.html'), '<!doctype html><html><body><div id="root"></div><pre id="result"></pre><script src="test.js"></script></body></html>');
await runBrowserTest(dir, { width: 1200, height: 900 });
