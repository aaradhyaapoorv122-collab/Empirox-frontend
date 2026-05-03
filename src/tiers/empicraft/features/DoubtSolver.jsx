import React, { useState, useRef, useEffect, useContext } from "react";
import api from "../../../utils/api.js";
import { supabase } from "@/lib/supabaseClient";
import { BrainCore } from "@/utils/memoryEngine";
import { AuthContext } from "../../../context/AuthContext";

export default function AIDoubtResolver() {
  const fileInputRef = useRef(null);
    const { user } = useContext(AuthContext);
   const [question, setQuestion] = useState("");
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState("");
 const [savedNotes, setSavedNotes] = useState([]);
const [selectedSaved, setSelectedSaved] = useState(null);

  /* ================= TOAST ================= */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  /* ================= LOAD SAVED ================= */
  useEffect(() => {
  const saved = localStorage.getItem("doubt_saved_notes");
  if (saved) {
    try {
      setSavedNotes(JSON.parse(saved));
    } catch {}
  }
}, []);
  /* ================= FILE READ ================= */
  const readFile = async (file) => {
    if (!file) return;

    try {
      const text = await file.text();
      setFileText(text);
      setFileName(file.name);
      showToast("📄 File uploaded successfully");
    } catch {
      showToast("⚠️ Could not read file");
    }
  };

  /* ================= FILE SELECT ================= */
  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    readFile(file);
  };

  /* ================= DRAG DROP ================= */
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    readFile(file);
  };

  /* ================= ASK AI ================= */
  const handleAsk = async () => {
  if (!question.trim() && !fileText.trim()) {
    showToast("❗ Type question or upload file");
    return;
  }

  setLoading(true);

  let replyText = "";

  try {
    // 🔥 BUILD HISTORY (IMPORTANT FIX)
    const history = [
      {
        role: "user",
        content: question + "\n\n" + fileText,
      },
    ];

    const reply = await api.sendAIMessage({
      message: question,
      feature: "solver_ai",
      standard: user?.className || "8",

      // 🔥 IMPORTANT: ADD HISTORY LIKE SMARTCHAT
      history,

      context: `
Empirox AI Doubt Solver.

Rules:
- Explain step-by-step like a teacher
- Simple language
- Clear reasoning
- Give examples if needed
- No extra text
      `,
    });

    // ✅ SAFE RESPONSE NORMALIZER (same as SmartChat)
    const finalReply =
      typeof reply === "string"
        ? reply
        : reply?.reply ||
          reply?.result ||
          reply?.data ||
          JSON.stringify(reply);

    replyText = finalReply;

    const newAnswer = {
      id: Date.now(),
      q: question || `Doubt from ${fileName}`,
      a: replyText,
      time: new Date().toLocaleTimeString(),
    };

    setAnswers((prev) => [newAnswer, ...prev]);

    setQuestion("");
    setFileText("");
    setFileName("");

    // 🔥 MEMORY LOG (SAFE)
    if (user?.id) {
      await BrainCore.log(user.id, "doubt_resolver", {
        question,
        answer: replyText,
        hasFile: !!fileText,
        timestamp: new Date().toISOString(),
      });
    }

  } catch (err) {
    console.log("🔥 AI ERROR:", err);

    showToast("⚠️ AI temporarily unavailable");

    setAnswers((prev) => [
      {
        id: Date.now(),
        q: question || "Unknown question",
        a: "⚠️ AI failed. Please try again.",
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  }

  setLoading(false);
};
  /* ================= COPY ================= */
  const copyAnswer = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("📋 Copied");
    } catch {
      showToast("⚠️ Copy failed");
    }
  };

  /* ================= ASK AGAIN ================= */
  const askAgain = (q) => {
    setQuestion(q);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("✍️ Question loaded");
  };

  /* ================= SAVE ================= */
 const saveAnswer = (item) => {
  if (!item) return;

  const old = JSON.parse(localStorage.getItem("doubt_saved_notes") || "[]");

  const newItem = {
    id: item.id || Date.now(),
    q: item.q || "Untitled question",
    a: item.a || "No answer",
    time: item.time || new Date().toLocaleTimeString(),
  };

  const updated = [newItem, ...old];

  localStorage.setItem("doubt_saved_notes", JSON.stringify(updated));
  setSavedNotes(updated);

  showToast("💾 Saved to sidebar");
};
const deleteSaved = (id) => {
  const old = JSON.parse(localStorage.getItem("doubt_saved_notes") || "[]");

  const updated = old.filter((item) => item.id !== id);

  localStorage.setItem("doubt_saved_notes", JSON.stringify(updated));
  setSavedNotes(updated);

  showToast("🗑️ Deleted from sidebar");
};

  return (
  <div style={styles.page}>
    {toast && <div style={styles.toast}>{toast}</div>}

    <div style={styles.container}>

      <div style={styles.layout}>

        {/* SIDEBAR */}
        <div style={styles.sidebar}>
          <h3 style={{ color: "#facc15" }}>📚 Saved Doubts</h3>

          {savedNotes.length === 0 ? (
            <p style={{ opacity: 0.6 }}>No saved doubts yet</p>
          ) : (
            savedNotes.map((item) => (
              <div
                key={item.id}
                style={styles.savedItem}
              >
                <div
                  style={{ fontWeight: 700, cursor: "pointer" }}
                  onClick={() => setSelectedSaved(item)}
                >
                  {(item.q || "No question").slice(0, 40)}...
                </div>

                <button
                  style={styles.deleteMini}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSaved(item.id);
                  }}
                >
                  ❌
                </button>
              </div>
            ))
          )}
        </div>

        {/* MAIN AREA */}
        <div style={styles.main}>

          {/* HEADER */}
          <div style={styles.header}>
            <h1 style={styles.title}>👑 AI Doubt Resolver</h1>
            <p style={styles.subtitle}>
              Premium instant teacher for Maths, Science, English & more
            </p>
          </div>

          {selectedSaved && (
  <div style={styles.card}>
    <h3 style={{ color: "#facc15" }}>📌 Saved Question</h3>

    <div style={styles.question}>
      <strong>❓ Question:</strong> {selectedSaved.q}
    </div>

    <div style={styles.answer}>
      <strong>🧠 Answer:</strong>
      <div style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
        {selectedSaved.a}
      </div>
    </div>

    <button
      style={styles.smallBtn}
      onClick={() => setSelectedSaved(null)}
    >
      ❌ Close
    </button>
  </div>
)}

          {/* INPUT CARD */}
          <div style={styles.card}>

            {/* DROP ZONE */}
            <div
              style={{
                ...styles.dropZone,
                borderColor: dragOver ? "#facc15" : "#3f3f46",
                background: dragOver ? "#2a2208" : "#161616",
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleSelectFile}
              />

              {fileName ? (
                <div>
                  <div style={styles.fileOk}>📄 {fileName}</div>
                  <div style={styles.fileSub}>Tap to change file</div>
                </div>
              ) : (
                <div>
                  <div style={styles.fileMain}>📎 Upload or Drop File</div>
                  <div style={styles.fileSub}>
                    Notes / Worksheet / Question Paper
                  </div>
                </div>
              )}
            </div>

            {/* QUESTION */}
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your doubt here..."
              style={styles.textarea}
            />

            <button
              onClick={handleAsk}
              disabled={loading}
              style={{
                ...styles.mainBtn,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "🤖 Solving..." : "✨ Solve My Doubt"}
            </button>

          </div>

          {/* ANSWERS */}
          <div style={styles.answerWrap}>
            {answers.length === 0 ? (
              <div style={styles.empty}>
                Your solved doubts will appear here 🚀
              </div>
            ) : (
              answers.map((item) => (
                <div key={item.id} style={styles.answerCard}>

                  {/* TOP */}
                  <div style={styles.answerTop}>
                    <span style={styles.badge}>Solved</span>
                    <span style={styles.time}>{item.time}</span>
                  </div>

                  {/* QUESTION */}
                  <div style={styles.question}>
                    <strong>❓ Question:</strong> {item.q}
                  </div>

                  {/* ANSWER */}
                  <div style={styles.answer}>
                    <strong>🧠 Answer:</strong>
                    <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                      {item.a}
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div style={styles.btnRow}>

                    <button
                      style={styles.smallBtn}
                      onClick={() => copyAnswer(item.a)}
                    >
                      📋 Copy
                    </button>

                    <button
                      style={styles.smallBtn}
                      onClick={() => askAgain(item.q)}
                    >
                      🔁 Ask Again
                    </button>

                    <button
                      style={styles.smallBtn}
                      onClick={() => saveAnswer(item)}
                    >
                      💾 Save
                    </button>

                      {/* NEW DELETE BUTTON */}
  <button
    style={{
      ...styles.smallBtn,
      border: "1px solid red",
      color: "red",
    }}
    onClick={() =>
      setAnswers((prev) => prev.filter((x) => x.id !== item.id))
    }
  >
    🗑️ Delete
  </button>

                  </div>

                </div>
              ))
            )}
          </div>

        </div> {/* MAIN END */}

      </div> {/* LAYOUT END */}

    </div> {/* CONTAINER END */}

  </div>
);
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #2a1f00 0%, #0b0b0b 45%, #050505 100%)",
    padding: 20,
    fontFamily: "Inter, sans-serif",
    color: "white",
  },

  container: {
    maxWidth: 920,
    margin: "0 auto",
  },

  header: {
    textAlign: "center",
    marginBottom: 22,
  },

  title: {
    margin: 0,
    fontSize: 34,
    color: "#facc15",
    fontWeight: 800,
  },

  subtitle: {
    marginTop: 8,
    color: "#d4d4d8",
  },

  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(250,204,21,0.18)",
    borderRadius: 22,
    padding: 20,
    backdropFilter: "blur(12px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
  },

  dropZone: {
    border: "2px dashed",
    borderRadius: 18,
    padding: 24,
    textAlign: "center",
    cursor: "pointer",
    transition: "0.2s",
    marginBottom: 16,
  },

  fileMain: {
    fontSize: 18,
    color: "#facc15",
    fontWeight: 700,
  },

  fileSub: {
    fontSize: 13,
    color: "#a1a1aa",
    marginTop: 6,
  },

  fileOk: {
    fontSize: 16,
    color: "#4ade80",
    fontWeight: 700,
  },

  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 16,
    border: "1px solid #3f3f46",
    background: "#101010",
    color: "white",
    padding: 16,
    resize: "vertical",
    outline: "none",
    fontSize: 15,
  },

  mainBtn: {
    width: "100%",
    marginTop: 16,
    padding: 15,
    borderRadius: 16,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg,#facc15,#eab308)",
    color: "#111",
    fontWeight: 800,
    fontSize: 16,
  },

  answerWrap: {
    marginTop: 22,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  empty: {
    textAlign: "center",
    padding: 30,
    opacity: 0.7,
  },

  answerCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(250,204,21,0.15)",
    borderRadius: 20,
    padding: 18,
  },

  answerTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  badge: {
    background: "#facc15",
    color: "#111",
    fontSize: 12,
    fontWeight: 800,
    padding: "5px 10px",
    borderRadius: 20,
  },

  time: {
    color: "#a1a1aa",
    fontSize: 12,
  },

  question: {
    marginBottom: 14,
    color: "#fde68a",
  },

  answer: {
    lineHeight: 1.7,
    color: "#f4f4f5",
  },

  btnRow: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 10,
  },

  smallBtn: {
    padding: 11,
    borderRadius: 12,
    border: "1px solid #facc15",
    background: "transparent",
    color: "#facc15",
    cursor: "pointer",
    fontWeight: 700,
  },

  toast: {
    position: "fixed",
    top: 18,
    right: 18,
    background: "#111",
    border: "1px solid #facc15",
    color: "#facc15",
    padding: "10px 14px",
    borderRadius: 12,
    zIndex: 999,
    fontWeight: 700,
  },
  layout: {
  display: "flex",
  gap: 20,
},

sidebar: {
  width: 260,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(250,204,21,0.2)",
  borderRadius: 16,
  padding: 14,
  height: "80vh",
  overflowY: "auto",
  position: "sticky",
  top: 20,
},

main: {
  flex: 1,
},

savedItem: {
  padding: 10,
  borderBottom: "1px solid #333",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
},

deleteMini: {
  background: "transparent",
  border: "none",
  color: "red",
  cursor: "pointer",
},
};