import { useState } from "react";
import { loadContentModel } from "../lib/tokens";
import type { QuizQuestion } from "../types";
import { validVideoQuestions, type VideoQuiz } from "../lib/videoLearning";
import { GeneratedQuizEditor } from "./GeneratedQuizEditor";

export function VideoQuizEditor({ quiz, disabled, onSave }: {
  quiz?: VideoQuiz;
  disabled: boolean;
  onSave: (quiz: VideoQuiz) => Promise<void>;
}) {
  const [transcript, setTranscript] = useState(quiz?.transcript ?? "");
  const [questions, setQuestions] = useState<QuizQuestion[]>(quiz?.questions ?? []);
  const [generatedTranscript, setGeneratedTranscript] = useState(quiz?.transcript ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function generate() {
    setBusy(true); setError(""); setSaved(false);
    try {
      const response = await fetch("/api/generate-slide-quiz", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideText: transcript, count: 5, purpose: "video", model: loadContentModel() }),
        signal: AbortSignal.timeout(55000),
      });
      const data: { questions?: unknown; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Video questions could not be generated.");
      if (!validVideoQuestions(data.questions)) throw new Error("AI did not return five valid questions. Please regenerate.");
      setQuestions(data.questions);
      setGeneratedTranscript(transcript);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Question generation failed.");
    } finally { setBusy(false); }
  }
  async function save() {
    if (!validVideoQuestions(questions) || transcript !== generatedTranscript) return;
    setBusy(true); setError(""); setSaved(false);
    try { await onSave({ transcript, questions }); setSaved(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Video questions could not be saved."); }
    finally { setBusy(false); }
  }
  return <details className="lesson-video-quiz-editor">
    <summary>Set up video questions <span className="lesson-video-quiz-state">
      {validVideoQuestions(quiz?.questions) ? "5 questions saved" : "Setup required"}
    </span></summary>
    <fieldset disabled={disabled || busy}>
      <label>Video transcript
        <textarea rows={6} maxLength={50000} value={transcript}
          onChange={event => { setTranscript(event.target.value); setSaved(false); }}
          placeholder="Paste this video's spoken transcript or captions." />
      </label>
      <p className="muted">AI uses this transcript, not the video link. Review the five questions and correct answers before saving them for learners.</p>
      <button type="button" className="btn ghost sm" disabled={transcript.trim().length < 300}
        onClick={() => void generate()}>{busy ? "Working..." : "Generate five video questions"}</button>
      {questions.map((question, index) => <GeneratedQuizEditor key={index} question={question}
        number={index + 1} onChange={next => {
          setQuestions(current => current.map((value, i) => i === index ? next : value)); setSaved(false);
        }} onRemove={() => { setQuestions(current => current.filter((_, i) => i !== index)); setSaved(false); }} />)}
      {questions.length > 0 && <button type="button" className="btn ghost sm"
        disabled={!validVideoQuestions(questions) || transcript !== generatedTranscript}
        onClick={() => void save()}>Save reviewed video questions</button>}
    </fieldset>
    {transcript !== generatedTranscript && questions.length > 0 &&
      <p role="status">The transcript changed. Regenerate questions before saving.</p>}
    {saved && <p role="status">Five video questions saved.</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
  </details>;
}
