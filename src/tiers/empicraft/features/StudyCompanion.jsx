import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import api from "../../../utils/api.js";
import { BrainCore } from "@/utils/memoryEngine";

export default function StudyCompanion() {
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);

  const [progress, setProgress] = useState(0);
  const [aiReply, setAiReply] = useState("");

  const [mood, setMood] = useState("Normal");
  const [energy, setEnergy] = useState("Medium");

  const [user, setUser] = useState({
    id: "",
    name: "User",
    email: "",
    className: "",
    studyTime: "2 Hours",
    weak: "General Revision",
    overallProgress: 0,
    subjects: [],
  });

  const [todayTasks, setTodayTasks] = useState([]);

  useEffect(() => {
  loadUserData();
}, []);

async function loadUserData() {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return;

    /* PROFILE */
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    /* ASSESSMENTS */
    const { data: assessments } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(20);

    /* STUDY PLAN */
    const { data: plans } = await supabase
      .from("study_plans")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(1);

    /* DAILY ACTIVITY */
    const { data: activity } = await supabase
      .from("daily_activity")
      .select("*")
      .eq("user_id", authUser.id)
      .order("date", { ascending: false })
      .limit(1);

    /* =========================
       SUBJECT ANALYSIS
    ========================= */
    const subjectMap = {};

    assessments?.forEach((item) => {
    const subject =
  item.subject ||
  item.subject_name ||
  item.type ||
  "General";

      if (!subjectMap[subject]) {
        subjectMap[subject] = [];
      }
        const score = parseFloat(item.score);

subjectMap[subject].push(
  isNaN(score) ? 0 : score
);
    });

    const subjects = Object.keys(subjectMap).map((key) => {
  const arr = subjectMap[key];
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;

  return {
    name: key,
    score: Math.round(avg),
  };
});

/* =========================
   FALLBACK SUBJECTS
========================= */

if (subjects.length === 0) {
  subjects.push(
    {
      name: "Math",
      score: 62,
    },
    {
      name: "Science",
      score: 58,
    },
    {
      name: "English",
      score: 74,
    }
  );
}
   const validSubjects = subjects.filter(
  (s) => !isNaN(s.score)
);

const sortedWeak = [...validSubjects].sort(
  (a, b) => a.score - b.score
);

    const weakSubject = sortedWeak[0]?.name || "General Revision";

    const overall =
      subjects.length > 0
        ? Math.round(
            subjects.reduce((sum, s) => sum + s.score, 0) /
              subjects.length
          )
        : profile?.strictness_score || 65;

    /* =========================
       TODAY TASKS
    ========================= */
    let tasks = [];

    if (plans?.[0]?.tasks && Array.isArray(plans[0].tasks)) {
      tasks = plans[0].tasks.slice(0, 5);
    } else {
      tasks = [
        {
          subject: weakSubject,
          task: "Practice key concepts",
        },
        {
          subject: "Revision",
          task: "Review previous lessons",
        },
      ];
    }

    /* =========================
       FINAL USER OBJECT
    ========================= */
    const finalUser = {
      id: authUser.id,
      name:
        profile?.name ||
        authUser.user_metadata?.name ||
        authUser.email?.split("@")[0] ||
        "User",

      email: profile?.email || authUser.email || "",
      className: profile?.standard || "",

      weak: weakSubject,
      studyTime: activity?.[0]?.used_app ? "Active Today" : "2 Hours",

      overallProgress: overall,

      subjects:
        subjects.length > 0
          ? subjects
          : [{ name: "General", score: overall }],
    };
        console.log("PROFILE:", profile);
console.log("ASSESSMENTS:", assessments);
console.log("SUBJECTS:", subjects);
console.log("TASKS:", tasks);
console.log("FINAL USER:", finalUser);
    setUser(finalUser);
    setTodayTasks(tasks);

    /* =========================
       BRAINCORE LOG (SAFE)
    ========================= */
    await BrainCore.log(authUser.id, "study_companion", {
      mood: "Normal",
      energy: "Medium",
      weakSubject,
      overallProgress: overall,
    });
  } catch (err) {
    console.error("loadUserData error:", err);
  } finally {
    setLoadingPage(false);
  }
}
  

  /* ===================================================
     PROGRESS ANIMATION
  =================================================== */
  useEffect(() => {
    let current = 0;

    const timer = setInterval(() => {
      if (current <= user.overallProgress) {
        setProgress(current);
        current++;
      } else {
        clearInterval(timer);
      }
    }, 15);

    return () => clearInterval(timer);
  }, [user.overallProgress]);

  /* ===================================================
     AI GENERATE
  =================================================== */
  async function generateCompanion() {
    setLoadingAI(true);
    setAiReply("");

    const prompt = `
You are Study Companion AI of Empirox.

Student Name: ${user.name}
Class: ${user.className}
Mood: ${mood}
Energy: ${energy}
Weak Subject: ${user.weak}
Study Pattern: ${user.studyTime}
Overall Progress: ${user.overallProgress}%

Subjects:
${user.subjects
  .map((s) => `${s.name}: ${s.score}%`)
  .join("\n")}

Today's Tasks:
${todayTasks
  .map(
    (t) =>
      `${t.subject}: ${t.task}`
  )
  .join("\n")}

Give:
1. Current Study Status
2. Best Plan Today
3. Priority Subject
4. Improvement Tip
5. Motivation Line
6. Win Goal Today

Rules:
- Only use provided student data
- Do not invent fake marks
- Keep response realistic
- Keep response under 200 words
- Give practical study advice

Format:

1. Study Status
2. Priority Subject
3. Best Study Plan
4. Improvement Tip
5. Motivation
6. Today's Goal
`;
try {
  const reply = await api.sendAIMessage({
    feature: "study_companion_ai",
    message: prompt,
    context: user,
  });

  console.log("AI RAW RESPONSE:", reply);

  const finalReply =
    typeof reply === "string"
      ? reply
      : reply?.reply ||
        reply?.message ||
        reply?.response ||
        reply?.text ||
        reply?.output ||
        "⚠️ Empty AI response.";

  setAiReply(finalReply);

} catch (err) {
  console.error(err);

  setAiReply(
    "⚠️ AI unavailable right now. Try again."
  );
}

  

  if (loadingPage) {
    return (
      <div style={styles.loading}>
        🚀 Loading Study Companion...
      </div>
    );
  }
  }
  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            📘 Study Companion AI
          </h1>

          <p style={styles.sub}>
            Personalized guidance for{" "}
            {user.name}
          </p>
        </div>

        <button
          style={styles.mainBtn}
          onClick={generateCompanion}
        >
          {loadingAI
            ? "Analyzing..."
            : "Generate Guidance"}
        </button>
      </div>

      {/* TOP GRID */}
      <div style={styles.grid}>
        {/* PROGRESS */}
        <div style={styles.cardCenter}>
          <svg width="190" height="190">
            <circle
              cx="95"
              cy="95"
              r="72"
              stroke="#2a2a2a"
              strokeWidth="12"
              fill="none"
            />

            <circle
              cx="95"
              cy="95"
              r="72"
              stroke="#facc15"
              strokeWidth="12"
              fill="none"
              strokeDasharray={452}
              strokeDashoffset={
                452 -
                (452 * progress) /
                  100
              }
              strokeLinecap="round"
            />
          </svg>

          <div style={styles.progressText}>
            <h2>{progress}%</h2>
            <p>Growth</p>
          </div>
        </div>

        {/* PROFILE */}
        <div style={styles.card}>
          <h3>👤 Student Profile</h3>
          <p>Name: {user.name}</p>
          <p>
            Class: {user.className}
          </p>
          <p>
            Study Status:{" "}
            {user.studyTime}
          </p>
          <p>
            Weak Subject: {user.weak}
          </p>
        </div>

        {/* STATUS */}
        <div style={styles.card}>
          <h3>⚙️ Today Status</h3>

          <label>Mood</label>
          <select
            style={styles.input}
            value={mood}
            onChange={(e) =>
              setMood(
                e.target.value
              )
            }
          >
            <option>Normal</option>
            <option>Motivated</option>
            <option>Stressed</option>
            <option>Tired</option>
          </select>

          <label>Energy</label>
          <select
            style={styles.input}
            value={energy}
            onChange={(e) =>
              setEnergy(
                e.target.value
              )
            }
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
      </div>

      {/* SUBJECTS */}
      <div style={styles.subjectWrap}>
        {user.subjects.map(
          (sub, i) => (
            <motion.div
              key={i}
              whileHover={{
                scale: 1.04,
              }}
              style={
                styles.subjectCard
              }
            >
              <h4>{sub.name}</h4>
              <p>{sub.score}%</p>
            </motion.div>
          )
        )}
      </div>

      {/* TASKS */}
      <div style={styles.taskBox}>
        <h3>📅 Today Tasks</h3>

        {todayTasks.map(
          (task, i) => (
            <p key={i}>
              • {task.subject}:{" "}
              {task.task}
            </p>
          )
        )}
      </div>

      {/* AI REPORT */}
      {aiReply && (
        <div style={styles.report}>
          <div style={styles.reportTop}>
            <h3>
              🧠 AI Guidance
            </h3>

           
          </div>

          <pre style={styles.pre}>
            {aiReply}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ===================================================
   STYLES
=================================================== */

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#050505,#111827,#1f2937)",
    color: "white",
    padding: 24,
    fontFamily: "Inter",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg,#050505,#111827,#1f2937)",
    color: "white",
    fontSize: 22,
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 24,
    alignItems: "center",
  },

  title: {
    fontSize: 32,
    marginBottom: 6,
    color: "#facc15",
  },

  sub: {
    color: "#cbd5e1",
  },

  mainBtn: {
    padding: "14px 20px",
    borderRadius: 14,
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
    background:
      "linear-gradient(135deg,#facc15,#eab308)",
    color: "#111",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(260px,1fr))",
    gap: 18,
  },

  card: {
    background:
      "rgba(255,255,255,0.05)",
    padding: 18,
    borderRadius: 18,
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  cardCenter: {
    background:
      "rgba(255,255,255,0.05)",
    padding: 18,
    borderRadius: 18,
    border:
      "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    position: "relative",
    minHeight: 240,
  },

  progressText: {
    position: "absolute",
    textAlign: "center",
  },

  input: {
    width: "100%",
    padding: 10,
    marginTop: 6,
    marginBottom: 12,
    borderRadius: 10,
    border: "none",
    background:
      "#0f172a",
    color: "white",
  },

  subjectWrap: {
    marginTop: 22,
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: 14,
  },

  subjectCard: {
    background:
      "rgba(250,204,21,0.08)",
    border:
      "1px solid rgba(250,204,21,0.25)",
    padding: 16,
    borderRadius: 16,
    textAlign: "center",
  },

  taskBox: {
    marginTop: 24,
    padding: 20,
    borderRadius: 18,
    background:
      "rgba(255,255,255,0.05)",
  },

  report: {
    marginTop: 24,
    padding: 20,
    borderRadius: 18,
    background:
      "rgba(250,204,21,0.08)",
    border:
      "1px solid rgba(250,204,21,0.25)",
  },

  reportTop: {
    display: "flex",
    justifyContent:
      "space-between",
    marginBottom: 14,
    alignItems: "center",
  },

  copyBtn: {
    padding: "8px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background:
      "#facc15",
    color: "#111",
    fontWeight: "bold",
  },

  pre: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.7,
    color: "#f8fafc",
  },
};