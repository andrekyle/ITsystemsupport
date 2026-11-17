import { createRoot } from 'react-dom/client';
import { EvidenceRegisterPage } from '../src/pages/EvidenceRegister';
import { SKILLS_PORTFOLIO, portfolioReportHtml, validatePortfolioImport } from '../src/lib/skillsPortfolioContent';
import '../src/styles.css';
const tick = () => new Promise(resolve => setTimeout(resolve, 50));
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
async function until(check: () => boolean, message: string) { for (let i=0;i<120;i++) { if(check()) return; await tick(); } throw new Error(message); }
function button(text: string) { const found=[...document.querySelectorAll<HTMLButtonElement>('button')].find(button=>button.textContent?.trim()===text || button.getAttribute('aria-label')===text); assert(found, `Missing button ${text}`); return found; }
async function choose(label: string, option: string) {
  if (label.startsWith('Verification: ') && !document.querySelector(`button[aria-label="${label}"]`)) {
    document.querySelector<HTMLButtonElement>(`button[aria-label="Manage evidence: ${label.slice(14)}"]`)!.click();await tick();
  }
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
  button('Save changes').click();await until(()=>document.querySelector('[role="status"]')?.textContent==='All changes saved.','Saved changes acknowledged');
  await choose('Choose learner portfolio','Bob Example');
  await until(()=>!input('Training provider').disabled,'Second learner loads');
  assert(input('Training provider').value==='','One learner must never inherit another learner’s data');
  await choose('Choose learner portfolio','Alice Example');await until(()=>input('Training provider').value==='Actual training provider','Saved fields reload');
  await choose('Portfolio section','3. Learner administration');
  const identityRow = document.querySelector<HTMLTableRowElement>('.portfolio-data-table tbody tr')!;
  assert(identityRow.textContent?.includes('Actual-ID.pdf'),'Administration reuses the existing learner identity upload');
  assert(!identityRow.textContent?.includes('Verified'),'Reused documents do not inherit a verification decision');
  identityRow.querySelector<HTMLButtonElement>('button')!.click();await tick();
  button('Remove document').click();await tick();
  assert(!document.querySelector('[role="dialog"]'),'Removing the link closes Manage');
  assert(!document.querySelector('.portfolio-attachment-name'),'Removing a reused file suppresses automatic relinking');
  button('Save changes').click();await until(()=>document.querySelector('[role="status"]')?.textContent==='All changes saved.','Removed document saves');
  await choose('Choose learner portfolio','Bob Example');await tick();
  await choose('Choose learner portfolio','Alice Example');await tick();
  await until(()=>!document.querySelector('[aria-busy="true"]'),'Learner reloads after removal');
  assert(!document.querySelector('.portfolio-attachment-name'),'Removed link stays removed after reload');
  button('Use existing document').click();await tick();
  await choose('Existing uploaded document','Actual-ID.pdf');button('Link document').click();await tick();
  assert(document.querySelector('.portfolio-attachment-name'),'Original upload remains available to relink');
  button('Use existing document').click();await tick();
  await choose('Existing uploaded document','Actual-ID.pdf');button('Link document').click();await tick();
  assert(!document.querySelector('[role="dialog"]'),'Linking an existing upload closes the picker');
  assert(document.querySelectorAll('.portfolio-attachment-name').length===2,'Selected existing document is linked without uploading again');
  button('Save changes').click();await until(()=>document.querySelector('[role="status"]')?.textContent==='All changes saved.','Existing document link saves');
  await choose('Choose learner portfolio','Bob Example');await tick();
  await until(()=>!document.querySelector('[aria-busy="true"]'),'Second learner administration loads');
  assert(!document.body.textContent?.includes('Actual-ID.pdf'),'Existing document links are isolated per learner');
  await choose('Choose learner portfolio','Alice Example');await tick();
  await until(()=>document.querySelectorAll('.portfolio-attachment-name').length===2,'Existing link reloads for its learner');
  await choose('Portfolio section','Existing evidence checklist');
  assert(document.body.textContent?.includes('Actual-ID.pdf'),'Existing identity evidence stays available');
  button('Manage').click();await tick();button('Download').click();await tick();assert((globalThis as any).__downloaded,'Actual document download is wired');button('Done').click();await tick();
  await choose('Portfolio section','1. Learner overview');
  button('Upload evidence').click();await tick();
  const file=document.querySelector<HTMLInputElement>('input[type="file"]:not([accept])')!;
  const transfer=new DataTransfer();transfer.items.add(new File(['test'],'long original filename.pdf',{type:'application/pdf'}));file.files=transfer.files;file.dispatchEvent(new Event('change',{bubbles:true}));
  await until(()=>!!document.querySelector('button[aria-label^="Manage evidence:"]'),'Uploaded evidence becomes reviewable');
  await choose('Verification: Learner overview','Verified');
  assert(document.body.textContent?.includes('Verified by Real reviewer'),'Real reviewer and date are recorded');
  const note=document.querySelector<HTMLTextAreaElement>('[role="dialog"] textarea')!;await enter(note,'Reviewed supporting evidence');
  button('Done').click();await tick();
  assert(!document.querySelector('[role="dialog"]'),'Review details close without stretching the row');
  button('Manage').click();await tick();button('Replace evidence').click();await tick();
  const replacement=new DataTransfer();replacement.items.add(new File(['replacement'],'replacement.pdf',{type:'application/pdf'}));file.files=replacement.files;file.dispatchEvent(new Event('change',{bubbles:true}));
  await until(()=>document.querySelector('button[aria-label^="Verification:"]')?.textContent?.includes('Pending verification')??false,'Replacing an attachment clears stale verification');
  button('Done').click();await tick();
  await choose('Portfolio section','38. Final learner results');
  const resultsTable=document.querySelector<HTMLTableElement>('.portfolio-results-table')!;
  assert(resultsTable,'Final results must use the compact table layout');
  const firstRow=resultsTable.querySelector<HTMLTableRowElement>('tbody tr')!;
  assert(!firstRow.querySelector('textarea'),'Results and references must not use oversized text areas');
  assert(firstRow.querySelector('input[type="text"]'),'Assessment reference uses a compact input');
  assert(firstRow.getBoundingClientRect().height<95,'Empty evidence rows should remain compact');
  assert(firstRow.cells[0].getBoundingClientRect().width/resultsTable.getBoundingClientRect().width<0.16,'Unit-standard ID must not consume a third of the table');
  await choose('C / NYC / recognised, row 1','Competent (C)');
  button('Save changes').click();await until(()=>document.querySelector('[role="status"]')?.textContent==='All changes saved.','Decision saves');
  await choose('Portfolio section','41. Skills Development verification pack');
  const before=document.querySelectorAll('tbody tr').length;button('+ Add row').click();await tick();assert(document.querySelectorAll('tbody tr').length===before+1,'Add row is wired');
  const cell=document.querySelector<HTMLInputElement | HTMLTextAreaElement>('tbody tr:last-child input[type="text"], tbody tr:last-child textarea')!;await enter(cell,'Actual evidence reference');
  button('Save changes').click();await until(()=>document.querySelector('[role="status"]')?.textContent==='All changes saved.','Rows and uploads save');
  await choose('Portfolio section','50. Absorption and all learner tracker');
  button('Upload evidence').click();await tick();
  const employmentFile=new DataTransfer();employmentFile.items.add(new File(['employment'],'employment.pdf',{type:'application/pdf'}));file.files=employmentFile.files;file.dispatchEvent(new Event('change',{bubbles:true}));
  await until(()=>!!document.querySelector('button[aria-label="Manage evidence: Post learnership employment"]'),'Employment attachment uploaded');
  await choose('Verification: Post learnership employment','Verified');
  button('Done').click();await tick();
  const employmentRow=document.querySelector<HTMLTableRowElement>('.portfolio-fields .portfolio-table tbody tr')!;
  assert(employmentRow.getBoundingClientRect().height<150,'A verified attachment must not create a tall empty row');
  assert(!employmentRow.querySelector('textarea[aria-label^="Verification notes"]'),'Reviewer notes belong outside the table row');
  assert(employmentRow.querySelectorAll('button').length===1,'Uploaded evidence should expose just one Manage action in the row');
  assert(!employmentRow.querySelector('[aria-haspopup="listbox"]'),'Verification controls stay in Manage, not the table');
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
