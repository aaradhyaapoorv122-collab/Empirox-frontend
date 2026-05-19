import React, { useState, useEffect, useRef } from "react";


/* ================= AI MODES ================= */
const AI_MODES = {
  TEACHER: "teacher",
  EXAMINER: "examiner",
  COACH: "coach",
  PSYCHOLOGIST: "psychologist",
};

/* ================= MAIN ================= */
export default function SkillHubAI_OS() {
  const [skill, setSkill] = useState("");
  const [activeSkill, setActiveSkill] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(""); // 🔥 NEW
  const [aiMode, setAiMode] = useState(AI_MODES.TEACHER);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const chatRef = useRef(null);

  /* ================= LOADING STEPS ================= */
  const setAIProgress = async () => {
    setLoading(true);

    setLoadingStage("🧠 Initializing AI Brain...");
    await wait(700);

    setLoadingStage("📚 Analyzing Skill Structure...");
    await wait(900);

    setLoadingStage("📅 Building Learning Roadmap...");
    await wait(1200);

    setLoadingStage("🧩 Creating Daily Study System...");
    await wait(900);

    setLoadingStage("💾 Saving AI Memory Model...");
    await wait(800);
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ================= CREATE SKILL ================= */
  const createSkillBrain = async () => {
    if (!skill.trim()) return;

    await setAIProgress(); // 🔥 SHOW LOADING PHASES

    try {
      const res = await api.sendAI({
        feature: "skillhub_os_v6",
        message: `
You are SkillHub AI OS.

Create full structured learning system:

Skill: ${skill}

Include:
- 30 day roadmap
- psychological learning model
- daily plan
- exam system
- beginner to mastery path
        `,
      });

      setActiveSkill({
        name: skill,
        roadmap: res,
        progress: 0,
        mastery: 1,
      });

      setMessages([{ from: "ai", text: res }]);

    } catch (e) {
      setMessages([{ from: "ai", text: "AI Brain failed to initialize ❌" }]);
    }

    setLoading(false);
    setLoadingStage("");
  };

  /* ================= ASK AI ================= */
  const askAI = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");

    setMessages((p) => [...p, { from: "user", text: userMsg }]);

    setLoading(true);
    setLoadingStage("🧠 Thinking like a teacher...");

    try {
      const res = await api.sendAI({
        feature: "skillhub_tutor_v6",
        message: `
Skill: ${activeSkill?.name}
Mode: ${aiMode}
User: ${userMsg}

Act as psychological AI teacher.
Explain step-by-step.
        `,
      });

      setMessages((p) => [...p, { from: "ai", text: res }]);

    } catch {
      setMessages((p) => [...p, { from: "ai", text: "AI error" }]);
    }

    setLoading(false);
    setLoadingStage("");
  };

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>🧠 SkillHub AI OS</h1>
        <p style={styles.subtitle}>Psychological AI Tutor System</p>
      </div>

      {/* CREATE SKILL */}
      {!activeSkill && (
        <div style={styles.card}>
          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Enter skill (Python, Math, Speaking...)"
            style={styles.input}
            disabled={loading}
          />

          {/* 🔥 BUTTON WITH REAL FEEDBACK */}
          <button
            onClick={createSkillBrain}
            style={{
              ...styles.mainBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "⚡ Building AI Brain..." : "🚀 Build AI Learning Brain"}
          </button>

          {/* 🔥 LIVE AI STATUS */}
          {loading && (
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
              <div style={styles.loadingText}>{loadingStage}</div>
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD */}
      {activeSkill && (
        <div style={styles.panel}>
          <h2 style={{ color: "#facc15" }}>📘 {activeSkill.name}</h2>

          {/* CHAT */}
          <div ref={chatRef} style={styles.chatBox}>
            {messages.map((m, i) => (
              <div key={i} style={m.from === "user" ? styles.user : styles.ai}>
                {m.text}
              </div>
            ))}

            {loading && (
              <div style={styles.ai}>
                🧠 {loadingStage}
              </div>
            )}
          </div>

          {/* INPUT */}
          <div style={styles.inputRow}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI teacher..."
              style={styles.input}
              disabled={loading}
            />

            <button
              onClick={askAI}
              style={styles.mainBtn}
              disabled={loading}
            >
              Send
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

/* ================= UI ================= */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0b",
    color: "white",
    padding: 20,
    fontFamily: "Arial",
  },

  header: { textAlign: "center", marginBottom: 20 },

  title: { color: "#facc15", fontSize: 34 },

  subtitle: { opacity: 0.7 },

  card: {
    maxWidth: 500,
    margin: "auto",
    padding: 20,
    background: "#111",
    borderRadius: 15,
    border: "1px solid #333",
  },

  input: {
    width: "100%",
    padding: 12,
    background: "#000",
    border: "1px solid #333",
    color: "white",
    borderRadius: 10,
    marginBottom: 10,
  },

  mainBtn: {
    width: "100%",
    padding: 12,
    background: "#facc15",
    border: "none",
    fontWeight: "bold",
    borderRadius: 10,
  },

  panel: {
    maxWidth: 900,
    margin: "auto",
    background: "#111",
    padding: 20,
    borderRadius: 12,
  },

  chatBox: {
    height: 400,
    overflowY: "auto",
    background: "#000",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
  },

  user: { textAlign: "right", color: "#facc15", margin: 5 },
  ai: { textAlign: "left", color: "#ccc", margin: 5 },

  inputRow: {
    display: "flex",
    gap: 10,
  },

  /* 🔥 NEW LOADING UI */
  loadingBox: {
    marginTop: 15,
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#facc15",
  },

  loadingText: {
    fontSize: 14,
  },

  spinner: {
    width: 18,
    height: 18,
    border: "2px solid #333",
    borderTop: "2px solid #facc15",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};