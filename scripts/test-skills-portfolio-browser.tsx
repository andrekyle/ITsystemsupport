import { createRoot } from 'react-dom/client';
import { EvidenceRegisterPage } from '../src/pages/EvidenceRegister';
import { SKILLS_PORTFOLIO, portfolioReportHtml, validatePortfolioImport } from '../src/lib/skillsPortfolioContent';
import '../src/styles.css';
const tick = () => new Promise(resolve => setTimeout(resolve, 50));
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
async function until(check: () => boolean, message: string) { for (let i=0;i<120;i++) { if(check()) return; await tick(); } throw new Error(message); }
function button(text: string) { const found=[...document.querySelectorAll<HTMLButtonElement>('button')].find(button=>button.textContent?.trim()===text); assert(found, `Missing button ${text}`); return found; }
async function choose(label: string, option: string) {
  const trigger=document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`); assert(trigger, `Missing select ${label}`);trigger.click(); await tick();
  const item=[...document.querySelectorAll<HTMLElement>('[role="option"]')].find(item=>item.textContent?.trim().includes(option));assert(item,`Missing option ${option}`);item.click();await tick();
}
function input(label: string) { const target=[...document.querySelectorAll<HTMLLabelElement>('label.portfolio-field')].find(el=>el.firstChild?.textContent===label)?.querySelector<HTMLInputElement>('input');assert(target, `Missing input ${label}`);return target; }
async function enter(target: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype=target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype,'value')!.set!.call(target,value);target.dispatchEvent(new Event('input',{bubbles:true}));await tick();
}
async function test() {
  localStorage.clear();
  assert(SKILLS_PORTFOLIO.length===50,'All 50 sections must be present');
  assert(!JSON.stringify(SKILLS_PORTFOLIO).includes('Thabo Mokoena'),'Fictional learner must not be seeded');
  const root=createRoot(document.getElementById('fixture')!);
  root.render(<EvidenceRegisterPage profile={{id:'admin',name:'Real reviewer',role:'Admin',createdAt:'2026-01-01'}}/>);
  await until(()=>!!document.querySelector('.portfolio-content input:not(:disabled)'), 'Portfolio loads');
  assert(input('Learner full name').value==='Alice Example','Actual learner details are populated');
  await enter(input('Training provider'),'Actual training provider');
  (globalThis as any).__failSave=true;button('Save changes').click();
  await until(()=>!!document.querySelector('[role="alert"]'),'Save failure must be visible');
  assert(document.body.textContent?.includes('draft is retained'),'Failed saves retain drafts');
  button('Retry').click();await until(()=>!input('Training provider').disabled,'Retry loads safely');
  assert(input('Training provider').value==='Actual training provider','Draft survives retry');
  button('Save changes').click();await until(()=>button('Save changes').disabled,'Saved changes acknowledged');
  await choose('Choose learner portfolio','Bob Example');
  await until(()=>!input('Training provider').disabled,'Second learner loads');
  assert(input('Training provider').value==='','One learner must never inherit another learner’s data');
  await choose('Choose learner portfolio','Alice Example');await until(()=>input('Training provider').value==='Actual training provider','Saved fields reload');
  await choose('Portfolio section','Existing evidence checklist');
  assert(document.body.textContent?.includes('Actual-ID.pdf'),'Existing identity evidence stays available');
  button('Download').click();await tick();assert((globalThis as any).__downloaded,'Actual document download is wired');
  await choose('Portfolio section','1. Learner overview');
  button('Upload evidence').click();await tick();
  const file=document.querySelector<HTMLInputElement>('input[type="file"]:not([accept])')!;
  const transfer=new DataTransfer();transfer.items.add(new File(['test'],'long original filename.pdf',{type:'application/pdf'}));file.files=transfer.files;file.dispatchEvent(new Event('change',{bubbles:true}));
  await until(()=>!!document.querySelector('button[aria-label^="Verification:"]'),'Uploaded evidence becomes reviewable');
  await choose('Verification: Learner overview','Verified');
  assert(document.body.textContent?.includes('Verified by Real reviewer'),'Real reviewer and date are recorded');
  button('Replace evidence').click();await tick();
  const replacement=new DataTransfer();replacement.items.add(new File(['replacement'],'replacement.pdf',{type:'application/pdf'}));file.files=replacement.files;file.dispatchEvent(new Event('change',{bubbles:true}));
  await until(()=>document.querySelector('button[aria-label^="Verification:"]')?.textContent?.includes('Pending verification')??false,'Replacing an attachment clears stale verification');
  await choose('Portfolio section','41. Skills Development verification pack');
  const before=document.querySelectorAll('tbody tr').length;button('+ Add row').click();await tick();assert(document.querySelectorAll('tbody tr').length===before+1,'Add row is wired');
  const cell=document.querySelector<HTMLTextAreaElement>('tbody tr:last-child textarea')!;await enter(cell,'Actual evidence reference');
  button('Save changes').click();await until(()=>button('Save changes').disabled,'Rows and uploads save');
  const html=portfolioReportHtml({id:'alice',name:'<script>bad</script>',role:'Learner',createdAt:''},{f7:'<img src=x onerror=bad>'});
  assert(!html.includes('<script>bad'),'Export escapes user input');
  assert(html.includes('Skills Development verification pack'),'Export includes all sections');
  let rejected=false;try{validatePortfolioImport({format:'itss-skills-portfolio-v1',learnerId:'bob',values:{f7:'Wrong learner'}},'alice')}catch{rejected=true}assert(rejected,'Imports reject another learner’s export');
  assert(!('doc.section-1.supporting' in validatePortfolioImport({format:'itss-skills-portfolio-v1',learnerId:'alice',values:{'doc.section-1.supporting':{doc:{path:'foreign/file'},status:'Verified'}}},'alice')),'Imports cannot fabricate verified attachments');
  assert(document.documentElement.scrollWidth<=window.innerWidth+2,'Register must fit desktop and mobile widths');
  root.render(<EvidenceRegisterPage profile={{id:'learner',name:'Learner',role:'Learner',createdAt:''}}/>);await tick();assert(document.body.textContent?.includes('Administrator access required'),'Learners cannot administer the portfolio');
  document.body.dataset.result='passed';document.getElementById('result')!.textContent=`PASS ${innerWidth}px: 50 sections, real profile defaults, save/reload, failure recovery, learner isolation, legacy downloads, upload/replacement verification, added rows, export escaping, safe imports and admin access.`;
}
test().catch(error=>{document.body.dataset.result='failed';document.getElementById('result')!.textContent=String(error);});
