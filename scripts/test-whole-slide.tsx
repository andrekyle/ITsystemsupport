import {createRoot} from "react-dom/client";
import {UnitPage} from "../src/pages/Course";
const tick=()=>new Promise(r=>setTimeout(r,60));
const assert=(v:unknown,m:string)=>{if(!v)throw new Error(m);};
const click=(text:string)=>{const b=Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(b=>b.textContent?.trim()===text);assert(b,`Missing ${text}`);b!.click();};
async function test(){
 createRoot(document.getElementById('fixture')!).render(<UnitPage unitId="8252" profile={{id:'test',name:'Test',role:'Super User'} as any} progress={{units:{}}} toggleActivity={()=>{}} saveQuizResult={()=>{}} setLogbookField={()=>{}} saveExerciseResult={()=>{}} navigate={()=>{}}/>);
 await tick();click('Lesson');await tick();click('Edit content');await tick();
 const editor=document.querySelector<HTMLElement>('.slide-whole-editor')!;
 assert(editor,'Whole slide editor exists');assert(!editor.querySelector('[contenteditable]'),'No nested editable fields');
 if(sessionStorage.getItem('whole-slide-reload')){
   assert(editor.textContent?.includes('Replacement across the whole slide'),'Replacement survives reload');
   sessionStorage.removeItem('whole-slide-reload');document.body.dataset.result='passed';document.getElementById('result')!.textContent='PASS: one slide editor, Ctrl+A covers title and paragraphs, full replacement, undo/redo, display mode and reload';return;
 }
 const original=editor.textContent;assert(editor.querySelectorAll('p').length>1,'Multiple paragraphs in one editor');
 editor.focus();editor.dispatchEvent(new KeyboardEvent('keydown',{key:'a',ctrlKey:true,bubbles:true}));
 assert(window.getSelection()?.toString().replace(/\s/g,'')===original?.replace(/\s/g,''),'Ctrl+A includes all slide text');
 document.dispatchEvent(new Event('selectionchange'));await tick();
 document.execCommand('insertText',false,'Replacement across the whole slide');await tick();
 assert(editor.textContent==='Replacement across the whole slide','Can replace entire selection');
 (document.querySelector('[aria-label="Undo"]') as HTMLButtonElement).click();await tick();
 assert(editor.textContent===original,'Undo restores all paragraphs and heading');
 (document.querySelector('[aria-label="Redo"]') as HTMLButtonElement).click();await tick();
 assert(editor.textContent==='Replacement across the whole slide','Redo restores replacement');
 click('Done editing');await tick();assert(document.querySelector('.slide-whole-editor')?.textContent?.includes('Replacement across the whole slide'),'Read-only shows saved replacement');
 sessionStorage.setItem('whole-slide-reload','1');location.reload();
}
test().catch(e=>{document.body.dataset.result='failed';document.getElementById('result')!.textContent=String(e);});
