import React, { useState } from "react";
import api from "../../../utils/api.js";

/* ================= THEME ================= */
const theme = {
  bg: "radial-gradient(circle at top left, #0a0a0a, #000000)",
  card: "rgba(255, 140, 0, 0.06)",
  border: "rgba(255, 140, 0, 0.15)",
  text: "#ffffff",
  sub: "#ffb347",
  neon1: "#ff6a00",
  neon2: "#ff9a3c",
  accent: "#ff6a00",
};

/* ================= DATA ================= */

const academicSubjects = [
  "Physics","Chemistry","Biology","Mathematics","Computer Science",
  "Economics","History","Political Science","Business Studies",
  "English","Physical Education",
];

const comfortLevels = ["Easy", "Medium", "Hard but Interesting"];
const learningPaces = ["Fast", "Balanced", "Slow but Deep"];

const skillOptions = [
  "Communication","Coding","Designing","Analysis","Public Speaking",
  "Leadership","Research","Sports Skills","Political Awareness",
  "Security / Defense","Business Skills",
];

const thinkingSliders = [
  { id: "logicCreative", label: "Logical ↔ Creative" },
  { id: "theoryPractical", label: "Theory ↔ Practical" },
  { id: "soloTeam", label: "Solo ↔ Team" },
  { id: "fastDeep", label: "Fast Execution ↔ Deep Thinking" },
  { id: "leadershipSupport", label: "Leadership ↔ Support Role" },
];

const countries = ["India"];
const classesGrades = ["8th","9th","10th","11th","12th","Undergraduate"];

/* ================= COMPONENT ================= */

