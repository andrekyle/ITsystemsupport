import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Icon } from "../icons";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

function srcToParams(src: string) {
  if (src.startsWith("data:")) {
    const base64 = src.split(",")[1] ?? "";
    const bin = atob(base64);
    const data = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
    return { data };
  }
  return { url: src };
}

/** Keys sent by presentation clickers and keyboards. */
const NEXT_KEYS = ["ArrowRight", "ArrowDown", "PageDown", " ", "Spacebar", "Enter", "n", "N"];
const PREV_KEYS = ["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "p", "P"];

/**
 * Chrome-free full-screen presentation: one slide at a time on a black canvas,
 * driven by clicker / keyboard (PageUp/PageDown, arrows, space) or click.
 */
function Presenter({ src, onClose }: { src: string; onClose: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const pagesRef = useRef(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  zoomRef.current = zoom;
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(
    null
  );

  const applyZoom = (nz: number, cx?: number, cy?: number) => {
    const prev = zoomRef.current;
    const z = Math.min(4, Math.max(1, nz));
    setZoom(z);
    setOffset((o) => {
      if (z === 1) return { x: 0, y: 0 };
      if (cx === undefined || cy === undefined) return o;
      // keep the point under the cursor stationary while zooming
      const px = cx - window.innerWidth / 2;
      const py = cy - window.innerHeight / 2;
      const k = z / prev;
      return { x: px - k * (px - o.x), y: py - k * (py - o.y) };
    });
  };

  // Load the PDF.
  useEffect(() => {
    let cancelled = false;
    const task = pdfjs.getDocument(srcToParams(src));
    task.promise
      .then((doc) => {
        if (cancelled) return;
        docRef.current = doc;
        pagesRef.current = doc.numPages;
        setPages(doc.numPages);
      })
      .catch(() => {
        if (!cancelled) onClose();
      });
    return () => {
      cancelled = true;
      docRef.current = null;
      task.destroy().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Enter full screen on mount; close the presenter whenever full screen ends.
  useEffect(() => {
    wrapRef.current?.requestFullscreen?.().catch(() => {});
    const onFs = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clicker / keyboard navigation (+ zoom keys).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        applyZoom(zoomRef.current * 1.25);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        applyZoom(zoomRef.current / 1.25);
      } else if (e.key === "0") {
        e.preventDefault();
        applyZoom(1);
      } else if (NEXT_KEYS.includes(e.key)) {
        e.preventDefault();
        applyZoom(1);
        setPage((p) => Math.min(p + 1, pagesRef.current || p));
      } else if (PREV_KEYS.includes(e.key)) {
        e.preventDefault();
        applyZoom(1);
        setPage((p) => Math.max(1, p - 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        setPage(1);
      } else if (e.key === "End") {
        e.preventDefault();
        setPage(pagesRef.current || 1);
      } else if (e.key === "Escape" && !document.fullscreenElement) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mouse-wheel / trackpad zoom, anchored at the cursor.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      applyZoom(zoomRef.current * factor, e.clientX, e.clientY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render the current slide, scaled to fill the screen (re-rendered sharper when zoomed).
  const renderZoom = Math.min(zoom, 2.5);
  useEffect(() => {
    let cancelled = false;
    async function render() {
      const doc = docRef.current;
      const canvas = canvasRef.current;
      if (!doc || !canvas || pages === 0) return;
      try {
        const p = await doc.getPage(page);
        if (cancelled) return;
        const base = p.getViewport({ scale: 1 });
        const fit = Math.min(window.innerWidth / base.width, window.innerHeight / base.height);
        const dpr = window.devicePixelRatio || 1;
        const viewport = p.getViewport({ scale: fit * dpr * renderZoom });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        await p.render({ canvas, viewport }).promise;
      } catch {
        /* render cancelled mid-flight — ignore */
      }
    }
    render();
    const onResize = () => render();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [page, pages, renderZoom]);

  return (
    <div
      className="presenter"
      ref={wrapRef}
      onPointerDown={(e) => {
        if (zoomRef.current > 1) {
          dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y, moved: false };
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }
      }}
      onPointerMove={(e) => {
        const d = dragRef.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
        setOffset({ x: d.ox + dx, y: d.oy + dy });
      }}
      onPointerUp={() => {
        // keep the moved flag until the click event fires, then clear it
        setTimeout(() => {
          if (dragRef.current) dragRef.current = null;
        }, 0);
      }}
      onDoubleClick={(e) => {
        applyZoom(zoomRef.current > 1 ? 1 : 2.5, e.clientX, e.clientY);
      }}
      onClick={(e) => {
        if (dragRef.current?.moved) {
          dragRef.current = null;
          return;
        }
        if (zoomRef.current > 1) return; // when zoomed, clicks are for panning
        if (e.clientX < window.innerWidth / 3) setPage((p) => Math.max(1, p - 1));
        else setPage((p) => Math.min(p + 1, pagesRef.current || p));
      }}
    >
      {pages === 0 && <div className="loading">Loading presentation…</div>}
      <canvas
        ref={canvasRef}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom / renderZoom})`,
        }}
      />
      {pages > 0 && (
        <div className="count">
          {zoom > 1 ? `${Math.round(zoom * 100)}% · ` : ""}
          {page} / {pages}
        </div>
      )}
    </div>
  );
}

/** Displays a PDF deck natively in the browser — exactly as exported from PowerPoint. */
export function SlideViewer({ src, allowDownload = true }: { src: string; allowDownload?: boolean }) {
  const [presenting, setPresenting] = useState(false);
  // hide the native PDF toolbar (download/print) when downloads are not allowed
  const frameSrc = allowDownload ? src : `${src}#toolbar=0&navpanes=0`;

  return (
    <div className="slide-viewer-wrap">
      <div className="slide-toolbar">
        <button className="btn ghost dl-sample slide-fs" onClick={() => setPresenting(true)}>
          <Icon name="play" size={15} />
          Present — full screen
        </button>
      </div>
      <iframe className="slide-frame" src={frameSrc} title="Course material" />
      {presenting && <Presenter src={src} onClose={() => setPresenting(false)} />}
    </div>
  );
}
