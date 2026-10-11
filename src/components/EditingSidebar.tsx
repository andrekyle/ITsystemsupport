import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icons";

type EditingContextValue = {
  target: HTMLElement | null;
  register: (id: string) => () => void;
};

const EditingContext = createContext<EditingContextValue | null>(null);

export function EditingProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [editors, setEditors] = useState<string[]>([]);
  const [register] = useState(() => (id: string) => {
    setEditors(current => [...current, id]);
    return () => setEditors(current => current.filter(editor => editor !== id));
  });
  const active = editors.length > 0;
  return (
    <EditingContext.Provider value={{ target, register }}>
      <div className={`editing-layout${active ? " editing-layout-active" : ""}`}>
        {children}
        <aside className="editing-sidebar" aria-label="Editing tools" hidden={!active}>
          <h2 className="editing-sidebar-title"><Icon name="pencil" size={18} /> Editing tools</h2>
          <p className="muted">Edit content on the page. Use the grouped tools below to save or finish.</p>
          <div ref={setTarget} />
        </aside>
      </div>
    </EditingContext.Provider>
  );
}

export function EditingTools({ active, title, children }: {
  active: boolean;
  title: string;
  children: ReactNode;
}) {
  const context = useContext(EditingContext);
  const id = useId();
  const register = context?.register;
  useEffect(() => {
    if (active && register) return register(id);
  }, [active, register, id]);
  if (!active) return null;
  const group = <section className="editing-tool-group">
    <h3>{title}</h3>
    {children}
  </section>;
  return context?.target ? createPortal(group, context.target) : group;
}
