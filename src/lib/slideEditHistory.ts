export type SlideTextEdit = { field: number; before: string; after: string };

/** A slide editing session retains the ten most recent changes. */
export class SlideEditHistory {
  private past: SlideTextEdit[] = [];
  private future: SlideTextEdit[] = [];

  get undoCount() { return this.past.length; }
  get redoCount() { return this.future.length; }

  record(edit: SlideTextEdit) {
    if (edit.before === edit.after) return;
    this.past.push(edit);
    if (this.past.length > 10) this.past.shift();
    this.future = [];
  }

  undo() {
    const edit = this.past.pop();
    if (edit) this.future.push(edit);
    return edit;
  }

  redo() {
    const edit = this.future.pop();
    if (edit) this.past.push(edit);
    return edit;
  }
}
