import React, { useState, useEffect } from "react";
import api from "../../../utils/api.js";
import { BrainCore } from "@/utils/memoryEngine";

export default function TestReviewSystem() {
  const [subject, setSubject] = useState("Mathematics");
  const [examType, setExamType] = useState("Written");
  const [totalMarks, setTotalMarks] = useState("80");
  const [negativeMarking, setNegativeMarking] = useState("No");

  const [pattern, setPattern] = useState("");
  const [questionPaper, setQuestionPaper] = useState("");
  const [answers, setAnswers] = useState("");

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
const [savedReports, setSavedReports] = useState([]);
const [selectedReport, setSelectedReport] = useState(null);

useEffect(() => {
  const data = localStorage.getItem("empirox_test_reports");
  if (data) {
    setSavedReports(JSON.parse(data));
  }
}, []);
  /* ================= RUN AI ================= */
  const evaluateTest = async () => {
  if (!answers.trim()) {
    alert("Please enter your answers.");
    return;
  }

  setLoading(true);
  setReport("");

  const user = JSON.parse(localStorage.getItem("user")) || { id: "guest" };

  try {
    const reply = await api.sendAIMessage({
      feature: "test_review_ai",
      standard: "8",
      context: `Subject: ${subject}`,
      message: `
You are evaluating a student test.

SUBJECT: ${subject}
EXAM TYPE: ${examType}
TOTAL MARKS: ${totalMarks}
NEGATIVE MARKING: ${negativeMarking}

EXAM PATTERN:
${pattern}

QUESTION PAPER:
${questionPaper}

STUDENT ANSWERS:
${answers}

Generate:

🎯 Score Estimate
📈 Accuracy %
✅ Strong Areas
⚠️ Weak Areas
❌ Mistakes
📚 Improvement Plan
🚀 Readiness Level
💬 Motivation Note
      `,
    });

    setReport(reply);

    /* ================= SAFE EXTRACTION ================= */
    const estimatedScoreMatch = reply.match(/Score Estimate.*?(\d+)/i);
    const accuracyMatch = reply.match(/Accuracy.*?(\d+)%/i);

    const score = estimatedScoreMatch?.[1] || "unknown";
    const accuracy = accuracyMatch?.[1] || "unknown";

    /* ================= GUEST MODE HANDLING ================= */
    if (!user?.id || user.id === "guest") {
      console.log("🧠 Guest mode → skipping BrainCore log");
      setLoading(false);
      return;
    }

    /* ================= SAFE BRAIN LOG ================= */
    try {
      await BrainCore.log(user.id, "test_review", {
        subject,
        examType,
        totalMarks,
        score,
        accuracy,
        answerLength: answers.length,
        timestamp: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.log("BrainCore log skipped:", dbErr.message);
    }

  } catch (err) {
    console.log(err);
    setReport("⚠️ AI failed to generate report. Please try again.");
  }

  setLoading(false);
};

  /* ================= SAVE ================= */
  const saveReport = () => {
  if (!report) return alert("No report to save.");

  const newReport = {
    id: Date.now(),
    subject,
    examType,
    totalMarks,
    report,
    time: new Date().toLocaleString(),
  };

  const old = JSON.parse(localStorage.getItem("empirox_test_reports") || "[]");
  const updated = [newReport, ...old];

  localStorage.setItem("empirox_test_reports", JSON.stringify(updated));
  setSavedReports(updated);

  alert("✅ Report saved successfully");
};

const deleteReport = (id) => {
  const old = JSON.parse(localStorage.getItem("empirox_test_reports") || "[]");
  const updated = old.filter((r) => r.id !== id);

  localStorage.setItem("empirox_test_reports", JSON.stringify(updated));
  setSavedReports(updated);
};

  /* ================= IMPROVE PLAN ================= */
  const improvePlan = () => {
  if (!report) return;

  const improvement = `
📚 IMPROVEMENT PLAN

Based on your test performance:

1. Focus weak topics from report
2. Revise mistakes daily
3. Solve 10 MCQs daily on weak area
4. Re-attempt same test in 3 days
5. Use active recall method

⚡ Daily Rule:
- 60% weak subject
- 30% revision
- 10% mock test

🚀 Goal: +20% improvement in next test
  `;

  setReport((prev) => prev + "\n\n" + improvement);
};

  return (
  <div style={styles.page}>
    
    {/* HEADER */}
    <div style={styles.header}>
      <h1 style={styles.title}>📊 Test Review AI</h1>
      <p style={styles.subTitle}>
        Predict Score • Remove Fear • Improve Faster
      </p>
    </div>

    {/* GRID LAYOUT */}
    <div style={styles.grid}>

      {/* LEFT - MEMORY VAULT */}
      <div style={styles.card}>
        <h3 style={styles.heading}>🧠 Memory Vault</h3>

        {savedReports.length === 0 ? (
          <p style={{ color: "#A8A8A8" }}>No saved reports yet</p>
        ) : (
          savedReports.map((r) => (
            <div key={r.id} style={styles.memoryItem}>
              
              <div
                onClick={() => setSelectedReport(r)}
                style={{
                  fontWeight: "bold",
                  color: "#D4AF37",
                  cursor: "pointer",
                }}
              >
                📘 {r.subject}
              </div>

              <div style={{ fontSize: 12, color: "#aaa" }}>
                {r.time}
              </div>

              <button
                style={styles.deleteBtn}
                onClick={() => deleteReport(r.id)}
              >
                🗑 Delete
              </button>

            </div>
          ))
        )}
      </div>

      {/* MIDDLE - TEST SETUP */}
      <div style={styles.card}>
        <h3 style={styles.heading}>📝 Test Setup</h3>

        {/* Subject */}
        <label style={styles.label}>Subject</label>
        <select
          style={styles.input}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option>Mathematics</option>
          <option>Science</option>
          <option>English</option>
          <option>Social Science</option>
          <option>Competitive Exam</option>
        </select>

        {/* Exam Type */}
        <label style={styles.label}>Exam Type</label>
        <select
          style={styles.input}
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
        >
          <option>Written</option>
          <option>MCQ</option>
          <option>Mixed</option>
        </select>

        {/* Marks */}
        <label style={styles.label}>Total Marks</label>
        <input
          style={styles.input}
          value={totalMarks}
          onChange={(e) => setTotalMarks(e.target.value)}
        />

        {/* Negative marking */}
        <label style={styles.label}>Negative Marking</label>
        <select
          style={styles.input}
          value={negativeMarking}
          onChange={(e) => setNegativeMarking(e.target.value)}
        >
          <option>No</option>
          <option>Yes</option>
        </select>

        {/* Pattern */}
        <label style={styles.label}>Exam Pattern</label>
        <textarea
          style={styles.textareaSmall}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        />

        {/* Question paper */}
        <label style={styles.label}>Question Paper</label>
        <textarea
          style={styles.textarea}
          value={questionPaper}
          onChange={(e) => setQuestionPaper(e.target.value)}
        />

        {/* Answers */}
        <label style={styles.label}>Your Answers</label>
        <textarea
          style={styles.textarea}
          value={answers}
          onChange={(e) => setAnswers(e.target.value)}
        />

        {/* Button */}
        <button
          style={styles.mainBtn}
          onClick={evaluateTest}
          disabled={loading}
        >
          {loading ? "🧠 Reviewing..." : "🚀 Generate Smart Report"}
        </button>
      </div>

      {/* RIGHT - REPORT */}
      <div style={styles.card}>
        <h3 style={styles.heading}>📈 Smart Report</h3>

        {/* LOADING */}
        {loading && (
          <div style={styles.loaderWrap}>
            <div style={styles.loader}></div>
            <p style={styles.loadingText}>
              AI is checking your paper...
            </p>
          </div>
        )}

        {/* SELECTED SAVED REPORT */}
        {!loading && selectedReport ? (
          <div style={styles.reportBox}>
            <h3 style={{ color: "#D4AF37" }}>
              📊 {selectedReport.subject} Report
            </h3>

            <pre style={styles.reportText}>
              {selectedReport.report}
            </pre>

            <button
              style={styles.smallBtn}
              onClick={() => setSelectedReport(null)}
            >
              Close
            </button>
          </div>

        ) : /* LIVE REPORT */
        !loading && report ? (
          <>
            <div style={styles.reportBox}>
              <pre style={styles.reportText}>{report}</pre>
            </div>

            <div style={styles.actions}>
              <button style={styles.smallBtn} onClick={saveReport}>
                💾 Save Report
              </button>

              <button style={styles.smallBtn} onClick={improvePlan}>
                📚 Improve Plan
              </button>
            </div>
          </>
        ) : (
          /* EMPTY STATE */
          <div style={styles.emptyBox}>
            <div style={styles.emptyEmoji}>📘</div>
            <p>Your premium AI report will appear here</p>
          </div>
        )}
      </div>

    </div>
  </div>
);
}
/* ================= PREMIUM UI ================= */

const styles = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "#0A0A0A",
    color: "#EAEAEA",
    fontFamily: "Inter, sans-serif",
  },

  header: {
    textAlign: "center",
    marginBottom: 25,
  },

  title: {
    fontSize: 36,
    fontWeight: 800,
    margin: 0,
    background: "linear-gradient(135deg, #D4AF37, #8B6B00)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  subTitle: {
    marginTop: 8,
    color: "#A8A8A8",
    fontSize: 15,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "280px 1fr 1fr",
    gap: 20,
  },

  card: {
    background: "rgba(0,0,0,0.75)",
    border: "1px solid rgba(255, 215, 0, 0.15)",
    borderRadius: 20,
    padding: 22,
    backdropFilter: "blur(12px)",
  },

  heading: {
    marginTop: 0,
    color: "#D4AF37",
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    color: "#C8C8C8",
    marginBottom: 6,
    display: "block",
    marginTop: 10,
  },

  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255, 215, 0, 0.15)",
    background: "rgba(0,0,0,0.9)",
    color: "#EAEAEA",
    outline: "none",
  },

  textareaSmall: {
    width: "100%",
    minHeight: 90,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255, 215, 0, 0.15)",
    background: "rgba(0,0,0,0.9)",
    color: "#EAEAEA",
    resize: "vertical",
  },

  textarea: {
    width: "100%",
    minHeight: 130,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255, 215, 0, 0.15)",
    background: "rgba(0,0,0,0.9)",
    color: "#EAEAEA",
    resize: "vertical",
  },

  mainBtn: {
    width: "100%",
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    background: "linear-gradient(135deg, #D4AF37, #8B6B00)",
    color: "#000",
    boxShadow: "0 0 12px rgba(255, 215, 0, 0.25)",
  },

  emptyBox: {
    minHeight: 320,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    color: "#A8A8A8",
    gap: 10,
  },

  emptyEmoji: {
    fontSize: 42,
  },

  loaderWrap: {
    minHeight: 320,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },

  loader: {
    width: 42,
    height: 42,
    border: "4px solid rgba(255, 215, 0, 0.2)",
    borderTop: "4px solid #D4AF37",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  loadingText: {
    marginTop: 15,
    color: "#D4AF37",
  },

  reportBox: {
    background: "rgba(0,0,0,0.85)",
    borderRadius: 16,
    padding: 18,
    border: "1px solid rgba(255, 215, 0, 0.15)",
    maxHeight: "70vh",
    overflowY: "auto",
  },

  reportText: {
    whiteSpace: "pre-wrap",
    margin: 0,
    lineHeight: 1.8,
    fontSize: 14,
    color: "#EAEAEA",
  },

  actions: {
    display: "flex",
    gap: 10,
    marginTop: 14,
  },

  smallBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255, 215, 0, 0.15)",
    background: "rgba(0,0,0,0.8)",
    color: "#D4AF37",
    cursor: "pointer",
    fontWeight: 600,
  },
};