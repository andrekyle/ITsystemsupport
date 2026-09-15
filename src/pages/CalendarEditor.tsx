import { useState, useEffect } from "react";
import { IT_SYSTEMS_SUPPORT } from "../data/courses/it-systems-support";
import "./CalendarEditor.css";

interface EditableUnit {
  us: string;
  title: string;
  dates: string;
  time: string;
  nqf: number;
  credits: number;
}

interface EditableModule {
  id: string;
  name: string;
  units: EditableUnit[];
}

export function CalendarEditor() {
  const [modules, setModules] = useState<EditableModule[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [editingCell, setEditingCell] = useState<{
    moduleId: string;
    unitIndex: number;
    field: keyof EditableUnit;
  } | null>(null);

  useEffect(() => {
    // Initialize editable modules from the course data
    const editableModules = IT_SYSTEMS_SUPPORT.modules.map((module) => ({
      id: module.id,
      name: module.name,
      units: module.units.map((unit: any) => ({
        us: unit.us,
        title: unit.title,
        dates: unit.dates,
        time: unit.time,
        nqf: unit.nqf,
        credits: unit.credits,
      })),
    }));
    setModules(editableModules);
  }, []);

  const handleCellChange = (
    moduleId: string,
    unitIndex: number,
    field: keyof EditableUnit,
    value: string
  ) => {
    setModules((prevModules) =>
      prevModules.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            units: module.units.map((unit, index) => {
              if (index === unitIndex) {
                if (field === "credits" || field === "nqf") {
                  return { ...unit, [field]: parseInt(value) || 0 };
                }
                return { ...unit, [field]: value };
              }
              return unit;
            }),
          };
        }
        return module;
      })
    );
  };

  const saveChanges = async () => {
    try {
      setSaveStatus("Saving...");
      
      // Prepare the data in the format needed for the TypeScript file
      const updatedCode = generateTypeScriptCode();
      
      // Send to backend to update the file
      const response = await fetch("/api/save-calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: updatedCode }),
      });

      if (response.ok) {
        setSaveStatus("✓ Changes saved successfully!");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus("✗ Failed to save changes");
      }
    } catch (error) {
      setSaveStatus(`✗ Error: ${error}`);
    }
  };

  const generateTypeScriptCode = () => {
    let code = `import type { CourseModule } from "../../types";

const meta = {
  title: "National Certificate: Information Technology – System Support",
  saqaId: "48573",
  nqfLevel: 5,
  credits: 148,
  qualityAssurance: "QCTO / MICT SETA",
  time: "09h00 - 14h00",
  sponsor: "Investec Group",
};

const modules: CourseModule[] = [
`;

    modules.forEach((module) => {
      code += `  {
    id: "${module.id}",
    name: "${module.name.replace(/"/g, '\\"')}",
    icon: "globe",
    image: "/figures/module-it-${module.id}.jpg",
    activities: ${module.units.length},
    units: [
`;
      module.units.forEach((unit) => {
        code += `      { us: "${unit.us}", title: "${unit.title.replace(/"/g, '\\"')}", nqf: ${unit.nqf}, credits: ${unit.credits}, dates: "${unit.dates}", time: "${unit.time}" },\n`;
      });
      code += `    ],
  },
`;
    });

    code += `];

export { meta, modules };
export const MODULES = modules;`;

    return code;
  };

  const downloadJSON = () => {
    const data = {
      modules: modules,
      exportedAt: new Date().toISOString(),
    };
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2))
    );
    element.setAttribute("download", "calendar-backup.json");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="calendar-editor">
      <div className="editor-header">
        <h1>📅 Training Calendar Editor</h1>
        <div className="header-buttons">
          <button onClick={downloadJSON} className="btn btn-backup">
            📥 Download Backup
          </button>
          <button onClick={saveChanges} className="btn btn-save">
            💾 Save Changes
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className={`save-status ${saveStatus.startsWith("✓") ? "success" : "error"}`}>
          {saveStatus}
        </div>
      )}

      <div className="editor-info">
        ℹ️ Click any cell to edit. Edit unit standards, dates, times, and credit values directly. Click 💾 Save Changes when done.
      </div>

      {modules.map((module) => (
        <div key={module.id} className="module-section">
          <div className="module-header">
            <span className="module-icon">👤</span>
            <h2>Module 1: {module.name}</h2>
          </div>

          <table className="calendar-table">
            <thead>
              <tr>
                <th className="col-us-id">US ID</th>
                <th className="col-title">UNIT STANDARD TITLE</th>
                <th className="col-dates">TRAINING DATES</th>
                <th className="col-time">TIME</th>
              </tr>
            </thead>
            <tbody>
              {module.units.map((unit, unitIndex) => (
                <tr key={unitIndex}>
                  <td className="col-us-id">
                    <span
                      className="us-id"
                      onClick={() =>
                        setEditingCell({ moduleId: module.id, unitIndex, field: "us" })
                      }
                    >
                      {editingCell?.moduleId === module.id &&
                      editingCell?.unitIndex === unitIndex &&
                      editingCell?.field === "us" ? (
                        <input
                          autoFocus
                          value={unit.us}
                          onChange={(e) =>
                            handleCellChange(module.id, unitIndex, "us", e.target.value)
                          }
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingCell(null);
                          }}
                          className="edit-input"
                        />
                      ) : (
                        unit.us
                      )}
                    </span>
                  </td>
                  <td className="col-title">
                    <span
                      className="unit-title"
                      onClick={() =>
                        setEditingCell({ moduleId: module.id, unitIndex, field: "title" })
                      }
                    >
                      {editingCell?.moduleId === module.id &&
                      editingCell?.unitIndex === unitIndex &&
                      editingCell?.field === "title" ? (
                        <input
                          autoFocus
                          value={unit.title}
                          onChange={(e) =>
                            handleCellChange(module.id, unitIndex, "title", e.target.value)
                          }
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingCell(null);
                          }}
                          className="edit-input"
                        />
                      ) : (
                        unit.title
                      )}
                    </span>
                  </td>
                  <td className="col-dates">
                    <span
                      className="training-dates"
                      onClick={() =>
                        setEditingCell({ moduleId: module.id, unitIndex, field: "dates" })
                      }
                    >
                      {editingCell?.moduleId === module.id &&
                      editingCell?.unitIndex === unitIndex &&
                      editingCell?.field === "dates" ? (
                        <input
                          autoFocus
                          value={unit.dates}
                          onChange={(e) =>
                            handleCellChange(module.id, unitIndex, "dates", e.target.value)
                          }
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingCell(null);
                          }}
                          className="edit-input"
                        />
                      ) : (
                        unit.dates
                      )}
                    </span>
                  </td>
                  <td className="col-time">
                    <span
                      className="time"
                      onClick={() =>
                        setEditingCell({ moduleId: module.id, unitIndex, field: "time" })
                      }
                    >
                      {editingCell?.moduleId === module.id &&
                      editingCell?.unitIndex === unitIndex &&
                      editingCell?.field === "time" ? (
                        <input
                          autoFocus
                          value={unit.time}
                          onChange={(e) =>
                            handleCellChange(module.id, unitIndex, "time", e.target.value)
                          }
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingCell(null);
                          }}
                          className="edit-input"
                        />
                      ) : (
                        unit.time
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="editor-footer">
        <button
          onClick={saveChanges}
          className="btn btn-save btn-large"
        >
          💾 Save All Changes
        </button>
      </div>
    </div>
  );
}
