import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icons";
import { usePhoneView } from "./usePhoneView";

type EditingContextValue = {
  target: HTMLElement | null;
  register: (id: string) => () => void;
};

const EditingContext = createContext<EditingContextValue | null>(null);

export function EditingProvider({ children }: { children: ReactNode }) {
  const phone = usePhoneView();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [editors, setEditors] = useState<string[]>([]);
  const [register] = useState(() => (id: string) => {
    setEditors(current => [...current, id]);
    return () => setEditors(current => current.filter(editor => editor !== id));
  });
  const active = !phone && editors.length > 0;
  return (
    <EditingContext.Provider value={{ target, register }}>
      <div className={`editing-layout${active ? " editing-layout-active" : ""}`}>
        {children}
        <aside className="editing-sidebar" aria-label="Editing tools" hidden={!active}>
          <header className="editing-sidebar-header">
            <h2 className="editing-sidebar-title"><Icon name="pencil" size={18} /> Editing tools</h2>
            <p>Choose a section below. Edit on the page, then save your changes.</p>
          </header>
          <div id="editing-sidebar-groups" className="editing-sidebar-groups" ref={setTarget} />
        </aside>
      </div>
    </EditingContext.Provider>
  );
}

export function EditingTools({ active, title, children, description, order = 50, defaultOpen = true, headerAction }: {
  active: boolean;
  title: string;
  children: ReactNode;
  description?: string;
  order?: number;
  defaultOpen?: boolean;
  headerAction?: ReactNode;
}) {
  const context = useContext(EditingContext);
  const phone = usePhoneView();
  const id = useId();
  const register = context?.register;
  useEffect(() => {
    if (active && !phone && register) return register(id);
  }, [active, phone, register, id]);
  if (!active || phone) return null;
  const group = <details className="editing-tool-group" open={defaultOpen} style={{ order }}>
    <summary><h3>{title}</h3><Icon name="chevronDown" size={16} />{headerAction}</summary>
    <div className="editing-tool-group-body">
      {description && <p className="editing-tool-description">{description}</p>}
      {children}
    </div>
  </details>;
  return context?.target ? createPortal(group, context.target) : group;
}
