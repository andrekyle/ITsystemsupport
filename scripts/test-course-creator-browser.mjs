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
let calls=0;let covers=0;let fail=true;const originalFetch=window.fetch;
window.fetch=async(url,options)=>{
 if(String(url).startsWith('data:'))return originalFetch(url);
 if(url==='/api/cover-image'){covers++;if(covers===2)return Response.json({error:'Cover service unavailable'},{status:502});return Response.json({image:'data:image/jpeg;base64,/9j/2Q=='})}
 assert(url==='/api/qualification-pack','Read selected pack rather than external SAQA metadata');calls++;
 assert(JSON.parse(options.body).packId==='pack-1','Selected existing pack sent');
 if(fail)return Response.json({error:'Try reading again'},{status:502});
 return Response.json({draft:{qualification:{title:'Management',saqaId:'12345',nqfLevel:5,credits:10,description:'Management qualification'},modules:[{name:'Team development',description:'Team skills',outcomes:['Lead teams'],units:[{us:'123',title:'Teamwork',nqf:5,credits:10,description:'Work in teams',outcomes:['Support a team']}]}],issues:['Review module grouping']}});
};
(async()=>{try{
 let closed=false;createRoot(document.getElementById('root')).render(<CourseCreator onClose={()=>closed=true}/>);
 await until(()=>document.querySelector('select'));
 assert(!document.querySelector('input[type=file]'),'Select existing uploaded packs');
 const select=document.querySelector('select');select.value='pack-1';select.dispatchEvent(new Event('change',{bubbles:true}));await tick();
 document.querySelector('.modal-overlay').click();window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));assert(!closed,'Explicit dismissal only');
 click('Read qualification pack');await until(()=>document.querySelector('[role=alert]'));assert(select.value==='pack-1','Read failure preserves pack selection');
 fail=false;click('Read qualification pack');await until(()=>document.querySelector('[aria-label="Qualification pack review"]'));
 assert(document.body.textContent.includes('Team development'),'Extracted modules shown');assert(document.body.textContent.includes('123: Teamwork'),'Unit mapped to module');assert(document.body.textContent.includes('Review module grouping'),'Review warnings shown');assert(!localStorage.length,'Review does not save');
 input('Module 1: name','Reviewed module');await tick();click('Create course and tiles');await until(()=>document.querySelector('[role=alert]'));assert(!window.savedCourse,'No save on partial cover failure');click('Retry save');await until(()=>window.savedCourse);
 assert(window.savedCourse.modules[0].name==='Reviewed module','Review edits saved');assert(window.savedCourse.sourcePack.id==='pack-1','Source pack preserved');assert(window.savedCourse.modules[0].units[0].imageIncludesText,'Unit artwork saved');assert(covers===3,'Retry keeps completed cover');assert(calls===2,'Save does not re-read pack');
 document.body.dataset.result='passed';document.getElementById('result').textContent='PASS: uploaded pack selection, extraction review, correction, images, retry and source tracking.';
}catch(e){document.body.dataset.result='failed';document.getElementById('result').textContent=e.stack}})();`;

const mocks = {
  'src/store.ts': 'export function useOnboardingPacks(){return{packs:[{id:"pack-1",name:"Management pack",files:[{name:"outline.pdf"}]}]}};',
  'src/lib/supabase.ts': 'export const supabase={auth:{async getSession(){return{data:{session:{access_token:"test"}}}}},storage:{from(){return{async upload(){return{error:null}},getPublicUrl(path){return{data:{publicUrl:"https://example.invalid/"+path}}}}}}};',
  'src/lib/tenant.ts': 'export const TENANT_ID="test";',
  'src/lib/sync.ts': 'export async function flushKey(){}',
  'src/lib/tokens.ts': 'export const loadContentModel=()=>"gpt-4.1-mini";',
  'src/data/courses/index.ts': 'export const courseStorageKey=id=>id;export const createCourse=(details,modules)=>({id:"custom-test",meta:details,modules});export function saveCustomCourse(course){window.savedCourse=course;localStorage.setItem(course.id,JSON.stringify(course))}export function setActiveCourse(){}',
};
await build({ stdin: { contents: entry, resolveDir: resolve('.'), sourcefile: 'course-creator-test.tsx', loader: 'tsx' }, bundle: true, outfile: join(dir, 'test.js'), jsx: 'automatic', plugins: [{ name: 'mocks', setup(b) { b.onLoad({ filter: /\.[tj]sx?$/ }, args => { const key = args.path.replaceAll('\\', '/').slice(resolve('.').replaceAll('\\', '/').length + 1); return mocks[key] ? { contents: mocks[key], loader: 'tsx' } : undefined; }); } }] });
writeFileSync(join(dir, 'index.html'), '<!doctype html><html><body><div id="root"></div><pre id="result"></pre><script src="test.js"></script></body></html>');
await runBrowserTest(dir, { width: 1200, height: 900 });
