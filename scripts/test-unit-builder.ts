import assert from "node:assert/strict";
import { buildUnitContent, parseUnitSource, validateUnitContent } from "../src/lib/unitBuilder.ts";
import handler from "../api/enhance-unit-quiz.ts";

const unit={us:"114059",title:"Estimate a unit of work and explain late delivery",nqf:5,credits:5,dates:"",time:""};
const source=`# Estimating work

Estimating starts with understanding the scope and identifying the required deliverables. Break the work into smaller tasks before estimating the time required. Use previous experience and recorded performance to improve the accuracy of estimates.

# Resources and dependencies

Consider the availability of staff, equipment and materials when preparing an estimate. Dependencies affect the sequence of tasks and can delay the start of subsequent work. Record assumptions so that stakeholders understand the basis of the estimate.

# Late delivery

Late delivery can increase costs and disrupt dependent activities. Communicate delays early so stakeholders can adjust their plans. Review the impact of a delay and agree a revised delivery date with the affected stakeholders.`;
const built=buildUnitContent(unit,source,{questions:5,minutes:180});
validateUnitContent(built);
assert.equal(parseUnitSource(source).length,3);
assert.equal(built.lesson.length,3);
assert.equal(built.quiz.length,5);
assert.equal(built.exercises.length,3);
assert.ok(built.assignments.length&&built.questionSessions?.length&&built.logbook&&built.lessonPlan&&built.studyNotes?.length&&built.selfAssessment&&built.evaluation&&built.saqa);
for(const q of built.quiz) assert.ok(source.includes(q.explain.replace("Source: ","")));
assert.throws(()=>buildUnitContent(unit,"Too short",{questions:5,minutes:180}));
const invalid=structuredClone(built);invalid.quiz[0].answer=9;
assert.throws(()=>validateUnitContent(invalid));

// A section boundary must not strand a numbered heading above the next page.
const precedingParagraph = "Earlier estimating guidance. ".repeat(54).trim();
const numberedHeading = "2. Outline of the Unit Price Estimation Method";
const headingParagraph = "The present cost estimation method uses work efficiency to calculate the required materials and labour. ".repeat(5).trim();
const chunked = parseUnitSource(`# Cost estimation\n\n${precedingParagraph}\n\n${numberedHeading}\n\n${headingParagraph}`);
assert.equal(chunked.length, 2);
assert.deepEqual(chunked[0].paragraphs, [precedingParagraph]);
assert.deepEqual(chunked[1].paragraphs, [numberedHeading, headingParagraph]);
assert.deepEqual(chunked.flatMap(topic => topic.paragraphs), [precedingParagraph, numberedHeading, headingParagraph]);

const ordinaryStep = "2. Check the estimate against the original specifications.";
const steps = parseUnitSource(`# Cost estimation\n\n${precedingParagraph}\n\n${ordinaryStep}\n\n${headingParagraph}`);
assert.deepEqual(steps[0].paragraphs, [precedingParagraph, ordinaryStep]);
assert.deepEqual(steps[1].paragraphs, [headingParagraph]);

const numberedItems = ["1. Materials", "2. Labour", "3. Equipment"];
const list = parseUnitSource(`# Cost estimation\n\n${precedingParagraph}\n\n${numberedItems.join("\n\n")}`);
assert.equal(list.length, 1);
assert.deepEqual(list[0].paragraphs, [precedingParagraph, ...numberedItems]);

const originalFetch=globalThis.fetch;
const prior={...process.env};
process.env.OPENAI_API_KEY="test-only";
process.env.SUPABASE_URL="https://test.invalid";
process.env.SUPABASE_ANON_KEY="test-only";
let aiCalls=0;
globalThis.fetch=(async(url,init)=>{
  if(String(url).endsWith("is_admin"))return Response.json(true);
  aiCalls++;
  const request=JSON.parse(String(init?.body));
  assert.equal(request.response_format.json_schema.strict,true);
  return Response.json({choices:[{message:{content:JSON.stringify({questions:built.quiz.map(q=>({...q,evidence:q.explain.replace("Source: ","")}))})}}]});
}) as typeof fetch;
try {
  assert.equal((await handler(new Request("https://test.invalid",{method:"POST",body:"{}"}))).status,401);
  const response=await handler(new Request("https://test.invalid",{method:"POST",headers:{Authorization:"Bearer test"},body:JSON.stringify({source,count:5})}));
  assert.equal(response.status,200);
  assert.equal((await response.json()).questions.length,5);
  assert.equal(aiCalls,1);
  globalThis.fetch=(async(url)=>String(url).endsWith("is_admin")?Response.json(false):Response.json({})) as typeof fetch;
  assert.equal((await handler(new Request("https://test.invalid",{method:"POST",headers:{Authorization:"Bearer test"},body:JSON.stringify({source,count:5})}))).status,403);
} finally {globalThis.fetch=originalFetch;for(const k of ["OPENAI_API_KEY","SUPABASE_URL","SUPABASE_ANON_KEY"]) {if(prior[k]===undefined)delete process.env[k];else process.env[k]=prior[k];}}
console.log("PASS: deterministic content, heading/paragraph chunk boundaries, all tabs, grounded quiz answers, validation, authenticated bounded AI generation");
