import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {runBrowserTest} from './browser-test-runner.mjs';
const preview=process.argv.includes('--provider-preview');
const dir=mkdtempSync(join(tmpdir(),'client-portal-'));
const entry=`
import React from 'react';import{createRoot}from'react-dom/client';import{ClientPortal}from'./src/pages/ClientPortal';
const tick=()=>new Promise(r=>setTimeout(r,50));
const until=async f=>{for(let i=0;i<100;i++){if(f())return;await tick()}throw Error('Timed out')};
function input(id,value){const el=document.querySelector(id);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));}
function assert(v,m){if(!v)throw Error(m)}
(async()=>{try{
createRoot(document.getElementById('root')).render(<ClientPortal/>);
await until(()=>document.querySelector('input[type=email]'));
assert(document.body.textContent.includes('Sign in to Investec'),'Client branded login');
assert(!document.body.textContent.includes('Create account'),'No public signup');
input('input[type=email]','client@example.test');input('#client-password','client-password');await tick();document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
await until(()=>document.body.textContent.includes('Alice Example'));
assert(!document.body.textContent.includes('Bob Other Tenant'),'No other client cohort');
assert(document.body.textContent.includes('Published report'),'Published document');
${preview ? "assert(document.body.textContent.includes('Provider preview'),'Provider preview label'); assert(document.body.textContent.includes('Manage client access'),'Provider management link');" : ''}
assert(document.querySelectorAll('.client-brand img').length===1,'Exactly one client logo');
assert(document.querySelector('.client-compliance'),'B-BBEE compliance section');
assert(!document.querySelector('input[type=file]'),'Client cannot upload');
assert(!document.body.textContent.includes('Edit learner'),'No edit controls');
const category=[...document.querySelectorAll('.client-filters button')].find(b=>b.textContent==='Registers');category.click();await tick();assert(document.body.textContent.includes('No published documents match'),'Category filter');
document.querySelector('.client-header button').click();await until(()=>document.querySelector('input[type=email]'));
assert(!document.body.textContent.includes('Alice Example'),'Sign out clears client data');
document.body.dataset.result='passed';document.getElementById('result').textContent='PASS: branded client login, read-only cohort, published documents, filtering and sign-out data clearing.';
}catch(e){document.body.dataset.result='failed';document.getElementById('result').textContent=e.stack}})();`;
const mocks={
 'src/lib/supabase.ts':`let listener;let session=null;const identity={user:{id:'client-user',email:'client@example.test'}};export const supabase={auth:{onAuthStateChange(fn){listener=fn;return{data:{subscription:{unsubscribe(){}}}}},async getSession(){return{data:{session}}},async signInWithPassword(){session=identity;listener('SIGNED_IN',session);return{error:null}},async signOut(){session=null;listener('SIGNED_OUT',null);return{error:null}}},from(table){const chain={select(){return chain},eq(){return chain},order(){return chain},async maybeSingle(){return{data:{user_id:'client-user',display_name:'Client Viewer',tenant_id:'investec',enabled:true}}},then(resolve){resolve({data:table==='client_portal_learners'?[{learner_ref:'alice',name:'Alice Example',programme:'IT Systems Support',status:'Enrolled',start_date:'2026-07-17',end_date:'2027-07-30'}]:[{id:'doc',title:'Published report',category:'Reports',filename:'report.pdf',file_size:100,storage_path:'investec/report.pdf',published:true}]})}};return chain}};`,
 'src/lib/tenant.ts':`export const TENANT={id:'investec',name:'Investec',logo:null};export const TENANT_ID='investec';`,
 'src/icons.tsx':`export const Icon=()=>null;`,
};
if(preview) { mocks['src/lib/supabase.ts']=mocks['src/lib/supabase.ts'].replace("data:{user_id:'client-user',display_name:'Client Viewer',tenant_id:'investec',enabled:true}",'data:null').replace('from(table){',"async rpc(name){return{data:name==='is_admin'?true:name==='current_tenant'?'investec':false,error:null}},from(table){"); }
await build({stdin:{contents:entry,resolveDir:resolve('.'),sourcefile:'client-portal-test.tsx',loader:'tsx'},bundle:true,outfile:join(dir,'test.js'),jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'mocks',setup(b){b.onLoad({filter:/\.[tj]sx?$/},args=>{const key=args.path.replaceAll('\\','/').slice(resolve('.').replaceAll('\\','/').length+1);return mocks[key]?{contents:mocks[key],loader:'tsx'}:undefined})}}]});
writeFileSync(join(dir,'index.html'),'<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="test.css"></head><body><div id="root"></div><pre id="result"></pre><script src="test.js"></script></body></html>');
await runBrowserTest(dir,{width:1400,height:1000});
await runBrowserTest(dir,{width:390,height:1000});
