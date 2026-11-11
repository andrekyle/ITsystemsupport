import fs from 'node:fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import sharp from 'sharp';

if(process.argv.includes('--preview')) {
  const html=fs.readFileSync('public/SAQA-114076-Learner-Guide.html','utf8');
  const images=[...html.matchAll(/<img class="b" src="data:image\/png;base64,([^"]+)"/g)];
  const tiles=await Promise.all(images.map(async(match,index)=>({input:await sharp(Buffer.from(match[1],'base64')).resize(160,226).png().toBuffer(),left:(index%7)*164,top:Math.floor(index/7)*230})));
  await sharp({create:{width:7*164,height:4*230,channels:3,background:'#999'}}).composite(tiles).png().toFile('public/learner-guide-114076/graphics-preview.png');
  console.log('Preview generated; pages ordered left to right.');
  process.exit(0);
}

const pdf = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('src/components/SAQA- 114076 -Learner Guide.pdf')), useSystemFonts:true }).promise;
const output = 'public/learner-guide-114076';
fs.mkdirSync(output, { recursive:true });
const graphics = [];
const panels = [];
const sourceHtml=fs.readFileSync('public/SAQA-114076-Learner-Guide.html','utf8');
const bareImages=[...sourceHtml.matchAll(/<img class="b" src="data:image\/png;base64,([^"]+)"/g)];
for(let index=1;index<bareImages.length;index++) {
  const {data,info}=await sharp(Buffer.from(bareImages[index][1],'base64')).resize({width:400}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  let start=-1;
  for(let y=0;y<=info.height;y++) {
    let blue=0;
    if(y<info.height) for(let x=0;x<info.width;x++) { const p=(y*info.width+x)*info.channels; if(data[p]>140 && data[p+2]-data[p]>15 && data[p+1]>data[p]+5 && data[p+2]>190) blue++; }
    if(blue>40 && start<0) start=y;
    if(blue<=40 && start>=0) { if(y-start>2) panels.push({page:index+1,top:start/info.height*100,bottom:y/info.height*100}); start=-1; }
  }
}
const multiply = (a,b) => [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
for (let number=1; number<=pdf.numPages; number++) {
  const page = await pdf.getPage(number);
  const viewport = page.getViewport({ scale:1 });
  const ops = await page.getOperatorList();
  let matrix = [1,0,0,1,0,0];
  const stack=[];
  let count=0;
  for (let i=0;i<ops.fnArray.length;i++) {
    const op=ops.fnArray[i], args=ops.argsArray[i];
    if(op===pdfjs.OPS.save) stack.push([...matrix]);
    if(op===pdfjs.OPS.restore) matrix=stack.pop() || [1,0,0,1,0,0];
    if(op===pdfjs.OPS.transform) matrix=multiply(matrix,args);
    if(op!==pdfjs.OPS.paintImageXObject && op!==pdfjs.OPS.paintInlineImageXObject) continue;
    const bitmap=op===pdfjs.OPS.paintInlineImageXObject ? args[0] : await new Promise(resolve => (String(args[0]).startsWith('g_') ? pdf.commonObjs : page.objs).get(args[0],resolve));
    if(!bitmap?.data) throw new Error(`Unsupported image on page ${number}`);
    const channels=bitmap.kind===pdfjs.ImageKind.RGBA_32BPP ? 4 : bitmap.kind===pdfjs.ImageKind.RGB_24BPP ? 3 : 1;
    let data=bitmap.data;
    if(bitmap.kind===pdfjs.ImageKind.GRAYSCALE_1BPP) {
      const expanded=new Uint8Array(bitmap.width*bitmap.height);
      const stride=Math.ceil(bitmap.width/8);
      for(let y=0;y<bitmap.height;y++) for(let x=0;x<bitmap.width;x++) expanded[y*bitmap.width+x]=(data[y*stride+(x>>3)] & (128>>(x%8))) ? 255 : 0;
      data=expanded;
    }
    const name=`page-${number}-graphic-${++count}.png`;
    await sharp(Buffer.from(data),{raw:{width:bitmap.width,height:bitmap.height,channels}}).png().toFile(`${output}/${name}`);
    const visual=multiply(viewport.transform,matrix);
    const corners=[[0,0],[1,0],[0,1],[1,1]].map(([x,y])=>[visual[0]*x+visual[2]*y+visual[4],visual[1]*x+visual[3]*y+visual[5]]);
    graphics.push({page:number,src:`data:image/png;base64,${fs.readFileSync(`${output}/${name}`).toString('base64')}`,top:Math.min(...corners.map(p=>p[1]))/viewport.height*100,width:Math.hypot(visual[0],visual[1])/viewport.width*100,alt:number===1?'Eruditio training logo':`Original learner guide illustration, page ${number}, figure ${count}`});
  }
}
fs.writeFileSync(`${output}/graphics.json`,JSON.stringify({graphics,panels},null,2));
console.log(JSON.stringify({pages:pdf.numPages,graphics:graphics.length,placements:graphics.map(g=>({page:g.page,top:Math.round(g.top),width:Math.round(g.width)}))}));
