import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadContentModel } from "../lib/tokens";
import type { QuizQuestion } from "../types";
import { validVideoQuestions, type VideoQuiz } from "../lib/videoLearning";
import { GeneratedQuizEditor } from "./GeneratedQuizEditor";
import { Icon } from "../icons";

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<Record<number, number>>({});
  const [previewScore, setPreviewScore] = useState<number | null>(null);

  useEffect(() => {
    if (!previewOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setPreviewOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [previewOpen]);

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
      {questions.length > 0 && <div className="lesson-video-editor-actions">
        <button type="button" className="btn sm lesson-video-save"
          disabled={!validVideoQuestions(questions) || transcript !== generatedTranscript}
          onClick={() => void save()}>Save Video</button>
        <button type="button" className="btn ghost sm" disabled={!validVideoQuestions(questions)}
          onClick={() => { setPreviewAnswers({}); setPreviewScore(null); setPreviewOpen(true); }}>
          <Icon name="play" size={15} />Preview learner quiz
        </button>
      </div>}
    </fieldset>
    {transcript !== generatedTranscript && questions.length > 0 &&
      <p role="status">The transcript changed. Regenerate questions before saving.</p>}
    {saved && <p role="status">Five video questions saved.</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {previewOpen && validVideoQuestions(questions) && createPortal(
      <div className="lesson-video-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPreviewOpen(false); }}>
        <section className="lesson-video-modal lesson-video-quiz-preview" role="dialog" aria-modal="true" aria-labelledby="video-quiz-preview-title">
          <header className="lesson-video-modal-header">
            <div className="lesson-video-watched"><span>Staff preview · learner view</span></div>
            <button type="button" className="lesson-video-icon-button" aria-label="Close quiz preview" onClick={() => setPreviewOpen(false)}><Icon name="close" size={20} /></button>
          </header>
          <div className="lesson-video-scroll-content">
            <section className="lesson-video-quiz" aria-label="Video knowledge check preview">
              <h3 id="video-quiz-preview-title">Video knowledge check</h3>
              <p>Answer all five questions correctly to unlock Complete and earn XP.</p>
              <form onSubmit={event => { event.preventDefault(); setPreviewScore(questions.reduce((total, question, index) => total + (previewAnswers[index] === question.answer ? 1 : 0), 0)); }}>
                {questions.map((question, index) => <fieldset key={index} disabled={previewScore !== null}>
                  <legend>{index + 1}. {question.q}</legend>
                  {question.options.map((option, optionIndex) => <label key={optionIndex}>
                    <input type="radio" name={`video-quiz-preview-${index}`} checked={previewAnswers[index] === optionIndex} onChange={() => { setPreviewAnswers(current => ({ ...current, [index]: optionIndex })); setPreviewScore(null); }} />
                    {option}
                  </label>)}
                </fieldset>)}
                <button type="submit" className="lesson-video-check-answers" disabled={Object.keys(previewAnswers).length !== 5 || previewScore !== null}>Check video answers</button>
              </form>
              {previewScore !== null && <div className="lesson-video-retry" role="status"><p>{previewScore}/5 correct. This is a staff preview and does not affect learner progress.</p><button type="button" className="btn ghost sm" onClick={() => { setPreviewAnswers({}); setPreviewScore(null); }}><Icon name="refresh" size={15} />Try again</button></div>}
            </section>
          </div>
        </section>
      </div>, document.body)}
  </details>;
}
