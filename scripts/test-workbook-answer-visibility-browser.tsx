import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { GeneratedWorkbook } from "../src/components/GeneratedWorkbook";
import { LearnerWorkbook } from "../src/components/LearnerWorkbook";
import { WorkbookMemo } from "../src/components/WorkbookMemo";
import { WorkbookTaskAnswer } from "../src/components/WorkbookTaskAnswer";
import { TemplateLearnerWorkbook } from "../src/components/TemplateLearnerWorkbook";
import { Workbook114074 } from "../src/components/Workbook114074";
import { Workbook8252 } from "../src/components/Workbook8252";
import { WORKBOOK_114074 } from "../src/data/workbook114074";
import { WORKBOOK_8252 } from "../src/data/workbook8252";
import { UnitPage } from "../src/pages/Course";
import type { Profile, Role, UnitStandard, WorkbookSpec } from "../src/types";
import type { WorkbookMemoState } from "../src/store";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const modelAnswer = "STAFF-ONLY-MODEL-ANSWER";
const feedback = "STAFF-ONLY-FEEDBACK: the correct answer is the memo answer.";
const criterion = "STAFF-ONLY-MARKING-CRITERION";
const task = { id: "network", task: 1, text: "Describe a network.", marks: 5, modelAnswer };
const memo: WorkbookMemoState = {
  items: [{
    id: "outcome-1", question: "Network knowledge", maxMarks: 5, tasks: [task],
    criteria: [{ id: "network-criterion", taskId: task.id, text: criterion, marks: 5 }],
  }],
};
const workbook: WorkbookSpec = {
  title: "Test workbook",
  outcomes: [{ id: "outcome-1", specificOutcome: 1, title: "Network knowledge", learningOutcomes: ["Describe networks"], questions: [task] }],
};
const unit: UnitStandard = { us: "114046", title: "Networks", nqf: 5, credits: 4, time: 40 };
const result = JSON.stringify({ awarded: 2, maxMarks: 5, feedback, correctSegments: ["My own response"] });
const values = {
  "built-workbook.outcome-1.network": "My own response",
  "built-workbook.task-mark.outcome-1.network": result,
  "built-workbook.mark.outcome-1": result,
  "learner-workbook.outcome-1.network.answer": "My own response",
  "learner-workbook.task-mark.network": result,
  "learner-workbook.mark.outcome-1": result,
};
const fixture = document.getElementById("fixture")!;
const root = createRoot(fixture);
const roles: Role[] = ["Learner", "Facilitator", "Assessor", "Moderator", "Admin", "Super User"];
const profileFor = (role: Role): Profile => ({ id: "workbook-visibility-test", name: "Test", role, createdAt: "2026-11-12" });
const onChange = () => {};
const onSave = async () => {};
const tick = () => new Promise(resolve => setTimeout(resolve, 80));

