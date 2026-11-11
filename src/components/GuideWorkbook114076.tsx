import { useEffect, useRef, useState } from "react";
import { DocumentActions } from "./DocumentActions";
import { WorkbookCover } from "./WorkbookCover";
import "./guide-workbook-114076.css";

type Item = { id:number; text:string; x:number; y:number; bold:boolean };
type Cell = { colSpan:number; items:Item[]; blue:boolean };
type Table = { top:number; bottom:number; columns:number[]; rows:Cell[][] };
type Page = { number:number; items:Item[]; tables:Table[]; panels:{top:number;bottom:number}[] };
type Props = {values:Record<string,string|boolean>;onChange:(key:string,value:string|boolean)=>void;onSave:()=>Promise<void>};

function lines(items:Item[]) {
  const result:Item[][]=[];
  for(const item of [...items].sort((a,b)=>Math.abs(a.y-b.y)<.3?a.x-b.x:a.y-b.y)) {
    const last=result[result.length-1];
    if(last&&Math.abs(last[0].y-item.y)<.3)last.push(item);else result.push([item]);
  }
  return result.map(line=>({y:line[0].y,bold:line.every(item=>item.bold),text:line.map((item,i)=>`${i&&!(/\d$/.test(line[i-1].text)&&/^\d/.test(item.text))?" ":""}${item.text}`).join("").replace(/\s+/g," ").trim()}));
}
function Copy({items,cell=false}:{items:Item[];cell?:boolean}) {
  const blocks:{kind:string;text:string}[]=[];let previousY=-100;
  for(const line of lines(items)) {
    const kind=line.bold&&line.text.length<180?"heading":/^[•\uF0B7\uF0A7]/.test(line.text)?"bullet":"paragraph";
    const last=blocks[blocks.length-1];
    if(kind==="paragraph"&&last?.kind==="paragraph"&&line.y-previousY<3)last.text+=` ${line.text}`;
    else blocks.push({kind,text:line.text});
    previousY=line.y;
  }
  return <>{blocks.map((block,i)=>block.kind==="heading"?cell?<p key={i}><strong>{block.text}</strong></p>:<h3 key={i}>{block.text}</h3>:block.kind==="bullet"?<ul key={i}><li>{block.text.replace(/^[•\uF0B7\uF0A7]\s*/,"")}</li></ul>:<p key={i}>{block.text}</p>)}</>;
}

