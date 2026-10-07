import { useEffect, useState } from "react";
import { Icon } from "../icons";

type SavedValues = Record<string, string | boolean>;
type SaveField = (key: string, value: string | boolean) => void;
type LayoutItem = { id: number; text: string; x: number; y: number; w: number; h: number; size: number; font: string; bold: boolean; italic: boolean; color: string };
type LayoutPage = { width: number; height: number; items: LayoutItem[] };

const PAGE_FORM_FIELDS: Record<number, { id: string; label: string; left: number; top: number; width: number; height: number; type?: string }[]> = {
  1: [
    { id:"name", label:"Name", left:25, top:82.7, width:46.5, height:4.05 },
    { id:"surname", label:"Surname", left:25, top:86.75, width:46.5, height:4.05 },
    { id:"id-number", label:"ID number", left:25, top:90.8, width:46.5, height:4.05 },
    { id:"contact", label:"Contact", left:25, top:94.85, width:46.5, height:4.05 },
  ],
  2: [
    { id:"full-name", label:"Name and surname", left:31, top:18.9, width:61, height:3.15 },
    { id:"organisation", label:"Organisation", left:31, top:22.05, width:61, height:3.15 },
    { id:"unit-dept", label:"Unit or department", left:31, top:25.2, width:61, height:3.15 },
    { id:"facilitator", label:"Facilitator name", left:31, top:28.35, width:61, height:3.15 },
    { id:"date-started", label:"Date started", left:31, top:31.5, width:61, height:3.15, type:"date" },
    { id:"date-completed", label:"Date completed", left:31, top:34.65, width:61, height:3.15, type:"date" },
  ],
};

function htmlFont(pdfFont: string): string {
  if (/courier/i.test(pdfFont)) return 'Consolas, "Courier New", monospace';
  if (/times|serif/i.test(pdfFont)) return 'Georgia, "Times New Roman", serif';
  return '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
}

