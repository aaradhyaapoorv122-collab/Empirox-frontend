import React, { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api.js";
import { supabase } from "@/lib/supabaseClient";
import { BrainCore } from "@/utils/memoryEngine";

const MAX_CHARS = 1800;

const countries = {
  India: ["NCERT", "CBSE", "ICSE", "State Board"],
};

const modes = [
  { id: "short", label: "⚡ Short Revision" },
  { id: "medium", label: "📘 Medium Understanding" },
  { id: "bullet", label: "📝 Bullet Notes" },
  { id: "deep", label: "🧠 Deep Lesson Mode" },
];

export default function AiSummaryMode({ smartChatMemory = "" }) {
  const [country, setCountry] = useState("India");
  const [board, setBoard] = useState("NCERT");
  const [mode, setMode] = useState("short");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [typedOutput, setTypedOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [doubtInput, setDoubtInput] = useState("");
  const [doubtReply, setDoubtReply] = useState("");
  const [asking, setAsking] = useState(false);
const [savedSummaries, setSavedSummaries] = useState([]);
const [selectedSummary, setSelectedSummary] = useState(null);
const [loadingList, setLoadingList] = useState(false);
  /* ================= LOAD USER ================= */
  useEffect(() => {
  const init = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user || null;

    setCurrentUser(user);

    if (user?.id) {
      fetchSummaries(user.id);
    }
  };

  init();
}, []);
  /* ================= PREFILL ================= */
  useEffect(() => {
    if (smartChatMemory) setInput(smartChatMemory);
  }, [smartChatMemory]);

  /* ================= TYPE EFFECT ================= */
  useEffect(() => {
    let i = 0;
    setTypedOutput("");

    if (!output) return;

    const timer = setInterval(() => {
      i += 2;
      setTypedOutput(output.slice(0, i));
      if (i >= output.length) clearInterval(timer);
    }, 8);

    return () => clearInterval(timer);
  }, [output]);

  const remaining = useMemo(() => MAX_CHARS - input.length, [input]);

  /* ================= PROMPT ================= */
  const buildPrompt = () => `
You are Premium Study Notes AI.

Convert topic into structured student notes.

TOPIC:
${input}

BOARD: ${board}
COUNTRY: ${country}
MODE: ${mode}

RULES:
- Use headings
- Use bullets
- Add emojis
- Add memory tricks
- Exam-friendly format
- No long boring paragraphs
`;

  /* ================= MEMORY EXTRACT ================= */
  const extractKeyPoints = (text) => {
    return text
      .split("\n")
      .filter(
        (line) =>
          line.includes("•") ||
          line.includes("-") ||
          line.includes("⚡") ||
          line.includes("📌")
      )
      .slice(0, 5);
  };

  /* ================= SAFE BRAIN LOG ================= */
  const logToBrain = async (finalSummary) => {
    const user =
      currentUser ||
      JSON.parse(localStorage.getItem("user")) ||
      { id: "guest" };

    try {
      await BrainCore.log(user.id, "ai_summary", {
        topic: input,
        mode,
        board,
        country,
        summaryLength: finalSummary.length,
        keyInsights: extractKeyPoints(finalSummary),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.log("BrainCore log failed:", err);
    }
  };

  const fetchSummaries = async (userId) => {
  if (!userId) return;

  setLoadingList(true);

  try {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "summary_note")
      .order("id", { ascending: false });

    if (error) throw error;

    setSavedSummaries(data || []);
  } catch (err) {
    console.log("Fetch error:", err);
  }

  setLoadingList(false);
};

const deleteSummary = async (id) => {
  try {
    const { error } = await supabase
      .from("files")
      .delete()
      .eq("id", id);

    if (error) throw error;

    setSavedSummaries((prev) =>
      prev.filter((item) => item.id !== id)
    );

    if (selectedSummary?.id === id) {
      setSelectedSummary(null);
    }
  } catch (err) {
    console.log("Delete error:", err);
  }
};
  /* ================= GENERATE ================= */
  const generateSummary = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setOutput("");

    try {
      const response = await api.sendAIMessage({
        message: buildPrompt(),
        feature: "summary_ai",
        standard: "8",
        context: `Board:${board},Country:${country},Mode:${mode}`,
      });

      const result = response?.reply || response || "No summary generated.";
      setOutput(result);

      // SAFE MEMORY LOG (after AI response)
      setTimeout(() => {
        logToBrain(result);
      }, 500);
    } catch (e) {
      setOutput("⚠️ Failed to generate summary.");
    }

    setLoading(false);
  };

  /* ================= SAVE ================= */
  const saveSummary = async () => {
    if (!typedOutput.trim()) return;

    if (!currentUser?.id) {
      alert("Login required.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from("files").insert([
        {
          user_id: currentUser.id,
          title: `AI Summary - ${new Date().toLocaleDateString()}`,
          type: "summary_note",
          content: typedOutput,
        },
      ]);

      if (error) throw error;

      fetchSummaries();
    } catch (e) {
      alert("⚠️ Failed to save summary.");
    }

    setSaving(false);
  };

  /* ================= DOUBT SOLVER ================= */
  const askDoubt = async () => {
    if (!doubtInput.trim()) return;

    setAsking(true);
    setDoubtReply("");

    try {
      const response = await api.sendAIMessage({
        message: `
Student Notes:
${typedOutput}

Doubt:
${doubtInput}

Explain in simple student-friendly language.
        `,
        feature: "doubt_ai",
      });

      setDoubtReply(response?.reply || response || "No answer.");
    } catch (e) {
      setDoubtReply("⚠️ Failed to solve doubt.");
    }

    setAsking(false);
  };

  /* ================= UTILITIES ================= */
  const copyNotes = async () => {
    await navigator.clipboard.writeText(typedOutput);
    alert("📋 Copied!");
  };

  const downloadTxt = () => {
    const blob = new Blob([typedOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "AI-Summary-Notes.txt";
    a.click();

    URL.revokeObjectURL(url);
  };

  /* ================= UI ================= */
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>🧠 AI Summary PRO</h2>
        <p style={styles.sub}>Smart Notes • Doubts • Memory System</p>

        {/* SELECTORS */}
        <div style={styles.row}>
          <select
            style={styles.select}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setBoard(countries[e.target.value][0]);
            }}
          >
            {Object.keys(countries).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            style={styles.select}
            value={board}
            onChange={(e) => setBoard(e.target.value)}
          >
            {countries[country].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

           {/* SAVED SUMMARIES LIST */}
<div style={{ marginBottom: 18 }}>
  <h3 style={{ color: "#D4AF37", marginBottom: 10 }}>
    📚 Your Saved Summaries
  </h3>

  {loadingList ? (
    <p>Loading...</p>
  ) : savedSummaries.length === 0 ? (
    <p style={{ color: "#888" }}>No summaries yet</p>
  ) : (
    savedSummaries.map((item) => (
      <div
        key={item.id}
        style={{
          padding: 12,
          marginBottom: 10,
          borderRadius: 12,
          border: "1px solid rgba(255,215,0,0.15)",
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        {/* TITLE CLICK */}
        <div
          onClick={() => setSelectedSummary(item)}
          style={{ flex: 1 }}
        >
          <b style={{ color: "#EAEAEA" }}>
            📌 {item.title}
          </b>
          <div style={{ fontSize: 12, color: "#888" }}>
            {new Date(item.created_at).toLocaleString()}
          </div>
        </div>

        {/* DELETE */}
        <button
          onClick={() => deleteSummary(item.id)}
          style={{
            background: "transparent",
            border: "1px solid red",
            color: "red",
            padding: "6px 10px",
            borderRadius: 8,
          }}
        >
          🗑️
        </button>
      </div>
    ))
  )}
</div>
        {/* INPUT */}
        <textarea
          style={styles.textarea}
          value={input}
          placeholder="Paste lesson / chapter / topic..."
          onChange={(e) =>
            e.target.value.length <= MAX_CHARS && setInput(e.target.value)
          }
        />

        <div style={styles.counter}>{remaining} chars left</div>

        {/* MODES */}
        <div style={styles.modes}>
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                ...styles.modeBtn,
                ...(mode === m.id ? styles.activeMode : {}),
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* GENERATE */}
        <button
          style={styles.mainBtn}
          onClick={generateSummary}
          disabled={loading || !input.trim()}
        >
          {loading ? "⏳ Creating..." : "✨ Generate Smart Summary"}
        </button>

        {/* OUTPUT */}
        {typedOutput && (
          <div style={styles.outputBox}>
            <div style={styles.outputHeader}>📄 AI Summary</div>

            <div style={styles.outputContent}>
              <pre style={styles.pre}>{typedOutput}</pre>
            </div>

            <div style={styles.actions}>
              <button style={styles.saveBtn} onClick={saveSummary}>
                💾 Save
              </button>
              <button style={styles.askBtn} onClick={copyNotes}>
                📋 Copy
              </button>
              <button style={styles.askBtn} onClick={downloadTxt}>
                📥 Download
              </button>
            </div>

            {/* DOUBT */}
            <div style={{ padding: 14, borderTop: "1px solid #1e293b" }}>
              <textarea
                style={{ ...styles.textarea, minHeight: 90 }}
                placeholder="Ask doubt..."
                value={doubtInput}
                onChange={(e) => setDoubtInput(e.target.value)}
              />

              <button
                style={{ ...styles.mainBtn, marginTop: 10 }}
                onClick={askDoubt}
              >
                {asking ? "Solving..." : "❓ Ask Doubt"}
              </button>

              {doubtReply && (
                <div style={styles.doubtBox}>
                  <pre style={styles.pre}>{doubtReply}</pre>
                </div>
                
              )}
            </div>
          </div>
        )}
        {selectedSummary && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      zIndex: 999,
    }}
    onClick={() => setSelectedSummary(null)}
  >
    <div
      style={{
        maxWidth: 700,
        width: "100%",
        background: "#111",
        borderRadius: 16,
        padding: 20,
        border: "1px solid rgba(255,215,0,0.2)",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 style={{ color: "#D4AF37" }}>
        📄 {selectedSummary.title}
      </h3>

      <pre style={{ whiteSpace: "pre-wrap", color: "#EAEAEA" }}>
        {selectedSummary.content}
      </pre>

      <button
        onClick={() => setSelectedSummary(null)}
        style={{
          marginTop: 12,
          padding: 10,
          width: "100%",
          borderRadius: 10,
          background: "#D4AF37",
          border: "none",
          fontWeight: "bold",
        }}
      >
        Close
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  wrapper: {
    minHeight: "100vh",
    padding: 20,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0A0A0A",
  },

  card: {
    width: "100%",
    maxWidth: 820,
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255, 215, 0, 0.15)",
    borderRadius: 24,
    padding: 24,
    color: "#EAEAEA",
  },

  title: {
    textAlign: "center",
    fontSize: 28,
    color: "#D4AF37",
  },

  sub: {
    textAlign: "center",
    color: "#A8A8A8",
    marginBottom: 18,
  },

  row: {
    display: "flex",
    gap: 12,
  },

  select: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    background: "rgba(0,0,0,0.9)",
    color: "#EAEAEA",
    border: "1px solid rgba(255, 215, 0, 0.15)",
    outline: "none",
  },

  textarea: {
    width: "100%",
    minHeight: 160,
    padding: 14,
    borderRadius: 14,
    background: "rgba(0,0,0,0.9)",
    color: "#EAEAEA",
    border: "1px solid rgba(255, 215, 0, 0.15)",
    marginTop: 12,
    outline: "none",
  },

  counter: {
    textAlign: "right",
    fontSize: 12,
    color: "#D4AF37",
    opacity: 0.8,
  },

  modes: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 14,
  },

  modeBtn: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255, 215, 0, 0.2)",
    background: "rgba(0,0,0,0.7)",
    color: "#C8C8C8",
    transition: "0.2s",
  },

  activeMode: {
    background: "linear-gradient(135deg, #D4AF37, #8B6B00)",
    color: "#000",
    fontWeight: "bold",
  },

  mainBtn: {
    width: "100%",
    padding: 14,
    marginTop: 18,
    borderRadius: 14,
    border: "none",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #D4AF37, #8B6B00)",
    color: "#000",
    boxShadow: "0 0 12px rgba(255, 215, 0, 0.25)",
  },

  outputBox: {
    marginTop: 22,
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid rgba(255, 215, 0, 0.15)",
    background: "rgba(0,0,0,0.85)",
  },

  outputHeader: {
    padding: 14,
    fontWeight: "bold",
    background: "rgba(255, 215, 0, 0.08)",
    color: "#D4AF37",
    borderBottom: "1px solid rgba(255, 215, 0, 0.15)",
  },

  outputContent: {
    padding: 18,
    maxHeight: 420,
    overflowY: "auto",
    color: "#EAEAEA",
  },

  pre: {
    whiteSpace: "pre-wrap",
    margin: 0,
    lineHeight: 1.8,
  },

  actions: {
    display: "flex",
    gap: 10,
    padding: 14,
    borderTop: "1px solid rgba(255, 215, 0, 0.15)",
  },

  saveBtn: {
    flex: 1,
    padding: 12,
    background: "linear-gradient(135deg, #D4AF37, #8B6B00)",
    borderRadius: 12,
    border: "none",
    color: "#000",
    fontWeight: "bold",
  },

  askBtn: {
    flex: 1,
    padding: 12,
    background: "rgba(255, 215, 0, 0.12)",
    borderRadius: 12,
    border: "1px solid rgba(255, 215, 0, 0.2)",
    color: "#D4AF37",
    fontWeight: "bold",
  },

  doubtBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    background: "rgba(0,0,0,0.8)",
    border: "1px solid rgba(255, 215, 0, 0.15)",
    color: "#EAEAEA",
  },
};