export function GuideWorkbook114076({values,onChange,onSave}:Props) {
  const [pages,setPages]=useState<Page[]>([]);
  const [error,setError]=useState("");
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const controller=new AbortController();
    fetch("/learner-guide-114076/workbook-pages.json",{signal:controller.signal}).then(response=>{if(!response.ok)throw new Error();return response.json();}).then((data:{pages:Page[]})=>{if(data.pages.length!==27)throw new Error();setPages(data.pages);}).catch(reason=>{if(reason?.name!=="AbortError")setError("The learner guide could not be opened.");});
    return ()=>controller.abort();
  },[]);
  const field=(id:string,label:string)=><input aria-label={label} type={/date/i.test(label)?"date":"text"} value={String(values[`learner-guide-114076.${id}`]??"")} onChange={event=>onChange(`learner-guide-114076.${id}`,event.target.value)}/>;
  const download=async()=>{
    if(!ref.current)return;
    const clone=ref.current.cloneNode(true) as HTMLElement;
    clone.querySelectorAll<HTMLInputElement>("input").forEach(input=>input.setAttribute("value",input.value));
    clone.querySelectorAll<HTMLTextAreaElement>("textarea").forEach(input=>{input.textContent=input.value;});
    // Embed the workbook logo so the downloaded guide works offline.
    for(const image of clone.querySelectorAll<HTMLImageElement>("img")) {
      const blob=await (await fetch(image.src)).blob();
      image.src=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob);});
    }
    let css="";for(const sheet of Array.from(document.styleSheets)){try{css+=Array.from(sheet.cssRules).map(rule=>rule.cssText).join("\n");}catch{/* Optional external fonts. */}}
    const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>114076 Learner Guide</title><style>${css}</style></head><body>${clone.outerHTML}</body></html>`;
    const url=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));const anchor=document.createElement("a");anchor.href=url;anchor.download="SAQA-114076-Learner-Guide.html";anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  if(error)return <div className="callout" role="alert">{error}</div>;
  if(!pages.length)return <div className="learner-guide-loading">Opening the Learner Guide…</div>;
  return <>
    <div className="lw-workbook-actions no-print"><div className="lw-workbook-actions-copy"><strong>Learner Guide</strong><span>Unit standard 114076</span></div><div className="lw-workbook-actions-controls"><DocumentActions name="Unit 114076 Learner Guide" onSave={onSave}/><button className="btn ghost sm" onClick={()=>void download()}>Download learner guide</button></div></div>
    <div ref={ref} className="lw-document lw-template-114076 guide-workbook-114076 document-print-target">
      <WorkbookCover number={1} sourcePage label="LEARNER GUIDE" title="USE COMPUTER TECHNOLOGY TO RESEARCH A COMPUTER TOPIC" metadata={["UNIT STANDARD 114076","NQF LEVEL: 4","CREDITS: 3","NOTIONAL HOURS: 30"]}>
        <table className="lw-table lw-cover-table"><thead><tr><th colSpan={2}>LEARNER INFORMATION</th></tr></thead><tbody>{[["name","Name"],["surname","Surname"],["id-number","ID Number"],["contact","Contact"]].map(([id,label])=><tr key={id}><th>{label}</th><td>{field(`cover-${id}`,label)}</td></tr>)}</tbody></table>
      </WorkbookCover>
      {pages.slice(1).map(page=>{
        const blocks:({y:number;kind:"table";table:Table;index:number}|{y:number;kind:"text";items:Item[];blue:boolean})[]=page.tables.map((table,index)=>({y:table.top,kind:"table",table,index}));
        const groups=new Map<string,{y:number;kind:"text";items:Item[];blue:boolean}>();
        const noteLines=page.items.filter(item=>/^[_ .]{8,}$/.test(item.text.trim()));
        for(const item of page.items.filter(item=>!noteLines.includes(item))){const position=page.tables.filter(table=>table.bottom<item.y).length;const panel=page.panels.findIndex(panel=>item.y>=panel.top-.4&&item.y<=panel.bottom+.4);const key=`${position}-${panel}`;if(!groups.has(key))groups.set(key,{y:item.y,kind:"text",items:[],blue:panel>=0});groups.get(key)!.items.push(item);}
        blocks.push(...groups.values());blocks.sort((a,b)=>a.y-b.y);
        return <section key={page.number} className="lw-page guide-workbook-page" data-page={page.number} data-source-page={page.number}>
          {blocks.map((block,index)=>block.kind==="text"?<div key={index} className={block.blue?"lw-outcome-head guide-source-panel":"guide-source-copy"}><Copy items={block.items}/></div>:<table className="lw-table guide-source-table" key={index}><colgroup>{block.table.columns.map((width,c)=><col key={c} style={{width:`${width}%`}}/>)}</colgroup><tbody>{block.table.rows.map((row,r)=><tr key={r}>{row.map((cell,c)=><td key={c} colSpan={cell.colSpan} className={cell.blue?"guide-cell-blue":undefined}>{cell.items.length?<Copy items={cell.items} cell/>:page.number<=5?field(`page-${page.number}-table-${block.index}-row-${r}-cell-${c}`,`Page ${page.number}, row ${r+1}, column ${c+1}`):null}</td>)}</tr>)}</tbody></table>)}
          {noteLines.length>0&&<div className="lw-lines"><textarea aria-label={`Page ${page.number} notes`} rows={Math.max(5,noteLines.length)} value={String(values[`learner-guide-114076.page-${page.number}-notes`]??"")} onChange={event=>onChange(`learner-guide-114076.page-${page.number}-notes`,event.target.value)}/></div>}
        </section>;
      })}
    </div>
  </>;
}
