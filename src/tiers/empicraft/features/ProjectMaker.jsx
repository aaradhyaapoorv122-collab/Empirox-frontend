import React, { useEffect, useRef, useState } from "react";
import api from "../../../utils/api.js";

/* ---------------- CONSTANTS ---------------- */

const PROJECT_TYPES = [
  "2D Art",
  "3D Model",
  "Digital Design",
  "Practical Experiment",
  "Utility App",
  "Other",
];

const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
  "Computer Science",
  "Environmental Science",
  "Other",
];

/* ---------------- COMPONENT ---------------- */

export default function ProjectMakerAI() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [subject, setSubject] = useState("");
  const [projectType, setProjectType] = useState("");
  const [title, setTitle] = useState("");
  const [daysToComplete, setDaysToComplete] = useState(7);

  const [aiOverview, setAiOverview] = useState("");
  const [aiSteps, setAiSteps] = useState([]);
  const [aiMaterials, setAiMaterials] = useState([]);

  const [savedProjects, setSavedProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);

  /* ---------------- LOAD LOCAL PROJECTS ---------------- */

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("empirox_projects") || "[]"
      );
      setSavedProjects(saved);
    } catch {
      setSavedProjects([]);
    }
  }, []);

  /* ---------------- VOICE ---------------- */

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTitle((prev) => (prev ? prev + " " + text : text));
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      recognitionRef.current.start();
    }
  };

  /* ---------------- GENERATE AI ---------------- */

  const generateProjectAI = async () => {
    try {
      setLoading(true);

      const message = `
You are Empirox Project Builder AI.

User wants to build a school/student project.

Create a REAL useful project plan for ANY title user gives.

Subject: ${subject}
Project Type: ${projectType}
Project Title: ${title}
Days Available: ${daysToComplete}

Instructions:
- Understand title deeply
- If title is custom, still create project
- Give beginner-friendly explanation
- Make practical real-world project
- Steps should be clear
- Materials should be realistic
- Give output in exact format

OVERVIEW:
(Explain project in simple language)

STEPS:
1.
2.
3.
4.
5.

MATERIALS:
- item
- item
- item
`;

      const reply = await api.sendAIMessage({
        feature: "project_builder_ai",
        message,
      });

      const text = reply || "";

      const overviewMatch = text.match(/OVERVIEW:(.*?)(STEPS:|$)/is);
      const stepsMatch = text.match(/STEPS:(.*?)(MATERIALS:|$)/is);
      const materialsMatch = text.match(/MATERIALS:(.*)$/is);

      const overview = overviewMatch?.[1]?.trim() || text;

      const steps =
        stepsMatch?.[1]
          ?.split("\n")
          .map((line) =>
            line
              .replace(/^\d+[\).\s-]*/, "")
              .trim()
          )
          .filter(Boolean) || [];

      const materials =
        materialsMatch?.[1]
          ?.split("\n")
          .map((line) =>
            line.replace(/^[-•\s]*/, "").trim()
          )
          .filter(Boolean) || [];

      setAiOverview(overview);
      setAiSteps(steps);
      setAiMaterials(materials);

      setStep(2);
    } catch (error) {
      setAiOverview("AI is temporarily unavailable.");
      setAiSteps([]);
      setAiMaterials([]);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!subject || !projectType || !title.trim()) {
      alert("Please fill all fields.");
      return;
    }

    await generateProjectAI();
  };

  /* ---------------- SAVE ---------------- */

  const saveProject = () => {
    const newProject = {
      id: Date.now(),
      subject,
      type: projectType,
      title,
      overview: aiOverview,
      steps: aiSteps,
      materials: aiMaterials,
      createdAt: new Date().toLocaleString(),
    };

    const oldProjects = JSON.parse(
      localStorage.getItem("empirox_projects") || "[]"
    );

    const updated = [newProject, ...oldProjects];

    localStorage.setItem(
      "empirox_projects",
      JSON.stringify(updated)
    );

    setSavedProjects(updated);

    alert("Project Saved 🚀");
  };

  /* ---------------- DELETE ---------------- */

  const deleteProject = (id) => {
    const oldProjects = JSON.parse(
      localStorage.getItem("empirox_projects") || "[]"
    );

    const updated = oldProjects.filter((p) => p.id !== id);

    localStorage.setItem(
      "empirox_projects",
      JSON.stringify(updated)
    );

    setSavedProjects(updated);

    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div style={pageStyle}>
      {/* SIDEBAR */}
      <div style={sidebarStyle}>
        <h3 style={{ color: "#d4af37" }}>📁 Saved Projects</h3>

        {savedProjects.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No Projects Yet</p>
        ) : (
          savedProjects.map((p) => (
            <div key={p.id} style={projectItem}>
              <div
                style={{ cursor: "pointer", fontWeight: 700 }}
                onClick={() => setSelectedProject(p)}
              >
                {p.title.length > 28
                  ? p.title.slice(0, 28) + "..."
                  : p.title}
              </div>

              <button
                style={deleteBtn}
                onClick={() => deleteProject(p.id)}
              >
                ❌
              </button>
            </div>
          ))
        )}
      </div>

      {/* MAIN */}
      <div style={wrapperStyle}>
        <div style={cardStyle}>
          {/* SELECTED PROJECT */}
          {selectedProject && (
            <div style={{ marginBottom: 30 }}>
              <h2 style={{ color: "#d4af37" }}>
                {selectedProject.title}
              </h2>

              <p>
                <b>Subject:</b> {selectedProject.subject}
              </p>

              <p>
                <b>Type:</b> {selectedProject.type}
              </p>

              <h3>Overview</h3>
              <p>{selectedProject.overview}</p>

              <h3>Steps</h3>
              <ul>
                {selectedProject.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              <h3>Materials</h3>
              <ul>
                {selectedProject.materials.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>

              <button
                style={primaryBtn}
                onClick={() => setSelectedProject(null)}
              >
                Close
              </button>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 ? (
            <>
              <h1 style={headerTitle}>
                ⚡ Project Maker AI
              </h1>

              <select
                style={inputStyle}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">Select Subject</option>

                {SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>

              <select
                style={inputStyle}
                value={projectType}
                onChange={(e) =>
                  setProjectType(e.target.value)
                }
              >
                <option value="">
                  Select Project Type
                </option>

                {PROJECT_TYPES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>

              <input
                style={inputStyle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter any project title"
              />

              <button
                style={primaryBtn}
                onClick={startListening}
              >
                {listening
                  ? "🎙 Listening..."
                  : "🎤 Voice Input"}
              </button>

              <input
                type="number"
                style={inputStyle}
                min="1"
                value={daysToComplete}
                onChange={(e) =>
                  setDaysToComplete(e.target.value)
                }
              />

              <button
                style={primaryBtn}
                onClick={handleGenerate}
              >
                {loading
                  ? "Generating..."
                  : "Generate Project 🚀"}
              </button>
            </>
          ) : (
            <>
              {/* STEP 2 */}
              <h2 style={{ color: "#d4af37" }}>
                AI Project Plan
              </h2>

              <p>{aiOverview}</p>

              <h3>Steps</h3>
              <ul>
                {aiSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              <h3>Materials</h3>
              <ul>
                {aiMaterials.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>

              <button
                style={primaryBtn}
                onClick={saveProject}
              >
                💾 Save Project
              </button>

              <button
                style={primaryBtn}
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const pageStyle = {
  display: "flex",
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, #111 0%, #050505 60%, #000 100%)",
  color: "#f5d76e",
};

const sidebarStyle = {
  width: "260px",
  padding: "16px",
  borderRight: "1px solid rgba(212,175,55,0.2)",
  background: "rgba(10,10,10,0.92)",
};

const projectItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px",
  borderBottom:
    "1px solid rgba(212,175,55,0.15)",
};

const wrapperStyle = {
  flex: 1,
  padding: "20px",
};

const cardStyle = {
  background: "rgba(255,255,255,0.03)",
  border:
    "1px solid rgba(212,175,55,0.25)",
  borderRadius: "22px",
  padding: "24px",
  boxShadow:
    "0 0 30px rgba(212,175,55,0.08)",
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  margin: "10px 0",
  borderRadius: "14px",
  border:
    "1px solid rgba(212,175,55,0.25)",
  background: "#0a0a0a",
  color: "#f5d76e",
  outline: "none",
};

const primaryBtn = {
  padding: "14px 18px",
  marginTop: "10px",
  marginRight: "10px",
  borderRadius: "14px",
  border: "none",
  fontWeight: "700",
  cursor: "pointer",
  color: "#0b0b0b",
  background:
    "linear-gradient(90deg,#d4af37,#ffb347)",
};

const deleteBtn = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
};

const headerTitle = {
  fontSize: "34px",
  fontWeight: "800",
  color: "#f5d76e",
};