export default function CareerDetectorPro() {
  const [step, setStep] = useState(1);

  const [favSubjects, setFavSubjects] = useState([]);
  const [comfortLevel, setComfortLevel] = useState({});
  const [learningPace, setLearningPace] = useState("Balanced");

  const [sliders, setSliders] = useState({
    logicCreative: 50,
    theoryPractical: 50,
    soloTeam: 50,
    fastDeep: 50,
    leadershipSupport: 50,
  });

  const [skillsBest, setSkillsBest] = useState([]);
  const [skillsLearn, setSkillsLearn] = useState([]);

  const [classGrade, setClassGrade] = useState("12th");
  const [country, setCountry] = useState("India");

  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(false);
  /* ================= CLEAN AI RESPONSE ================= */
  const cleanAIResponse = (text) => {
    return text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
  };

  /* ================= TOGGLES ================= */

  const toggleSubject = (sub) => {
    if (favSubjects.includes(sub)) {
      setFavSubjects(favSubjects.filter((s) => s !== sub));
    } else {
      setFavSubjects([...favSubjects, sub]);
      setComfortLevel((p) => ({ ...p, [sub]: "Medium" }));
    }
  };

  const toggleSkillBest = (skill) => {
    setSkillsBest((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const toggleSkillLearn = (skill) => {
    setSkillsLearn((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  /* ================= AI GENERATION ================= */

  const generatePlans = async () => {
    try {
      setLoading(true);
      const message = `
You are Career Intelligence AI.

Subjects: ${favSubjects.join(", ")}
Skills (best): ${skillsBest.join(", ")}
Skills (learning): ${skillsLearn.join(", ")}
Thinking Profile: ${JSON.stringify(sliders)}
Country: ${country}

Return ONLY valid JSON. No markdown. No explanation.

[
  {
    "name": "",
    "reason": "",
    "skillsNeeded": []
  }
]
`;

      const reply = await api.sendAIMessage({
        feature: "career_detector_ai",
        message,
        context: { favSubjects, skillsBest, skillsLearn, sliders, country },
      });

      const cleaned = cleanAIResponse(reply);

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.log("RAW:", reply);
        console.log("CLEANED:", cleaned);
        throw new Error("Invalid JSON from AI");
      }

      setPlans(Array.isArray(parsed) ? parsed : []);
      setStep(3);
setLoading(false);
    } catch (err) {
  console.error("Career AI error:", err);

  setLoading(false);
}
  }
  /* ================= UI ================= */

  return (
    <div style={ui.wrapper}>
      <div style={ui.container}>

        <div style={ui.header}>
          🎯 Career Intelligence System
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <div style={ui.section}>
              <h2>Academic Strength</h2>

              <div style={ui.grid}>
                {academicSubjects.map((sub) => (
                  <div
                    key={sub}
                    style={{
                      ...ui.card,
                      border: favSubjects.includes(sub)
                        ? `1px solid ${theme.neon1}`
                        : `1px solid ${theme.border}`,
                    }}
                    onClick={() => toggleSubject(sub)}
                  >
                    {sub}
                  </div>
                ))}
              </div>
            </div>

            <button style={ui.btnPrimary} onClick={() => setStep(2)}>
              Continue →
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <div style={ui.section}>
              <h2>Thinking & Skills</h2>

              {thinkingSliders.map((s) => (
                <div key={s.id} style={ui.sliderBox}>
                  <label>{s.label}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliders[s.id]}
                    onChange={(e) =>
                      setSliders({
                        ...sliders,
                        [s.id]: +e.target.value,
                      })
                    }
                  />
                </div>
              ))}

              <h3>Skills (Click to toggle BEST skills)</h3>

              <div style={ui.chips}>
                {skillOptions.map((skill) => (
                  <div
                    key={skill}
                    style={{
                      ...ui.chip,
                      background: skillsBest.includes(skill)
                        ? theme.neon1
                        : theme.card,
                      color: skillsBest.includes(skill)
                        ? "#0b0b0b"
                        : "#ffb347",
                    }}
                    onClick={() => toggleSkillBest(skill)}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>

            <div style={ui.row}>
              <button style={ui.btnSecondary} onClick={() => setStep(1)}>
                Back
              </button>

              
              <button
  style={{
    ...ui.btnPrimary,
    opacity: loading ? 0.7 : 1,
  }}
  onClick={generatePlans}
  disabled={loading}
>
  {loading
    ? "Analyzing Career Profile..."
    : "Generate Plans"}
</button>
            </div>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && plans && (
          <div style={ui.section}>
            <h2>Your Career Plans</h2>

            <div style={ui.grid}>
              {plans.map((p, i) => (
                <div key={i} style={ui.planCard}>
                  <h3>
                    Plan {String.fromCharCode(65 + i)} — {p.name}
                  </h3>

                  <p>{p.reason}</p>

                  <div style={ui.skills}>
                    {p.skillsNeeded.map((s, idx) => (
                      <span key={idx} style={ui.skillTag}>
                        {s}
                      </span>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ================= UI ================= */

const ui = {
  wrapper: {
    minHeight: "100vh",
    background: theme.bg,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    fontFamily: "Inter, sans-serif",
  },

  container: {
    width: "1200px",
    padding: 30,
    borderRadius: 28,
    background: theme.card,
    border: `1px solid ${theme.border}`,
  },

  header: {
    fontSize: 32,
    fontWeight: 800,
    marginBottom: 30,
    background: `linear-gradient(90deg,${theme.neon1},${theme.neon2})`,
    WebkitBackgroundClip: "text",
    color: "transparent",
  },

  section: { marginBottom: 30 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 16,
  },

  card: {
    padding: 16,
    borderRadius: 14,
    background: "#1a1a1a",
    cursor: "pointer",
    color: "#ffb347",
  },

  sliderBox: { marginBottom: 20 },

  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },

  chip: {
    padding: "8px 14px",
    borderRadius: 20,
    cursor: "pointer",
  },

  planCard: {
    padding: 20,
    borderRadius: 20,
    background: "#1a1a1a",
    border: `1px solid ${theme.border}`,
  },

  skills: {
    display: "flex",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },

  skillTag: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 12,
    background: theme.neon2,
    color: "#0b0b0b",
  },

  actions: {
    display: "flex",
    gap: 10,
    marginTop: 15,
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
  },

  btnPrimary: {
    padding: "12px 24px",
    borderRadius: 18,
    border: "none",
    background: theme.neon1,
    color: "#0b0b0b",
    fontWeight: 700,
    cursor: "pointer",
  },

  btnSecondary: {
    padding: "12px 24px",
    borderRadius: 18,
    border: `1px solid ${theme.neon2}`,
    background: "transparent",
    color: theme.neon2,
    cursor: "pointer",
  },

  btnPrimarySmall: {
    padding: "8px 16px",
    borderRadius: 12,
    background: theme.neon1,
    border: "none",
    color: "#0b0b0b",
    cursor: "pointer",
  },

  btnSecondarySmall: {
    padding: "8px 16px",
    borderRadius: 12,
    background: "transparent",
    border: `1px solid ${theme.neon2}`,
    color: theme.neon2,
    cursor: "pointer",
  },
};