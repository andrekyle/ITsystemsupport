import { useState, type ReactNode } from "react";
import { Icon } from "../icons";

export function InfoSectionTabs({ id, sections }: {
  id: string;
  sections: { title: string; heading?: ReactNode; icon: string; content: ReactNode }[];
}) {
  const [selected, setSelected] = useState(0);
  const active = selected < sections.length ? selected : 0;
  return (
    <>
      <div className="tabs assessment-tabs" role="tablist" aria-label={`${id} sections`}>
        {sections.map((section, index) => (
          <button key={index} type="button" role="tab" id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`} aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            className={`tab${active === index ? " active" : ""}`}
            onClick={() => setSelected(index)}
            onKeyDown={event => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % sections.length;
              else if (event.key === "ArrowLeft") next = (index + sections.length - 1) % sections.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = sections.length - 1;
              else return;
              event.preventDefault();
              setSelected(next);
              document.getElementById(`${id}-tab-${next}`)?.focus();
            }}>
            <Icon name={section.icon} size={15} /> {section.title}
          </button>
        ))}
      </div>
      {sections.map((section, index) => (
        <section key={index} role="tabpanel" id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`} hidden={active !== index}>
          <div className="card">
            <h2 className="section-title mt-0" style={{ margin: "0 0 10px" }}>
              <span className="ico"><Icon name={section.icon} size={20} /></span>
              {section.heading ?? section.title}
            </h2>
            {section.content}
          </div>
        </section>
      ))}
    </>
  );
}