async function test() {
  for (const role of roles) {
    const profile = profileFor(role);
    const staff = role !== "Learner";
    for (const variant of ["generated", "legacy", "template"] as const) {
      flushSync(() => root.render(variant === "generated"
        ? <GeneratedWorkbook workbook={workbook} unit={unit} profile={profile} memoItems={memo.items} values={values} onChange={onChange} onSave={onSave} />
        : variant === "template"
          ? <TemplateLearnerWorkbook workbook={workbook} unit={unit} profile={profile} memoItems={memo.items} values={values} onChange={onChange} onSave={onSave} />
          : <LearnerWorkbook profile={profile} memoItems={memo.items} values={values} onChange={onChange} onSave={onSave} />));
      assert(fixture.textContent?.includes("My own response"), `${role} retains the learner's response`);
      const actions = fixture.querySelector(".document-actions");
      assert(actions?.querySelectorAll("button").length === 2, "Document toolbar contains only PDF and HTML downloads");
      assert(!actions.querySelector('[aria-label^="Save "]'), "Document toolbar has no manual save button");
      assert(actions.querySelector(".document-action-pdf") && actions.querySelector(".document-action-html"), "Both download options remain available");
      assert(fixture.textContent?.includes("2/5"), `${role} retains the task score`);
      assert(fixture.textContent?.includes(feedback) === staff, `${role}: feedback visibility follows staff access`);
      if (!staff) {
        assert(fixture.querySelector(".workbook-task-score")?.textContent?.includes("met some of the marking requirements"), "Learners receive constructive task feedback");
        assert(fixture.querySelector(".lw-ai-result")?.textContent?.includes("met some of the marking requirements"), "Learners receive constructive outcome feedback");
      }
      assert(!fixture.innerHTML.includes(modelAnswer) && !fixture.innerHTML.includes(criterion), "Workbook HTML contains no answer key");
      assert(!!fixture.querySelector(".workbook-answer-toggle") === staff, `${role}: answer reveal control is staff-only`);
      if (staff) {
        fixture.querySelector<HTMLButtonElement>(".workbook-answer-toggle")!.click();
        await tick();
        assert(fixture.querySelector(".workbook-model-answer")?.textContent?.includes(modelAnswer), "Staff can reveal model answers");
        fixture.querySelector<HTMLButtonElement>(".workbook-answer-toggle")!.click();
        await tick();
      }
      assert(fixture.querySelector(".lw-ai-result")?.textContent?.includes(feedback) === staff, "Outcome feedback follows staff access");
      if (!staff) {
        let exported: Blob | undefined;
        const createUrl = URL.createObjectURL;
        const click = HTMLAnchorElement.prototype.click;
        try {
          URL.createObjectURL = blob => {
            if (blob instanceof Blob) exported = blob;
            return createUrl(blob);
          };
          HTMLAnchorElement.prototype.click = () => {};
          fixture.querySelector<HTMLButtonElement>(".document-action-html")!.click();
        } finally {
          URL.createObjectURL = createUrl;
          HTMLAnchorElement.prototype.click = click;
        }
        assert(exported, "HTML download is created");
        const html = await exported.text();
        assert(html.includes("My own response"), "HTML export retains learner responses");
        assert(html.includes("met some of the marking requirements"), "HTML export retains learner feedback");
        assert(![modelAnswer, feedback, criterion].some(secret => html.includes(secret)), "Learner HTML export contains no memo answers or revealing feedback");

        const print = window.print;
        let printed = false;
        try {
          window.print = () => {
            printed = true;
            const html = fixture.querySelector(".document-print-target")!.innerHTML;
            assert(html.includes("met some of the marking requirements"), "PDF print content retains learner feedback");
            assert(![modelAnswer, feedback, criterion].some(secret => html.includes(secret)), "Learner PDF print content contains no memo answers or revealing feedback");
            window.dispatchEvent(new Event("afterprint"));
          };
          fixture.querySelector<HTMLButtonElement>(".document-action-pdf")!.click();
        } finally {
          window.print = print;
        }
        assert(printed, "Learner PDF print workflow runs");
      }
    }

    for (const [awarded, incorrectSegments, expected] of [
      [0, [], "not yet earned marks"],
      [2, ["My own response"], "Review the parts of your answer marked as incorrect"],
      [5, [], "met all the marking requirements"],
    ] as const) {
      const saved = { answer: "My own response", mark: JSON.stringify({ awarded, maxMarks: 5, feedback, incorrectSegments }) };
      flushSync(() => root.render(<WorkbookTaskAnswer profile={profileFor("Learner")} outcomeId="outcome-1"
        task={task} memoItem={memo.items[0]} valueKey="answer" markKey="mark" values={saved} onChange={onChange} revealAnswer />));
      assert(fixture.querySelector(".workbook-task-score")?.textContent?.includes(expected), "Feedback reflects the actual mark and incorrect passages");
      assert(!fixture.textContent?.includes(feedback), "Previously saved AI feedback cannot reveal memo answers to learners");
      assert(!fixture.querySelector(".workbook-model-answer,.workbook-answer-toggle"), "Reveal prop cannot bypass learner role restrictions");
      if (incorrectSegments.length) assert(fixture.querySelector("mark.is-incorrect")?.textContent === "My own response", "Learners can identify which part of their response needs revision");
    }

    flushSync(() => root.render(<WorkbookMemo profile={profile} unitId="114046" blueprint={[]} memo={memo} onChange={onChange} />));
    assert(!!fixture.querySelector(".workbook-memo") === staff, `${role}: memo visibility follows staff access`);
    assert(fixture.textContent?.includes(modelAnswer) === staff, `${role}: model answer visibility follows staff access`);
    assert(fixture.textContent?.includes(criterion) === staff, `${role}: criteria visibility follows staff access`);
    assert(!!fixture.querySelector('input[type="file"]') === (role === "Super User"), "Only Super Users manage memo uploads");

    for (const source of [WORKBOOK_114074, WORKBOOK_8252]) {
      const outcome = source.outcomes[0];
      const question = outcome.questions[0];
      const memoItems = [{
        id: outcome.id, question: outcome.title, maxMarks: question.marks,
        tasks: [{ ...question, modelAnswer }],
        criteria: [{ id: "criterion", taskId: question.id, text: criterion, marks: question.marks }],
      }];
      const saved = {
        [`built-workbook.${outcome.id}.${question.id}`]: "My own response",
        [`built-workbook.mark.${outcome.id}`]: result,
        [`learner-workbook.${outcome.id}.${question.id}.answer`]: "My own response",
        [`learner-workbook.task-mark.${question.id}`]: result,
        [`learner-workbook.mark.${outcome.id}`]: result,
      };
      flushSync(() => root.render(source === WORKBOOK_114074
        ? <Workbook114074 profile={profile} memoItems={memoItems} values={saved} onChange={onChange} onSave={onSave} />
        : <Workbook8252 profile={profile} memoItems={memoItems} values={saved} onChange={onChange} onSave={onSave} />));
      assert(fixture.querySelector(".lw-ai-result")?.textContent?.includes(feedback) === staff, "New workbook layout keeps revealing feedback staff-only");
      assert(!!fixture.querySelector(".workbook-answer-toggle,.workbook-114074-model-toggle") === staff, "New workbook layout restricts model-answer controls");
      if (!staff) assert(fixture.querySelector(".lw-ai-result")?.textContent?.includes("met some of the marking requirements"), "New workbook layout retains learner feedback");
      if (staff) {
        fixture.querySelector<HTMLButtonElement>(".workbook-answer-toggle,.workbook-114074-model-toggle")!.click();
        await tick();
        assert(fixture.querySelector(".workbook-model-answer,.workbook-114074-model-panel"), "Staff can reveal answers in the new workbook layouts");
        flushSync(() => root.render(source === WORKBOOK_114074
          ? <Workbook114074 profile={profileFor("Learner")} memoItems={memoItems} values={saved} onChange={onChange} onSave={onSave} />
          : <Workbook8252 profile={profileFor("Learner")} memoItems={memoItems} values={saved} onChange={onChange} onSave={onSave} />));
        assert(!fixture.querySelector(".workbook-model-answer,.workbook-114074-model-panel"), "Role switch immediately removes open answers");
        assert(!fixture.textContent?.includes(feedback), "Role switch immediately replaces memo feedback");
      }
    }
  }

  // A remembered memo must redirect, including immediately after a role change.
  for (const role of [...roles.slice(1), "Learner"] as Role[]) {
    localStorage.setItem("itss.unittab.us", "114076");
    localStorage.setItem("itss.unittab", "memo");
    flushSync(() => root.render(null));
    flushSync(() => root.render(<UnitPage unitId="114076" profile={profileFor(role)} progress={{ units: {} }}
      toggleActivity={onChange} saveQuizResult={onChange} setLogbookField={onChange}
      saveExerciseResult={onChange} navigate={onChange} />));
    await tick();
    const tabs = Array.from(fixture.querySelectorAll('[role="tab"]'));
    const memoTab = tabs.find(tab => tab.textContent?.trim() === "Memo");
    assert(!!memoTab === (role !== "Learner"), `${role}: memo tab is restricted to staff`);
    assert(!!fixture.querySelector(".workbook-memo") === (role !== "Learner"), `${role}: remembered memo route is role checked`);
    if (role !== "Learner") {
      flushSync(() => root.render(<UnitPage unitId="114076" profile={profileFor("Learner")} progress={{ units: {} }}
        toggleActivity={onChange} saveQuizResult={onChange} setLogbookField={onChange}
        saveExerciseResult={onChange} navigate={onChange} />));
      assert(!fixture.querySelector(".workbook-memo"), "Role switch removes memo before redirect completes");
      await tick();
      assert(localStorage.getItem("itss.unittab") === "workbook", "Learners return to the workbook");
    }
  }
  flushSync(() => root.unmount());
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: learners receive feedback for zero, partial and full marks without memo answers; feedback is retained in HTML/PDF exports; staff access and role-switch guards work.";
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
