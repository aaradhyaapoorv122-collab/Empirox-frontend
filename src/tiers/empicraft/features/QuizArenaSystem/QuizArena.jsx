import React, { useEffect, useState } from "react";
import api from "../../../../utils/api.js";
import { supabase } from "../../../../lib/supabaseClient";

export default function QuizArena() {
  /* ================= USER ================= */
  const [userId, setUserId] = useState(null);
  const [studentClass, setStudentClass] = useState("8");
  const [board, setBoard] = useState("CBSE");

  /* ================= FORM ================= */
  const [subject, setSubject] = useState("Science");
  const [query, setQuery] = useState("");

  /* ================= QUIZ ================= */
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);

  /* ================= UI ================= */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  /* ================= RESULT ================= */
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  const subjects = ["Science", "Math", "English", "Hindi", "SST", "Computer"];

  /* ==================================================
     LOAD PROFILE
  ================================================== */
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    const { data } = await supabase
      .from("profiles")
      .select("standard,country")
      .eq("id", user.id)
      .single();

    if (data) {
      setStudentClass(data.standard || "8");
      setBoard(data.country === "India" ? "CBSE" : "General");
    }
  };

  /* ==================================================
     DAILY USAGE (FIXED)
  ================================================== */
  const checkDailyUsage = async () => {
    if (!userId) return false;

    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("daily_activity")
      .select("feature_usage")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();

    const used = data?.feature_usage?.quiz_arena || 0;

    return false; LIMIT
  };

  const increaseDailyUsage = async () => {
    if (!userId) return;

    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("daily_activity")
      .select("id,feature_usage")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();

    if (!data) {
      await supabase.from("daily_activity").insert({
        user_id: userId,
        date: today,
        used_app: true,
        feature_usage: { quiz_arena: 1 },
      });
      return;
    }

    const currentUsed = data.feature_usage?.quiz_arena || 0;

    await supabase
      .from("daily_activity")
      .update({
        feature_usage: {
          ...data.feature_usage,
          quiz_arena: currentUsed + 1,
        },
      })
      .eq("id", data.id);
  };

  /* ==================================================
     SAFE JSON PARSER (FIXED)
  ================================================== */
  const extractJSON = (text) => {
  try {
    if (!text) return null;

    text = text.replace(/```json/g, "").replace(/```/g, "");

    let start = text.indexOf("[");
    let end = text.lastIndexOf("]");

    if (start === -1 || end === -1) return null;

    let jsonString = text.slice(start, end + 1);

    // 🧠 FIX: try auto-repair broken JSON
    jsonString = repairJSON(jsonString);

    return JSON.parse(jsonString);
  } catch (err) {
    console.error("JSON Parse Error:", err);
    return null;
  }
};

const repairJSON = (str) => {
  try {
    // fix missing closing quotes or brackets (basic recovery)
    let fixed = str.trim();

    // if last char is incomplete, try closing it safely
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;

    const openCurly = (fixed.match(/\{/g) || []).length;
    const closeCurly = (fixed.match(/\}/g) || []).length;

    // close missing brackets
    fixed += "]".repeat(openBrackets - closeBrackets);
    fixed += "}".repeat(openCurly - closeCurly);

    return fixed;
  } catch {
    return str;
  }
};
 
