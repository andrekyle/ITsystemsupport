import fs from 'node:fs';
import sharp from 'sharp';

const sourcePath='src/components/SAQA- 114076 -Learner Guide.html';
const source=fs.readFileSync(sourcePath,'utf8');
const decode=text=>text.replace(/&(?:amp|lt|gt|quot|apos|#39|#\d+|#x[\da-f]+);/gi,entity=>({ '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'" }[entity] ?? String.fromCodePoint(entity[2].toLowerCase()==='x'?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10))));
const attr=(tag,name)=>decode(tag.match(new RegExp(`${name}="([^"]*)"`))?.[1]??'');
const pages=[];
const compact=values=>values.sort((a,b)=>a-b).reduce((result,value)=>{if(!result.length || value-result.at(-1)>2) result.push(value);return result;},[]);
for(const [index,markup] of source.split(/<div class="page"/).slice(1).entries()) {
  const spans=[...markup.matchAll(/<span\b([^>]*)>([^<]*)<\/span>/g)].map((match,id)=>{
    const style=attr(match[1],'style');
    return {id,text:decode(match[2]),x:parseFloat(style.match(/left:\s*([\d.]+)/)?.[1]??0),y:parseFloat(style.match(/top:\s*([\d.]+)/)?.[1]??0),size:Number(style.match(/\*([\d.]+)px/)?.[1]??12),bold:/font-weight:\s*bold/.test(style),rotated:/rotate/.test(style)};
  }).filter(span=>span.text.trim()&&!span.rotated);
  const bare=markup.match(/<img class="b" src="data:image\/png;base64,([^"]+)"/);
  if(!bare) throw new Error(`Missing background on page ${index+1}`);
  const {data,info}=await sharp(Buffer.from(bare[1],'base64')).resize({width:600}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const dark=(x,y)=>{const p=(y*info.width+x)*info.channels;return data[p]<195&&Math.max(data[p],data[p+1],data[p+2])-Math.min(data[p],data[p+1],data[p+2])<18;};
  const horizontal=[],vertical=[];
  for(let y=0;y<info.height;y++){let start=-1;for(let x=0;x<=info.width;x++){if(x<info.width&&dark(x,y)){if(start<0)start=x;}else if(start>=0){if(x-start>35)horizontal.push({x1:start,x2:x,y});start=-1;}}}
  for(let x=0;x<info.width;x++){let start=-1;for(let y=0;y<=info.height;y++){if(y<info.height&&dark(x,y)){if(start<0)start=y;}else if(start>=0){if(y-start>12)vertical.push({x,y1:start,y2:y});start=-1;}}}
  const lines=[...horizontal.map(line=>({...line,type:'h'})),...vertical.map(line=>({...line,type:'v'}))];
  const parent=lines.map((_,i)=>i);
  const root=i=>parent[i]===i?i:(parent[i]=root(parent[i]));
  for(let h=0;h<horizontal.length;h++)for(let v=0;v<vertical.length;v++){
    const a=horizontal[h],b=vertical[v];
    if(b.x>=a.x1-3&&b.x<=a.x2+3&&a.y>=b.y1-3&&a.y<=b.y2+3)parent[root(h)]=root(horizontal.length+v);
  }
  const groups=new Map();lines.forEach((line,i)=>{const r=root(i);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(line);});
  const tables=[];
  for(const group of groups.values()){
    const hs=group.filter(l=>l.type==='h'),vs=group.filter(l=>l.type==='v');
    if(hs.length<2||vs.length<2)continue;
    const xs=compact(vs.map(l=>l.x)),ys=compact(hs.map(l=>l.y));
    if(xs.length<2||ys.length<2)continue;
    const rows=[];
    for(let r=0;r<ys.length-1;r++){
      const cells=[];let c=0;
      while(c<xs.length-1){let end=c+1;const mid=(ys[r]+ys[r+1])/2;
        while(end<xs.length-1&&!vs.some(l=>Math.abs(l.x-xs[end])<3&&l.y1<=mid&&l.y2>=mid))end++;
        const x1=xs[c]/info.width*100,x2=xs[end]/info.width*100,y1=ys[r]/info.height*100,y2=ys[r+1]/info.height*100;
        const items=spans.filter(s=>s.x>=x1-.6&&s.x<x2-.6&&s.y>=y1-.3&&s.y<y2-.3);
        cells.push({column:c,colSpan:end-c,items,blue:false});c=end;
      }
      rows.push(cells);
    }
    const used=new Set(rows.flatMap(row=>row.flatMap(cell=>cell.items.map(s=>s.id))));
    if(!used.size)continue;
    tables.push({top:ys[0]/info.height*100,bottom:ys.at(-1)/info.height*100,columns:xs.slice(1).map((x,i)=>(x-xs[i])/(xs.at(-1)-xs[0])*100),rows});
  }
  // Source-colour panels are independent of table recognition.
  const panels=[];let band=-1;
  for(let y=0;y<=info.height;y++) {let blue=0;if(y<info.height)for(let x=0;x<info.width;x++){const p=(y*info.width+x)*info.channels;if(data[p]>140&&data[p+2]-data[p]>15&&data[p+1]>data[p]+5&&data[p+2]>190)blue++;}
    if(blue>60&&band<0)band=y;
    if(blue<=60&&band>=0){if(y-band>3)panels.push({top:band/info.height*100,bottom:y/info.height*100});band=-1;}
  }
  for(const table of tables)for(const row of table.rows)for(const cell of row)cell.blue=cell.items.some(s=>panels.some(p=>s.y>=p.top-.5&&s.y<=p.bottom+.5));
  const used=new Set(tables.flatMap(table=>table.rows.flatMap(row=>row.flatMap(cell=>cell.items.map(s=>s.id)))));
  pages.push({number:index+1,items:spans.filter(s=>!used.has(s.id)),tables,panels});
}
if(pages.length!==27)throw new Error(`Expected 27 source pages, got ${pages.length}`);
fs.mkdirSync('public/learner-guide-114076',{recursive:true});
fs.writeFileSync('public/learner-guide-114076/workbook-pages.json',JSON.stringify({source:sourcePath,pages}));
console.log(JSON.stringify({pages:pages.length,tables:pages.map(p=>[p.number,p.tables.length]),textRuns:pages.reduce((sum,p)=>sum+p.items.length+p.tables.reduce((n,t)=>n+t.rows.flatMap(r=>r.flatMap(c=>c.items)).length,0),0)}));
