import React, { useState, useEffect, useRef } from "react";
import api from "../../../utils/api.js";
import { BrainCore } from "@/utils/memoryEngine";

export default function StudyPlanner() {
  const logBrain = async (data) => {
  try {
    const user =
      JSON.parse(localStorage.getItem("user")) || { id: "guest" };

    await BrainCore.log(user.id, "study_planner_v3", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.log("BrainCore log failed:", err);
  }
};

  const [form, setForm] = useState({
    standard: "8",
    goal: "Upcoming Exam",
    mode: "Balanced",
    subjects: ["Math", "Science", "English", "Social Science"],
    customSubject: "",
    weakSubject: "Math",
    examDays: "15",

    schoolFrom: "12:00",
    schoolTo: "18:00",

    tuitionFrom: "18:30",
    tuitionTo: "20:30",

    slots: [
      { from: "07:00", to: "09:00" },
      { from: "09:30", to: "11:00" },
      { from: "21:00", to: "22:30" },
    ],
  });
const [savedPlans, setSavedPlans] = useState([]);
const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState([]);
  const [error, setError] = useState("");


  /* ================= UPDATE ================= */
  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* ================= TIME HELPERS ================= */
  const toMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const toTime = (mins) => {
    const h = Math.floor(mins / 60)
      .toString()
      .padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  /* ================= SUBJECTS ================= */
  const addSubject = () => {
    const val = form.customSubject.trim();
    if (!val) return;

    if (form.subjects.includes(val)) {
      update("customSubject", "");
      return;
    }

    update("subjects", [...form.subjects, val]);
    update("customSubject", "");
  };

  const removeSubject = (subject) => {
    update(
      "subjects",
      form.subjects.filter((s) => s !== subject)
    );

    if (form.weakSubject === subject) {
      update("weakSubject", "Math");
    }
  };

  

  /* ================= SLOT HANDLER ================= */
  const addSlot = () => {
    update("slots", [...form.slots, { from: "06:00", to: "07:00" }]);
  };

  const updateSlot = (index, key, value) => {
    const copy = [...form.slots];
    copy[index][key] = value;
    update("slots", copy);
  };

  const removeSlot = (index) => {
    const copy = [...form.slots];
    copy.splice(index, 1);
    update("slots", copy);
  };

  /* ================= SAFE JSON ================= */
  const extractJSON = (text) => {
    try {
      if (!text) return [];
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

      const start = cleaned.indexOf("[");
      const end = cleaned.lastIndexOf("]");

      if (start === -1 || end === -1) return [];

      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return [];
    }
  };

  /* ================= SESSION TYPE ================= */
  const getSessionType = (subject, mins) => {
    if (subject === form.weakSubject) return "Weak Subject Recovery";

    if (mins >= 45) return "Deep Focus";

    return "Quick Revision";
  };

  /* ================= BREAK TYPE ================= */
  const getBreak = () => {
    const arr = [
      "Water + Walk",
      "Eye Relax",
      "Deep Breathing",
      "Stretch Break",
      "Fresh Air Reset",
    ];

    return arr[Math.floor(Math.random() * arr.length)];
  };

  /* ================= FALLBACK PLAN ================= */
  const buildFallbackPlan = () => {
    let finalPlan = [];
    let subjectIndex = 0;

    const orderedSubjects = [
      form.weakSubject,
      ...form.subjects.filter((s) => s !== form.weakSubject),
    ];

    form.slots.forEach((slot) => {
      let start = toMinutes(slot.from);
      const end = toMinutes(slot.to);

      while (start < end) {
        const remain = end - start;
        if (remain < 20) break;

        const session =
          form.mode === "Intense"
            ? Math.min(50, remain)
            : form.mode === "Light"
            ? Math.min(30, remain)
            : Math.min(40, remain);

        const sub = orderedSubjects[subjectIndex % orderedSubjects.length];

        finalPlan.push({
          start: toTime(start),
          end: toTime(start + session),
          subject: sub,
          task: getSessionType(sub, session),
          method:
            start < 540
              ? "Peak Brain Hours"
              : start >= 1260
              ? "Night Revision Zone"
              : "Standard Focus",
        });

        start += session;

        if (start < end) {
          const breakTime = Math.min(10, end - start);

          finalPlan.push({
            start: toTime(start),
            end: toTime(start + breakTime),
            subject: "Break",
            task: getBreak(),
            method: "Recovery",
          });

          start += breakTime;
        }

        subjectIndex++;
      }
    });

    return finalPlan;
  };

  useEffect(() => {
  const data = localStorage.getItem("study_plans");
  if (data) {
    setSavedPlans(JSON.parse(data));
  }
}, []);

/* ================= SAVE PLAN ================= */
const savePlan = () => {
  const newPlan = {
    id: Date.now(),
    subject: form.subjects,
    weakSubject: form.weakSubject,
    mode: form.mode,
    goal: form.goal,
    plan: plan,
    time: new Date().toLocaleString(),
  };

  const old = JSON.parse(localStorage.getItem("study_plans") || "[]");
  const updated = [newPlan, ...old];

  localStorage.setItem("study_plans", JSON.stringify(updated));
  setSavedPlans(updated);
};

/* ================= DELETE PLAN ================= */
const deletePlan = (id) => {
  const old = JSON.parse(localStorage.getItem("study_plans") || "[]");
  const updated = old.filter((p) => p.id !== id);

  localStorage.setItem("study_plans", JSON.stringify(updated));
  setSavedPlans(updated);
};
  /* ================= GENERATE ================= */
  const generatePlan = async () => {
    setLoading(true);
    setError("");
    setPlan([]);

    try {
      const reply = await api.sendAIMessage({
        feature: "planner_ai",
        context: "Empirox Smart Study Planner",
        standard: form.standard,
        message: `
Create realistic student study schedule.

Return ONLY JSON array.

Class: ${form.standard}
Goal: ${form.goal}
Mode: ${form.mode}
Subjects: ${form.subjects.join(", ")}
Weak Subject: ${form.weakSubject}
Exam In: ${form.examDays} days

Study Slots:
${form.slots.map((s) => `${s.from} to ${s.to}`).join(", ")}

Rules:
- Use study blocks only
- Use breaks
- Weak subject priority
- Morning = hard work
- Night = revision
- No fake chapters/topics

Format:
[
 {
   "start":"07:00",
   "end":"07:40",
   "subject":"Math",
   "task":"Deep Focus",
   "method":"Peak Brain Hours"
 }
]
        `,
      });

      const parsed = extractJSON(reply);

      if (Array.isArray(parsed) && parsed.length > 0) {
        setPlan(parsed);
      } else {
        setPlan(buildFallbackPlan());
      }
    } catch {
      setError("AI unavailable. Smart planner generated.");
      setPlan(buildFallbackPlan());
    }
    await logBrain({
  type: "plan_generated",
  class: form.standard,
  goal: form.goal,
  mode: form.mode,
  weakSubject: form.weakSubject,
  subjects: form.subjects,
  totalSlots: form.slots.length,
  status: "success"
});




    setLoading(false);
  };

  /* ================= UI ================= */
  return (
  <div style={styles.page}>
    
    {/* HEADER */}
    <div style={styles.header}>
      <h1 style={styles.title}>📘 EMPIROX Study Brain</h1>
      <p style={styles.sub}>
        AI-powered adaptive learning planner with memory system
      </p>
    </div>

    {/* MAIN GRID */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 420px 1fr",
        gap: 20,
      }}
    >

      {/* ================= SIDEBAR (BRAIN MEMORY) ================= */}
      <div style={styles.card}>
        <h3 style={{ color: "#D4AF37", marginBottom: 10 }}>
          🧠 Memory Vault
        </h3>

        {savedPlans.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No saved plans yet</p>
        ) : (
          savedPlans.map((p) => (
            <div
              key={p.id}
              style={{
                padding: 12,
                marginBottom: 10,
                borderRadius: 10,
                border: "1px solid rgba(212,175,55,0.2)",
                cursor: "pointer",
                background:
                  selectedPlan?.id === p.id
                    ? "rgba(212,175,55,0.08)"
                    : "transparent",
              }}
              onClick={() => setSelectedPlan(p)}
            >
              <div style={{ fontWeight: "bold", color: "#fff" }}>
                🎯 {p.goal}
              </div>

              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {p.time}
              </div>

              <button
                style={{
                  marginTop: 6,
                  background: "transparent",
                  border: "none",
                  color: "#ff4d4d",
                  cursor: "pointer",
                  fontSize: 12,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  deletePlan(p.id);
                }}
              >
                🗑 Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* ================= BUILDER PANEL ================= */}
      <div style={styles.card}>
        <h3 style={styles.section}>🎯 Planner Core</h3>

        <label style={styles.label}>Class</label>
        <input
          style={styles.input}
          value={form.standard}
          onChange={(e) => update("standard", e.target.value)}
        />

        <label style={styles.label}>Goal</label>
        <select
          style={styles.input}
          value={form.goal}
          onChange={(e) => update("goal", e.target.value)}
        >
          <option>Upcoming Exam</option>
          <option>Daily Revision</option>
          <option>Deep Learning</option>
        </select>

        <label style={styles.label}>Mode</label>
        <select
          style={styles.input}
          value={form.mode}
          onChange={(e) => update("mode", e.target.value)}
        >
          <option>Balanced</option>
          <option>Intense</option>
          <option>Light</option>
        </select>

        <label style={styles.label}>Subjects</label>

        <div style={styles.row}>
          <input
            style={styles.input}
            value={form.customSubject}
            onChange={(e) => update("customSubject", e.target.value)}
            placeholder="Add subject"
          />
          <button style={styles.smallBtn} onClick={addSubject}>
            +
          </button>
        </div>

        <div style={styles.tags}>
          {form.subjects.map((s) => (
            <span key={s} style={styles.tag}>
              {s}
              <button
                style={styles.remove}
                onClick={() => removeSubject(s)}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <label style={styles.label}>Weak Subject</label>
        <select
          style={styles.input}
          value={form.weakSubject}
          onChange={(e) => update("weakSubject", e.target.value)}
        >
          {form.subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <label style={styles.label}>Exam Days</label>
        <input
          style={styles.input}
          value={form.examDays}
          onChange={(e) => update("examDays", e.target.value)}
        />
        {/* ================= TIME BLOCK SECTION ================= */}
<label style={styles.label}>⏰ Time Blocks</label>

<div style={{ marginTop: 10 }}>

  {form.slots.map((slot, index) => (
    <div
      key={index}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        marginBottom: 10,
        padding: 10,
        borderRadius: 10,
        border: "1px solid rgba(255, 215, 0, 0.15)",
      }}
    >
      {/* FROM TIME */}
      <input
        type="time"
        value={slot.from}
        onChange={(e) => updateSlot(index, "from", e.target.value)}
        style={styles.input}
      />

      <span style={{ color: "#D4AF37" }}>→</span>

      {/* TO TIME */}
      <input
        type="time"
        value={slot.to}
        onChange={(e) => updateSlot(index, "to", e.target.value)}
        style={styles.input}
      />

      {/* REMOVE BUTTON */}
      <button
        style={styles.redBtn}
        onClick={() => removeSlot(index)}
      >
        ✕
      </button>
    </div>
  ))}

  {/* ADD SLOT BUTTON */}
  <button
    style={styles.smallAdd}
    onClick={addSlot}
  >
    ➕ Add Time Block
  </button>
</div>

        <button
          style={styles.mainBtn}
          onClick={generatePlan}
          disabled={loading}
        >
          {loading ? "🤖 Thinking..." : "✨ Generate Plan"}
        </button>

        {/* SAVE BUTTON (FIXED - NO NESTING BUG) */}
        {plan.length > 0 && (
          <button
            style={{ ...styles.smallAdd, marginTop: 10 }}
            onClick={savePlan}
          >
            💾 Save Plan
          </button>
        )}

        {error && <p style={styles.error}>{error}</p>}
      </div>

      {/* ================= VIEWER PANEL ================= */}
      <div style={styles.card}>
        <h3 style={styles.section}>📅 AI Schedule Brain</h3>

        {/* SELECTED PLAN VIEW */}
        {selectedPlan && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: "#D4AF37" }}>📖 Selected Memory</h3>

           <div style={{ marginTop: 10 }}>
  <h2 style={{ color: "#D4AF37" }}>📅 Full Study Plan</h2>

  <p><b>Goal:</b> {selectedPlan.goal}</p>
  <p><b>Mode:</b> {selectedPlan.mode}</p>
  <p><b>Weak Subject:</b> {selectedPlan.weakSubject}</p>
  <p><b>Saved:</b> {selectedPlan.time}</p>

  <hr style={{ margin: "10px 0", opacity: 0.2 }} />

  {selectedPlan.plan?.map((item, i) => (
    <div
      key={i}
      style={{
        padding: 10,
        marginBottom: 8,
        borderRadius: 10,
        border: "1px solid rgba(212,175,55,0.15)",
        background:
          item.subject === "Break"
            ? "rgba(34,197,94,0.08)"
            : "rgba(212,175,55,0.05)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        ⏰ {item.start} - {item.end}
      </div>

      <div style={{ fontWeight: "bold", color: "#D4AF37" }}>
        📘 {item.subject}
      </div>

      <div>{item.task}</div>

      <div style={{ fontSize: 11, opacity: 0.6 }}>
        {item.method}
      </div>
    </div>
  ))}
</div>

            <button
              style={styles.smallAdd}
              onClick={() => setSelectedPlan(null)}
            >
              Close
            </button>
          </div>
        )}

        {/* PLAN DISPLAY */}
        {loading ? (
          <div style={styles.empty}>Generating smart plan...</div>
        ) : plan.length === 0 ? (
          <div style={styles.empty}>
            Your AI study brain output will appear here 🧠
          </div>
        ) : (
          <div style={styles.timeline}>
            {plan.map((item, i) => (
              <div
                key={i}
                style={{
                  ...styles.block,
                  borderLeft:
                    item.subject === "Break"
                      ? "4px solid #22c55e"
                      : "4px solid #facc15",
                }}
              >
                <div style={styles.time}>
                  {item.start} - {item.end}
                </div>

                <div style={styles.subject}>{item.subject}</div>

                <div style={styles.task}>{item.task}</div>

                <div style={styles.method}>{item.method}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  </div>
);
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0A0A0A",
    padding: 20,
    color: "#EAEAEA",
    fontFamily: "Inter, sans-serif",
  },

  header: {
    textAlign: "center",
    marginBottom: 20,
  },

  title: {
    color: "#D4AF37",
    margin: 0,
  },

  sub: {
    opacity: 0.8,
    marginTop: 8,
    color: "#A8A8A8",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: 20,
  },

  card: {
    background: "rgba(0,0,0,0.75)",
    padding: 20,
    borderRadius: 18,
    border: "1px solid rgba(255, 215, 0, 0.15)",
    backdropFilter: "blur(10px)",
  },

  section: {
    color: "#D4AF37",
    marginBottom: 15,
  },

  label: {
    fontSize: 13,
    marginTop: 12,
    display: "block",
    color: "#C8C8C8",
  },

  input: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid rgba(255, 215, 0, 0.15)",
    marginTop: 6,
    background: "rgba(0,0,0,0.9)",
    color: "#EAEAEA",
    outline: "none",
  },

  row: {
    display: "flex",
    gap: 10,
    marginTop: 8,
  },

  smallBtn: {
    width: 45,
    border: "none",
    borderRadius: 10,
    background: "#D4AF37",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#000",
  },

  redBtn: {
    width: 40,
    border: "none",
    borderRadius: 10,
    background: "#8B0000",
    color: "#fff",
    cursor: "pointer",
  },

  smallAdd: {
    marginTop: 10,
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid rgba(255, 215, 0, 0.15)",
    background: "rgba(0,0,0,0.8)",
    color: "#D4AF37",
    cursor: "pointer",
  },

  tags: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },

  tag: {
    background: "rgba(255, 215, 0, 0.08)",
    border: "1px solid rgba(255, 215, 0, 0.15)",
    padding: "6px 10px",
    borderRadius: 20,
    fontSize: 12,
    display: "flex",
    gap: 6,
    alignItems: "center",
    color: "#EAEAEA",
  },

  remove: {
    border: "none",
    background: "transparent",
    color: "#ff6b6b",
    cursor: "pointer",
  },

  mainBtn: {
    width: "100%",
    marginTop: 18,
    padding: 14,
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg, #D4AF37, #8B6B00)",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#000",
    boxShadow: "0 0 12px rgba(255, 215, 0, 0.25)",
  },

  error: {
    color: "#ff6b6b",
    marginTop: 10,
  },

  empty: {
    textAlign: "center",
    padding: 30,
    opacity: 0.7,
    color: "#A8A8A8",
  },

  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  block: {
    background: "rgba(0,0,0,0.8)",
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255, 215, 0, 0.12)",
  },

  time: {
    fontSize: 12,
    color: "#D4AF37",
    opacity: 0.8,
  },

  subject: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D4AF37",
    marginTop: 5,
  },

  task: {
    marginTop: 6,
    color: "#EAEAEA",
  },

  method: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.7,
    color: "#A8A8A8",
  },
};