import type { QuizQuestion } from "../types";
import { lessonVideoSource } from "./lessonVideo";

export interface VideoQuiz {
  transcript: string;
  questions: QuizQuestion[];
}

export function validVideoQuestions(value: unknown): value is QuizQuestion[] {
  return Array.isArray(value) && value.length === 5 && value.every(question =>
    question && typeof question.q === "string" && question.q.trim() &&
    Array.isArray(question.options) && question.options.length === 4 &&
    question.options.every((option: unknown) => typeof option === "string" && option.trim()) &&
    new Set(question.options).size === 4 &&
    Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4 &&
    typeof question.explain === "string"
  ) && new Set(value.map(question => question.q.trim())).size === 5;
}

export function videoQuizId(link: string): string {
  return `video:${lessonVideoSource(link).src}`;
}

export function videoEngagementKey(link: string, action: "liked" | "comments" | "likeXp" | "commentXp"): string {
  return `videoengagement.${action}.${lessonVideoSource(link).src}`;
}

/** Credit only continuous playback, not seeks or repeated sections. */
export class VideoWatchTracker {
  private previous: { seconds: number; time: number } | null = null;
  private ranges: [number, number][] = [];
  private realSeconds = 0;
  duration = 0;

  pause() { this.previous = null; }

  sample(seconds: number, duration: number, time: number) {
    if (!Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0 || seconds < 0) return;
    this.duration = duration;
    const previous = this.previous ?? (seconds <= 0.5
      ? { seconds: 0, time: time - seconds * 1000 } : null);
    this.previous = { seconds, time };
    if (!previous) return;
    const delta = seconds - previous.seconds;
    const elapsed = Math.max(0, (time - previous.time) / 1000);
    if (delta <= 0 || elapsed <= 0 || delta > elapsed * 1.25 + 0.3) return;
    this.realSeconds += Math.min(delta, elapsed);
    const sorted = [...this.ranges, [previous.seconds, Math.min(seconds, duration)] as [number, number]]
      .sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const range of sorted) {
      const last = merged[merged.length - 1];
      if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
      else merged.push([...range]);
    }
    this.ranges = merged;
  }

  get watchedSeconds() {
    return Math.min(this.realSeconds, this.ranges.reduce((total, [start, end]) => total + end - start, 0));
  }

  get finished() {
    const tolerance = Math.min(0.75, this.duration * 0.02);
    return this.duration > 0 && this.watchedSeconds >= this.duration - tolerance;
  }
}
