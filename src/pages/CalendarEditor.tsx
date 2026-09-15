import { useState, useEffect } from "react";
import { IT_SYSTEMS_SUPPORT } from "../data/courses/it-systems-support";

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
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          borderBottom: "2px solid #ccc",
          paddingBottom: "10px",
        }}
      >
        <h1>📅 Training Calendar Editor</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={downloadJSON}
            style={{
              padding: "10px 15px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            📥 Download Backup
          </button>
          <button
            onClick={saveChanges}
            style={{
              padding: "10px 15px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            💾 Save Changes
          </button>
        </div>
      </div>

      {saveStatus && (
        <div
          style={{
            padding: "12px",
            marginBottom: "15px",
            backgroundColor: saveStatus.startsWith("✓") ? "#d4edda" : "#f8d7da",
            color: saveStatus.startsWith("✓") ? "#155724" : "#721c24",
            borderRadius: "4px",
            border: `1px solid ${saveStatus.startsWith("✓") ? "#c3e6cb" : "#f5c6cb"}`,
          }}
        >
          {saveStatus}
        </div>
      )}

      <div
        style={{
          backgroundColor: "#f9f9f9",
          padding: "15px",
          borderRadius: "4px",
          marginBottom: "20px",
          fontSize: "13px",
          color: "#666",
        }}
      >
        ℹ️ Click any cell to edit. Edit unit standards, dates, times, and credit values directly. Click 💾
        Save Changes when done.
      </div>

      {modules.map((module) => (
        <div key={module.id} style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#2196F3", marginBottom: "10px" }}>{module.name}</h2>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th style={tableHeaderStyle}>Unit Standard</th>
                  <th style={tableHeaderStyle}>Title</th>
                  <th style={tableHeaderStyle}>Dates</th>
                  <th style={tableHeaderStyle}>Time</th>
                  <th style={tableHeaderStyle}>NQF</th>
                  <th style={tableHeaderStyle}>Credits</th>
                </tr>
              </thead>
              <tbody>
                {module.units.map((unit, unitIndex) => (
                  <tr key={unitIndex} style={{ borderBottom: "1px solid #ddd" }}>
                    <td
                      onClick={() =>
                        setEditingCell({ moduleId: module.id, unitIndex, field: "us" })
                      }
                      style={getCellStyle(
                        editingCell?.moduleId === module.id &&
                          editingCell?.unitIndex === unitIndex &&
                          editingCell?.field === "us"
                      )}
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
                          style={inputStyle}
                        />
                      ) : (
                        unit.us
                      )}
                    </td>
                    <td
                      onClick={() =>
                        setEditingCell({ moduleId: module.id, unitIndex, field: "title" })
                      }
                      style={getCellStyle(
                        editingCell?.moduleId === module.id &&
                          editingCell?.unitIndex === unitIndex &&
                          editingCell?.field === "title"
                      )}
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
                          style={inputStyle}
                        />
                      ) : (
                        unit.title
                      )}
                    </td>
                    <td
                      onClick={() =>
                        setEditingCell({ moduleId: module.id, unitIndex, field: "dates" })
                      }
                      style={getCellStyle(
                        editingCell?.moduleId === module.id &&
                          editingCell?.unitIndex === unitIndex &&
                          editingCell?.field === "dates"
                      )}
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
                          style={inputStyle}
                        />
                      ) : (
                        <span style={{ fontWeight: "bold", color: "#d32f2f" }}>
                          {unit.dates}
                        </span>
                      )}
                    </td>
                    <td
                      onClick={() =>
                        setEditingCell({ moduleId: module.id, unitIndex, field: "time" })
                      }
                      style={getCellStyle(
                        editingCell?.moduleId === module.id &&
                          editingCell?.unitIndex === unitIndex &&
                          editingCell?.field === "time"
                      )}
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
                          style={inputStyle}
                        />
                      ) : (
                        unit.time
                      )}
                    </td>
                    <td
                      onClick={() =>
                        setEditingCell({ moduleId: module.id, unitIndex, field: "nqf" })
                      }
                      style={getCellStyle(
                        editingCell?.moduleId === module.id &&
                          editingCell?.unitIndex === unitIndex &&
                          editingCell?.field === "nqf"
                      )}
                    >
                      {editingCell?.moduleId === module.id &&
                      editingCell?.unitIndex === unitIndex &&
                      editingCell?.field === "nqf" ? (
                        <input
                          autoFocus
                          type="number"
                          value={unit.nqf}
                          onChange={(e) =>
                            handleCellChange(module.id, unitIndex, "nqf", e.target.value)
                          }
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingCell(null);
                          }}
                          style={inputStyle}
                        />
                      ) : (
                        unit.nqf
                      )}
                    </td>
                    <td
                      onClick={() =>
                        setEditingCell({
                          moduleId: module.id,
                          unitIndex,
                          field: "credits",
                        })
                      }
                      style={getCellStyle(
                        editingCell?.moduleId === module.id &&
                          editingCell?.unitIndex === unitIndex &&
                          editingCell?.field === "credits"
                      )}
                    >
                      {editingCell?.moduleId === module.id &&
                      editingCell?.unitIndex === unitIndex &&
                      editingCell?.field === "credits" ? (
                        <input
                          autoFocus
                          type="number"
                          value={unit.credits}
                          onChange={(e) =>
                            handleCellChange(module.id, unitIndex, "credits", e.target.value)
                          }
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingCell(null);
                          }}
                          style={inputStyle}
                        />
                      ) : (
                        unit.credits
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <button
          onClick={saveChanges}
          style={{
            padding: "15px 40px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          💾 Save All Changes
        </button>
      </div>
    </div>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "left",
  fontWeight: "bold",
  color: "#333",
  borderBottom: "2px solid #2196F3",
};

const getCellStyle = (isEditing: boolean): React.CSSProperties => ({
  padding: "10px",
  cursor: "pointer",
  backgroundColor: isEditing ? "#fff3cd" : "white",
  border: isEditing ? "2px solid #ffc107" : "1px solid #ddd",
  transition: "all 0.2s",
  userSelect: "none",
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px",
  border: "2px solid #2196F3",
  borderRadius: "3px",
  fontSize: "14px",
  fontFamily: "inherit",
};
