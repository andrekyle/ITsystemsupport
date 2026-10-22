import assert from "node:assert/strict";
import { test } from "node:test";
import handler from "../api/generate-form";
import { pdfHtmlPictureMasks, readPdfHtmlArtwork } from "../src/lib/pdfHtmlArtwork";

test("artwork masks overlapping labels without rejecting or removing the artwork", () => {
  const picture = { x: 0.2, y: 0.2, w: 0.4, h: 0.3 };
  const masks = pdfHtmlPictureMasks(picture, [
    { x: 0.3, y: 0.3, w: 0.1, h: 0.05 },
    { x: 0.1, y: 0.25, w: 0.2, h: 0.1 },
    { x: 0.8, y: 0.8, w: 0.1, h: 0.1 },
    { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
  ]);
  assert.equal(masks.length, 3);
  for (const mask of masks) {
    assert.ok(mask.x >= picture.x && mask.y >= picture.y);
    assert.ok(mask.x + mask.w <= picture.x + picture.w);
    assert.ok(mask.y + mask.h <= picture.y + picture.h);
  }
  for (const key of ["x", "y", "w", "h"] as const) assert.ok(Math.abs(masks[2][key] - picture[key]) < 1e-12);
  assert.deepEqual(pdfHtmlPictureMasks(picture, []), []);
});

test("HTML artwork rejects page-image substitutes, invalid bounds and incomplete sources", () => {
  assert.deepEqual(readPdfHtmlArtwork({fills:[],pictures:[],issues:[]}), {fills:[],pictures:[],issues:[]});
  assert.throws(()=>readPdfHtmlArtwork({fills:[],pictures:[{x:0,y:0,w:1,h:1}],issues:[]}), /page-sized/);
  assert.throws(()=>readPdfHtmlArtwork({fills:[],pictures:[{x:0.05,y:0.05,w:0.9,h:0.9}],issues:[]}), /page-sized/);
  assert.throws(()=>readPdfHtmlArtwork({fills:[{x:0,y:0,w:2,h:1,c:"#ffffff"}],pictures:[],issues:[]}), /outside/);
  assert.throws(()=>readPdfHtmlArtwork({fills:[],pictures:[],issues:["Question 3 is unreadable"]}), /Question 3/);
  assert.throws(()=>readPdfHtmlArtwork({fills:[],pictures:[]}), /completeness/);
});

test("large individual artwork is allowed without allowing page-sized crops", () => {
  const pictures = [
    {x:0.1,y:0.1,w:0.8,h:0.7},
    {x:0,y:0.2,w:1,h:0.5},
    {x:0.1,y:0,w:0.6,h:1},
  ];
  assert.deepEqual(readPdfHtmlArtwork({fills:[],pictures,issues:[]}).pictures,pictures);
});

test("authenticated HTML mode uses strict AI layout schema and validates its response", async () => {
  const originalFetch = globalThis.fetch;
  const keys=["SUPABASE_URL","SUPABASE_ANON_KEY","OPENAI_API_KEY"];
  const before=keys.map(key=>process.env[key]);
  process.env.SUPABASE_URL="https://example.invalid";
  process.env.SUPABASE_ANON_KEY="test";
  process.env.OPENAI_API_KEY="test";
  let calls=0;
  let issues:string[]=[];
  let pictures:{x:number;y:number;w:number;h:number}[]=[{x:0.1,y:0.1,w:0.8,h:0.7}];
  globalThis.fetch=async(url,init)=>{
    if(String(url).endsWith("/auth/v1/user"))return Response.json({id:"admin"});
    if(String(url).endsWith("/rpc/is_admin"))return Response.json(true);
    assert.equal(String(url),"https://api.openai.com/v1/chat/completions");
    calls++;
    const request=JSON.parse(String(init?.body));
    assert.match(request.messages[0].content,/HTML CONVERSION/);
    assert.match(request.messages[0].content,/untrusted source data/);
    assert.equal(request.response_format.json_schema.strict,true);
    assert.ok(request.response_format.json_schema.schema.required.includes("artwork"));
    const content=JSON.stringify({title:"Original guide",description:"",fields:[],artwork:{fills:[],pictures,issues}});
    const encoder=new TextEncoder();
    return new Response(new ReadableStream({start(controller){
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({choices:[{delta:{content},finish_reason:null}]})}\n\ndata: ${JSON.stringify({choices:[{delta:{},finish_reason:"stop"}]})}\n\ndata: [DONE]\n\n`));
      controller.close();
    }}),{headers:{"Content-Type":"text/event-stream"}});
  };
  const request=()=>handler(new Request("https://example.invalid/api/generate-form",{
    method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer test-session"},
    body:JSON.stringify({html:true,name:"guide.pdf",images:["data:image/png;base64,AA=="],pages:[{text:[],boxes:[]}]}),
  }));
  try {
    const valid=await (await request()).json();
    assert.ok(valid.definition);
    assert.deepEqual(valid.artwork,{fills:[],pictures,issues:[]});
    pictures=[{x:0,y:0,w:1,h:1}];
    const oversized=await (await request()).json();
    assert.match(oversized.error,/page-sized/);
    assert.doesNotMatch(oversized.error,/No fillable fields/);
    assert.equal(oversized.definition,undefined);
    pictures=[];
    issues=["Visible question missing from extracted text"];
    const invalid=await (await request()).json();
    assert.match(invalid.error,/Visible question missing/);
    assert.equal(invalid.definition,undefined);
    assert.equal(calls,3);
  } finally {
    globalThis.fetch=originalFetch;
    keys.forEach((key,index)=>{if(before[index]===undefined)delete process.env[key];else process.env[key]=before[index];});
  }
});
