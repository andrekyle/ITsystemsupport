import { createRoot } from 'react-dom/client';
import { Select } from '../src/components/Select';
const tick=()=>new Promise(r=>setTimeout(r,40));
function assert(value:unknown,message:string):asserts value {if(!value)throw Error(message)}
async function test(){
 const options=Array.from({length:80},(_,i)=>({value:String(i),label:`Qualification ${i+1}`,hint:'Module and unit standards'}));
 createRoot(document.getElementById('fixture')!).render(<Select value="65" options={options} onChange={value=>document.body.dataset.selected=value} ariaLabel="Qualification"/>);
 await tick();
 const button=document.querySelector<HTMLButtonElement>('.nice-select-btn')!;
 button.click();await tick();
 const panel=document.querySelector<HTMLElement>('[role=listbox]')!;
 assert(panel.scrollHeight>panel.clientHeight,'Long list is scrollable');
 assert(panel.scrollTop>0,'Selected option is visible when opening');
 panel.scrollTop=250;await tick();
 // Moving the pointer as items pass beneath it must not reveal an offscreen item.
 panel.querySelector('[data-idx="65"]')!.dispatchEvent(new PointerEvent('pointermove',{bubbles:true}));await tick();
 assert(Math.abs(panel.scrollTop-250)<2,'Pointer hover does not pull the list back down');
 panel.scrollTop=0;await tick();
 panel.querySelector('[data-idx="64"]')!.dispatchEvent(new PointerEvent('pointermove',{bubbles:true}));await tick();
 assert(panel.scrollTop===0,'User can scroll back to the first option');
 assert(window.scrollY===0,'Opening dropdown never scrolls the page');
 for(const theme of ['light','dark']){
   document.documentElement.dataset.theme=theme;await tick();
   const option=panel.querySelector<HTMLElement>('[role=option]')!;
   for(const property of ['fontFamily','fontSize','lineHeight','letterSpacing'] as const){
     assert(getComputedStyle(button)[property]===getComputedStyle(option)[property],`${theme}: option and trigger share ${property}`);
   }
   assert(getComputedStyle(panel).backgroundColor!=='rgba(0, 0, 0, 0)',`${theme}: themed popup surface`);
 }
 button.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));await tick();
 assert(panel.scrollTop>250,'Keyboard End scrolls to the last item');
 button.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));await tick();
 assert(panel.scrollTop<10,'Keyboard Home scrolls back to the first item');
 button.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await tick();
 assert(document.body.dataset.selected==='0','Keyboard selection still works');
 assert(!document.querySelector('[role=listbox]'),'Selection closes the dropdown');
 document.body.dataset.result='passed';document.getElementById('result')!.textContent='PASS: upward scrolling, pointer hover, keyboard navigation, page scroll stability, and matching dropdown typography in light/dark themes.';
}
test().catch(error=>{document.body.dataset.result='failed';document.getElementById('result')!.textContent=String(error)});
