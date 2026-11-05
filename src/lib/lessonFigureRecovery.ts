/**
 * Lesson-figure recovery.
 *
 * Inline lesson pictures are referenced from slide HTML by figure id, while
 * the id → storage-path map lives in a separate shared record. When that map
 * loses an entry (a stale device re-saving its own copy, an upload whose map
 * write never synced, a picture deleted and re-uploaded elsewhere) the slide
 * still names the figure but nothing can resolve it, and the browser shows a
 * bare broken image. Storage object names start with the figure id, so the
 * path can be rebuilt from a listing of the unit's figure folder.
 */

export interface StoredFigureFile {
  name: string;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Storage-safe form of a figure id; must match the naming used at upload. */
export function safeFigureId(id: string): string {
  return id.replace(/[^\w.\-]+/g, "_");
}

/** Storage folder holding a unit's uploaded lesson figures (tenant prefix excluded). */
export function lessonFigureFolder(us: string): string {
  return `shared/lessonfigs/${us}`;
}

const UPLOAD_SUFFIX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:png|jpe?g)$/i;

function uploadedAt(file: StoredFigureFile): number {
  const time = Date.parse(file.created_at ?? file.updated_at ?? "");
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Pick the storage object belonging to a figure id from its folder listing.
 * Names are `<safe id>-<uuid>.<ext>`; the newest upload wins when an older
 * copy's removal failed. Returns null when nothing in the folder is the id's.
 */
export function matchFigureFile(id: string, files: readonly StoredFigureFile[]): StoredFigureFile | null {
  const prefix = `${safeFigureId(id)}-`;
  let best: StoredFigureFile | null = null;
  for (const file of files) {
    if (!file.name.startsWith(prefix) || !UPLOAD_SUFFIX.test(file.name.slice(prefix.length))) continue;
    if (!best || uploadedAt(file) > uploadedAt(best)) best = file;
  }
  return best;
}