const startQuiz = async () => {
  if (!query) {
    setError("Please enter a topic.");
    return;
  }

  const blocked = await checkDailyUsage();
  if (blocked) {
    setError("Daily limit reached.");
    return;
  }

  setLoading(true);
  setError("");
  setQuestions([]);
  setAnswers({});
  setCurrent(0);
  setSubmitted(false);

  try {
    const reply = await api.sendAIMessage({
      feature: "quiz_arena",
      message: `
Generate 10 MCQ quiz.

Topic: ${query}

STRICT JSON FORMAT ONLY:
[
  {
    "question": "string",
    "options": ["A","B","C","D"],
    "answer": "A",
    "explanation": "1 line max"
  }
]

NO markdown, NO text before or after.
      `,
    });

    let raw =
      typeof reply === "string"
        ? reply
        : JSON.stringify(reply || "");

    if (!raw || raw.length < 10) {
      throw new Error("Empty AI response");
    }

    // ================= SUPER ROBUST JSON EXTRACTOR =================
    const safeParse = (text) => {
      try {
        if (!text) return null;

        // remove markdown
        text = text.replace(/```json/g, "").replace(/```/g, "");

        // extract JSON array
        const start = text.indexOf("[");
        const end = text.lastIndexOf("]");

        if (start === -1 || end === -1) return null;

        let json = text.slice(start, end + 1);

        // 🔥 FIX COMMON AI MISTAKES
        json = json
          .replace(/,\s*}/g, "}")     // trailing commas fix
          .replace(/,\s*]/g, "]")     // trailing commas fix
          .replace(/:\s*'/g, ': "')
          .replace(/'\s*,/g, '",')
          .replace(/'\s*}/g, '"}')
          .replace(/'\s*]/g, '"]');

        return JSON.parse(json);
      } catch {
        return null;
      }
    };

    let parsed = safeParse(raw);

    // ================= EXTRA FALLBACK =================
    if (!parsed) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }

    // ================= FORCE ARRAY =================
    if (parsed && !Array.isArray(parsed)) {
      parsed =
        parsed.quiz ||
        parsed.data ||
        parsed.questions ||
        Object.values(parsed);
    }

    // ================= FINAL VALIDATION =================
    if (!Array.isArray(parsed)) {
      console.log("❌ RAW:", raw);

      // 🔥 SAFE FALLBACK QUIZ (NEVER CRASH)
      parsed = [
        {
          question: "What is JavaScript?",
          options: ["Language", "Car", "Animal", "Country"],
          answer: "Language",
          explanation: "JavaScript is a programming language.",
        },
      ];
    }

    // ================= CLEAN DATA =================
    const cleanQuiz = parsed
      .filter(
        (q) =>
          q?.question &&
          Array.isArray(q?.options) &&
          q?.answer
      )
      .slice(0, 10);

    setQuestions(cleanQuiz);
    await increaseDailyUsage();
  } catch (e) {
    console.error("Quiz Error:", e);

    // 🔥 FINAL SAFETY FALLBACK
    setQuestions([
      {
        question: "Fallback Question: What is 2 + 2?",
        options: ["1", "2", "4", "5"],
        answer: "4",
        explanation: "Basic math fallback.",
      },
    ]);

    setError("AI had issues, showing fallback quiz.");
  } finally {
    setLoading(false);
  }
};
  /* ==================================================
     ANSWER SELECT
  ================================================== */
  const selectAnswer = (opt) => {
    setAnswers({ ...answers, [current]: opt });
  };

  /* ==================================================
     SUBMIT QUIZ
  ================================================== */
  const submitQuiz = async () => {
    let total = 0;
    let right = 0;
    let wrongNow = 0;

    questions.forEach((q, i) => {
      const userAns = answers[i] || "";
      const correctAns = q.answer || "";

      const normalize = (t) =>
        t.toString().trim().toLowerCase()
          .replace(/^[a-d][).:-]?\s*/, "");

      const ok = normalize(userAns) === normalize(correctAns);

      if (ok) {
        total++;
        right++;
      } else {
        wrongNow++;
      }
    });

    setScore(total);
    setCorrect(right);
    setWrong(wrongNow);
    setSubmitted(true);

    if (userId) {
      await supabase.from("assessments").insert({
        user_id: userId,
        type: "quiz_arena",
        score: total,
        metadata: {
          subject,
          topic: query, // FIXED
          total: 10,
          class: studentClass,
        },
      });

      await updateBrain(total);
    }
  };

  /* ==================================================
     MEMORY SYSTEM (FIXED)
  ================================================== */
  const updateBrain = async (total) => {
    const { data } = await supabase
      .from("student_brain")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const history = data?.quiz_history || [];

    history.push({
      subject,
      topic: query,
      score: total,
      time: new Date().toISOString(),
    });

    const weak = data?.weak_subjects || [];
    const strong = data?.strong_subjects || [];

    if (total <= 5) {
      if (!weak.includes(subject)) weak.push(subject);
    } else {
      if (!strong.includes(subject)) strong.push(subject);
    }

    if (!data) {
      await supabase.from("student_brain").insert({
        user_id: userId,
        standard: studentClass,
        weak_subjects: weak,
        strong_subjects: strong,
        quiz_history: history,
      });
    } else {
      await supabase
        .from("student_brain")
        .update({
          weak_subjects: weak,
          strong_subjects: strong,
          quiz_history: history,
          updated_at: new Date(),
        })
        .eq("user_id", userId);
    }
  };

  const percentage = Math.round((score / 10) * 100);

  const resetQuiz = () => {
    setQuestions([]);
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
  };

  /* ==================================================
     RETURN UI (use your upgraded UI here)


  /* ==================================================
     UI
  ================================================== */
  return (
  <div style={ui.page}>
    <div style={ui.card}>

      {/* ================= HEADER ================= */}
      <div style={ui.header}>
        <h1 style={ui.title}>👑 Quiz Arena AI</h1>
        <p style={ui.sub}>
          Type anything → AI builds a smart quiz instantly
        </p>
      </div>

      {/* ================= INPUT SECTION ================= */}
      <div style={ui.section}>

        <input
          style={ui.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter topic: space, coding, anime, history..."
        />

        <button
          style={ui.mainBtn}
          onClick={startQuiz}
          disabled={loading}
        >
          {loading ? "🧠 Generating Quiz..." : "Start Quiz 🚀"}
        </button>

        {error && <p style={ui.error}>{error}</p>}
      </div>

      {/* ================= LOADING STATE ================= */}
      {loading && (
        <div style={ui.loadingBox}>
          🧠 AI is thinking deeply...
          <div style={ui.loaderBar}></div>
        </div>
      )}

      {/* ================= QUIZ MODE ================= */}
      {!!questions.length && !submitted && (
        <div style={ui.quizBox}>

          <div style={ui.progress}>
            Question {current + 1} / {questions.length}
          </div>

          <div style={ui.question}>
            {questions[current]?.question}
          </div>

          <div style={ui.optionsWrap}>
            {questions[current]?.options?.map((opt, i) => (
              <button
                key={i}
                style={{
                  ...ui.option,
                  ...(answers[current] === opt ? ui.active : {}),
                }}
                onClick={() => selectAnswer(opt)}
              >
                {opt}
              </button>
            ))}
          </div>

          <div style={ui.navRow}>
            <button
              style={ui.sideBtn}
              disabled={current === 0}
              onClick={() => setCurrent(current - 1)}
            >
              ⬅ Prev
            </button>

            {current < questions.length - 1 ? (
              <button
                style={ui.mainBtnSmall}
                onClick={() => setCurrent(current + 1)}
              >
                Next ➡
              </button>
            ) : (
              <button
                style={ui.mainBtnSmall}
                onClick={submitQuiz}
              >
                Submit 🎯
              </button>
            )}
          </div>

        </div>
      )}

      {/* ================= RESULT MODE ================= */}
      {submitted && (
        <div style={ui.resultBox}>

          <h2 style={ui.gold}>🎯 Score: {score}/10</h2>

          <div style={ui.statsRow}>
            <p style={ui.green}>✔ Correct: {correct}</p>
            <p style={ui.red}>✖ Wrong: {wrong}</p>
          </div>

          <p style={ui.sub}>Accuracy: {percentage}%</p>

          <div style={ui.graphBox}>
            <div
              style={{
                ...ui.graphFill,
                width: `${percentage}%`,
              }}
            />
          </div>

          <button style={ui.mainBtn} onClick={resetQuiz}>
            🔁 Start New Quiz
          </button>
        </div>
      )}

      {/* ================= REVIEW SECTION ================= */}
      {submitted && (
        <div style={ui.reviewSection}>

          <h3 style={ui.reviewTitle}>📘 Review Answers</h3>

          {questions.map((q, i) => {
            const userAns = answers[i] || "Not Answered";

            const normalize = (text) =>
              text
                .toString()
                .trim()
                .toLowerCase()
                .replace(/^[a-d][).:-]?\s*/, "");

            const ok = normalize(userAns) === normalize(q.answer);

            return (
              <div
                key={i}
                style={{
                  ...ui.reviewCard,
                  border: ok
                    ? "1px solid #00ff88"
                    : "1px solid #ff4d4d",
                }}
              >

                <p>
                  <b>Q{i + 1}.</b> {q.question}
                </p>

                <p style={ok ? ui.green : ui.red}>
                  Your Answer: {userAns}
                </p>

                {!ok && (
                  <p style={ui.green}>
                    Correct Answer: {q.answer}
                  </p>
                )}

                <div style={ui.explain}>
                  💡 {q.explanation}
                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  </div>
);
}
/* ==================================================
   THEME
================================================== */
const ui = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#050505,#0d0d0d,#111)",
    padding: 20,
    color: "white",
    fontFamily:
      "Arial",
  },

  card: {
    maxWidth: 900,
    margin: "0 auto",
    background:
      "linear-gradient(145deg,#101010,#0b0b0b)",
    border:
      "1px solid rgba(255,215,106,.25)",
    borderRadius: 24,
    padding: 24,
  },

  title: {
    color: "#FFD76A",
    fontSize: 34,
  },

  sub: {
    color: "#ccc",
  },

  badge: {
    background:
      "#1b1b1b",
    color:
      "#FFD76A",
    padding:
      "8px 14px",
    borderRadius: 12,
    display:
      "inline-block",
    marginBottom: 14,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 12,
    marginBottom: 16,
  },

  input: {
    padding: 14,
    borderRadius: 14,
    border:
      "1px solid #333",
    background:
      "#151515",
    color: "white",
  },

  mainBtn: {
    width: "100%",
    padding: 14,
    border: "none",
    borderRadius: 14,
    background:
      "linear-gradient(90deg,#D4AF37,#FFD76A)",
    color: "#111",
    fontWeight: 800,
    cursor: "pointer",
  },

  mainBtnSmall: {
    padding:
      "12px 18px",
    border: "none",
    borderRadius: 12,
    background:
      "linear-gradient(90deg,#D4AF37,#FFD76A)",
    color: "#111",
    fontWeight: 800,
  },

  sideBtn: {
    padding:
      "12px 18px",
    borderRadius: 12,
    border:
      "1px solid #333",
    background:
      "#171717",
    color: "white",
  },

  progress: {
    color:
      "#FFD76A",
    marginBottom: 10,
    fontWeight: 700,
  },

  question: {
    background:
      "#141414",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    fontSize: 18,
  },

  optionsWrap: {
    display: "grid",
    gap: 10,
  },

  option: {
    padding: 14,
    borderRadius: 14,
    background:
      "#171717",
    border:
      "1px solid #333",
    color: "white",
    textAlign: "left",
    cursor: "pointer",
  },

  active: {
    background:
      "linear-gradient(90deg,#8d6900,#D4AF37)",
  },

  row: {
    display: "flex",
    justifyContent:
      "space-between",
    marginTop: 18,
  },

  result: {
    textAlign:
      "center",
    marginBottom: 18,
  },

  gold: {
    color:
      "#FFD76A",
  },

  green: {
    color:
      "#00ff88",
  },

  red: {
    color:
      "#ff6464",
  },

  graphBox: {
    height: 14,
    background:
      "#222",
    borderRadius: 10,
    overflow:
      "hidden",
    marginTop: 10,
  },

  graphFill: {
    height: "100%",
    background:
      "linear-gradient(90deg,#00ff88,#00cc66)",
  },

  reviewCard: {
    background:
      "#121212",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },

  explain: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    background:
      "#1a1a1a",
    color: "#ddd",
  },

  error: {
    color:
      "#ff6464",
    marginTop: 12,
  },
  header: {
  textAlign: "center",
  marginBottom: 20,
},



section: {
  marginBottom: 20,
},

quizBox: {
  marginTop: 20,
},

navRow: {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 20,
},

resultBox: {
  textAlign: "center",
  marginTop: 20,
},

statsRow: {
  display: "flex",
  justifyContent: "center",
  gap: 20,
},

reviewSection: {
  marginTop: 30,
},

reviewTitle: {
  color: "#FFD76A",
  marginBottom: 10,
},

loadingBox: {
  marginTop: 20,
  padding: 16,
  borderRadius: 12,
  background: "#111",
  textAlign: "center",
},

loaderBar: {
  height: 4,
  marginTop: 10,
  background: "linear-gradient(90deg,#FFD76A,#D4AF37)",
  animation: "pulse 1s infinite",
},
};