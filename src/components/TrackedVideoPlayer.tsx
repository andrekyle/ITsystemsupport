import { useEffect, useRef, useState } from "react";
import type { LessonVideoSource } from "../lib/lessonVideo";
import { VideoWatchTracker } from "../lib/videoLearning";

interface YouTubePlayer {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  playVideo(): void;
  destroy(): void;
}
interface VimeoPlayer {
  on(event: string, callback: (data: { seconds: number; duration: number }) => void): void;
  off(event: string): void;
  ready(): Promise<void>;
  play(): Promise<void>;
}
declare global {
  interface Window {
    YT?: { Player: new (iframe: HTMLIFrameElement, options: {
      events: { onReady: () => void; onError: () => void };
    }) => YouTubePlayer };
    Vimeo?: { Player: new (iframe: HTMLIFrameElement) => VimeoPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}
let youtubeReady: Promise<void> | undefined;
let vimeoReady: Promise<void> | undefined;
function loadYouTube(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeReady) return youtubeReady;
  youtubeReady = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    const previous = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => fail(), 15000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      youtubeReady = undefined;
      reject(new Error("The YouTube playback tracker could not load. Please reopen the video to retry."));
    }
    script.onerror = fail;
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      previous?.();
      resolve();
    };
    document.head.append(script);
  });
  return youtubeReady;
}
function loadVimeo(): Promise<void> {
  if (window.Vimeo?.Player) return Promise.resolve();
  if (vimeoReady) return vimeoReady;
  vimeoReady = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://player.vimeo.com/api/player.js";
    const timeout = window.setTimeout(() => fail(), 15000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      vimeoReady = undefined;
      reject(new Error("The Vimeo playback tracker could not load. Please reopen the video to retry."));
    }
    script.onload = () => { window.clearTimeout(timeout); resolve(); };
    script.onerror = fail;
    document.head.append(script);
  });
  return vimeoReady;
}

export function TrackedVideoPlayer({ source, title, tracker, onFinished, onError }: {
  source: LessonVideoSource;
  title: string;
  tracker: VideoWatchTracker;
  onFinished: () => void;
  onError: (message: string) => void;
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const callbacks = useRef({ onFinished, onError });
  callbacks.current = { onFinished, onError };
  const [watched, setWatched] = useState(tracker.watchedSeconds);
  const [duration, setDuration] = useState(tracker.duration);
  function sample(seconds: number, total: number) {
    tracker.sample(seconds, total, performance.now());
    setWatched(tracker.watchedSeconds);
    setDuration(tracker.duration);
  }
  function ended() {
    if (tracker.finished) callbacks.current.onFinished();
    else callbacks.current.onError("Some of the video was skipped. Watch the missing sections at normal speed to unlock the questions.");
  }

  useEffect(() => {
    if (source.kind !== "embed") return () => tracker.pause();
    let cancelled = false;
    let youtube: YouTubePlayer | undefined;
    let vimeo: VimeoPlayer | undefined;
    let timer: number | undefined;
    let endedReported = false;
    const youtubeHost = new URL(source.src).hostname === "www.youtube-nocookie.com";
    const setup = async () => {
      try {
        await (youtubeHost ? loadYouTube() : loadVimeo());
        if (cancelled || !iframe.current) return;
        if (youtubeHost) {
          if (!window.YT?.Player) throw new Error("YouTube playback tracking is unavailable.");
          youtube = new window.YT.Player(iframe.current, { events: {
            onReady: () => {
              if (cancelled) return;
              timer = window.setInterval(() => {
                if (!youtube) return;
                const state = youtube.getPlayerState();
                const seconds = youtube.getCurrentTime();
                const total = youtube.getDuration();
                if (state === 1 || state === 0) sample(seconds, total);
                else tracker.pause();
                if (state === 0 && total > 0 && !endedReported) { endedReported = true; ended(); }
                if (state === 1) endedReported = false;
              }, 250);
              youtube?.playVideo();
            },
            onError: () => callbacks.current.onError("YouTube could not play this video. Check the link and embedding permissions."),
          } });
        } else {
          if (!window.Vimeo?.Player) throw new Error("Vimeo playback tracking is unavailable.");
          vimeo = new window.Vimeo.Player(iframe.current);
          await vimeo.ready();
          if (cancelled) return;
          vimeo.on("timeupdate", data => sample(data.seconds, data.duration));
          vimeo.on("pause", () => tracker.pause());
          vimeo.on("seeking", () => tracker.pause());
          vimeo.on("ended", data => { sample(data.seconds, data.duration); ended(); });
          vimeo.on("error", () => callbacks.current.onError("Vimeo could not play this video. Check its permissions."));
          try { await vimeo.play(); }
          catch (cause) {
            if (!cancelled) callbacks.current.onError(cause instanceof Error
              ? `Press Play to start the video: ${cause.message}`
              : "Automatic playback was blocked. Press Play to start the video.");
          }
        }
      } catch (cause) {
        if (!cancelled) callbacks.current.onError(cause instanceof Error ? cause.message : "Video tracking could not start.");
      }
    };
    void setup();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      youtube?.destroy();
      for (const event of ["timeupdate", "pause", "seeking", "ended", "error"]) vimeo?.off(event);
      tracker.pause();
    };
  }, [source.src, source.kind, tracker]);

  const url = new URL(source.src);
  if (source.kind === "embed") {
    // Start through the SDK only after playback tracking is attached.
    url.searchParams.set("autoplay", "0");
    if (url.hostname === "www.youtube-nocookie.com") {
      url.searchParams.set("enablejsapi", "1");
      url.searchParams.set("origin", window.location.origin);
    }
  }
  return <>
    {source.kind === "embed" ? <iframe ref={iframe} src={url.href} title={title}
      allow="autoplay; picture-in-picture; encrypted-media" allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin" /> :
      <video controls autoPlay playsInline preload="metadata" src={source.src}
        onPlaying={event => sample(event.currentTarget.currentTime, event.currentTarget.duration)}
        onTimeUpdate={event => {
          if (!event.currentTarget.paused && !event.currentTarget.seeking)
            sample(event.currentTarget.currentTime, event.currentTarget.duration);
        }}
        onPause={event => {
          if (event.currentTarget.ended) sample(event.currentTarget.currentTime, event.currentTarget.duration);
          tracker.pause();
        }}
        onSeeking={() => tracker.pause()}
        onEnded={event => { sample(event.currentTarget.currentTime, event.currentTarget.duration); ended(); }}
        onError={() => callbacks.current.onError("This video could not be played. Check the link and host permissions.")} />}
    <p className="lesson-video-watch-progress" role="status">
      Watched {Math.floor(watched)}{duration > 0 ? ` of ${Math.ceil(duration)}` : ""} seconds.
      {" "}Watch the entire video at normal speed, then answer all five questions correctly.
    </p>
  </>;
}