function GuidePage({ page, pageNumber, editMode, values, onChange }: { page: LayoutPage; pageNumber: number; editMode: boolean; values: SavedValues; onChange: SaveField }) {
  if (pageNumber === 1) {
    const coverField = (id:string,label:string) => { const key=`learner-guide.page-1.form-${id}`; return <input aria-label={label} defaultValue={String(values[key]??"")} onBlur={event=>onChange(key,event.target.value)}/>; };
    return <section className="lw-page lw-cover learner-guide-cover" aria-label="Learner Guide cover page"><div className="lw-cover-main"><img src="/logos/eruditio.svg" alt="Eruditio"/><div className="lw-cover-panel"><h1>DEMONSTRATE AN UNDERSTANDING OF ISSUES AFFECTING THE MANAGEMENT OF A LOCAL AREA COMPUTER NETWORK (LAN)</h1><div className="lw-cover-meta"><b>UNIT STANDARD 114046</b><b>NQF LEVEL: 5</b><b>CREDITS: 4</b><b>NOTIONAL HOURS: 40</b></div><table className="lw-table lw-cover-table"><thead><tr><th colSpan={2}>LEARNER INFORMATION</th></tr></thead><tbody><tr><th>Name</th><td>{coverField("name","Name")}</td></tr><tr><th>Surname</th><td>{coverField("surname","Surname")}</td></tr><tr><th>ID Number</th><td>{coverField("id-number","ID number")}</td></tr><tr><th>Contact</th><td>{coverField("contact","Contact")}</td></tr></tbody></table></div></div><aside>LEARNER GUIDE</aside><span className="learner-guide-page-number">Page 1</span></section>;
  }
  if (pageNumber === 2) {
    const detailField=(id:string,label:string,type="text")=>{const key=`learner-guide.page-2.form-${id}`;return <input type={type} aria-label={label} defaultValue={String(values[key]??"")} onBlur={event=>onChange(key,event.target.value)}/>;};
    return <section className="lw-page learner-guide-details-page" aria-label="Learner Guide learner information page"><h2 className="lw-centre">Learner Information:</h2><table className="lw-table lw-details learner-guide-details"><thead><tr><th>Details</th><th>Please Complete this Section</th></tr></thead><tbody><tr><th>Name &amp; Surname:</th><td>{detailField("full-name","Name and surname")}</td></tr><tr><th>Organisation:</th><td>{detailField("organisation","Organisation")}</td></tr><tr><th>Unit/Dept:</th><td>{detailField("unit-dept","Unit or department")}</td></tr><tr><th>Facilitator Name:</th><td>{detailField("facilitator","Facilitator name")}</td></tr><tr><th>Date Started:</th><td>{detailField("date-started","Date started","date")}</td></tr><tr><th>Date of Completion:</th><td>{detailField("date-completed","Date of completion","date")}</td></tr></tbody></table><div className="lw-copy"><h3>Copyright</h3><p>All rights reserved. The copyright of this document, its previous editions and any annexures thereto, is protected and expressly reserved. No part of this document may be reproduced, stored in a retrievable system, or transmitted, in any form or by any means, electronic, mechanical, photocopying, recording or otherwise without prior permission.</p></div><span className="learner-guide-page-number">Page 2</span></section>;
  }
  return <section className={`learner-guide-html-page${editMode ? " editing" : ""}`} style={{ aspectRatio: `${page.width} / ${page.height}` }} aria-label={`Learner Guide page ${pageNumber}`}>
    <img className="learner-guide-page-art" src={`/learner-guide/page-${pageNumber}.svg`} alt="" aria-hidden="true" />
    <div className="learner-guide-html-text">
      {page.items.map(item => {
        const key = `learner-guide-v2.page-${pageNumber}.text-${item.id}`;
        const isAnswerLine = /^[_\.]{8,}$/.test(item.text.replace(/\s/g,""));
        if (isAnswerLine) {
          const fieldKey = `learner-guide-v2.page-${pageNumber}.answer-${item.id}`;
          return <input className="learner-guide-answer-line" key={item.id} aria-label={`Page ${pageNumber} answer line`} defaultValue={String(values[fieldKey] ?? "")} onBlur={event => onChange(fieldKey,event.target.value)} style={{ left:`${item.x/page.width*100}%`, top:`${item.y/page.height*100}%`, width:`${Math.max(item.w,40)/page.width*100}%`, height:`${Math.max(item.h,12)/page.height*100}%`, fontSize:`${item.size/page.width*980}px` }} />;
        }
        return <span key={item.id} contentEditable={editMode} suppressContentEditableWarning spellCheck={editMode} tabIndex={editMode ? 0 : -1} onBlur={event => onChange(key, event.currentTarget.textContent ?? "")} style={{ left:`${item.x/page.width*100}%`, top:`${item.y/page.height*100}%`, width:`${Math.max(item.w,3)/page.width*100}%`, minHeight:`${item.h/page.height*100}%`, fontFamily:htmlFont(item.font), fontSize:`${item.size/page.width*980}px`, fontWeight:item.bold?700:400, fontStyle:item.italic?"italic":"normal", color:item.color }}>{String(values[key] ?? item.text)}</span>;
      })}
    </div>
    {PAGE_FORM_FIELDS[pageNumber]?.length ? <div className="learner-guide-form-layer" aria-label={`Form fields for page ${pageNumber}`}>{PAGE_FORM_FIELDS[pageNumber].map(field => { const key=`learner-guide.page-${pageNumber}.form-${field.id}`; return <input key={field.id} type={field.type??"text"} aria-label={field.label} defaultValue={String(values[key]??"")} onBlur={event=>onChange(key,event.target.value)} style={{left:`${field.left}%`,top:`${field.top}%`,width:`${field.width}%`,height:`${field.height}%`}}/>; })}</div> : null}
    <span className="learner-guide-page-number">Page {pageNumber}</span>
  </section>;
}

export function LearnerGuide({ values, onChange }: { values: SavedValues; onChange: SaveField }) {
  const [pages, setPages] = useState<LayoutPage[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/learner-guide/layout.json", { signal: controller.signal }).then(response => { if (!response.ok) throw new Error(); return response.json(); }).then((data: { pages?: LayoutPage[] }) => setPages(data.pages ?? [])).catch(reason => { if (reason?.name !== "AbortError") setError("The editable Learner Guide could not be opened."); });
    return () => controller.abort();
  }, []);
  if (error) return <div className="callout"><span className="ico"><Icon name="info" size={18}/></span><span>{error}</span></div>;
  if (!pages.length) return <div className="learner-guide-loading"><Icon name="document" size={22}/><span>Opening the editable Learner Guide…</span></div>;
  return <div className={`learner-guide-document${editMode?" is-editing":" is-viewing"}`}><div className="learner-guide-mode" role="group" aria-label="Learner Guide mode"><button type="button" className={!editMode?"active":""} aria-pressed={!editMode} onClick={()=>setEditMode(false)}><Icon name="book" size={15}/> View</button><button type="button" className={editMode?"active":""} aria-pressed={editMode} onClick={()=>setEditMode(true)}><Icon name="pencil" size={15}/> Edit</button><span>{editMode?"Every text element is editable HTML. Changes save when you leave it.":"Viewing the reconstructed HTML document."}</span></div>{pages.map((page,index)=><GuidePage key={index+1} page={page} pageNumber={index+1} editMode={editMode} values={values} onChange={onChange}/>)}</div>;
}
