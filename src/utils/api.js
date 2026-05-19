/* ===================== CONFIG ===================== */
const API_BASE = "https://empirox-backend-production.up.railway.app";

/* ===================== FEATURE MAP ===================== */
export const AI_FEATURES = {
  SMART_CHAT: "smart_chat",
  SMART_MENTOR: "mentor_ai",
  SOLVER: "solver_ai",
  SUMMARY: "summary_ai",
  STUDYCOMPANION:"StudyCompanion_ai",
  NOTES: "notes_ai",
  QUIZ: "quiz_ai",
  TEST: "test_arena",
  PLANNER: "planner_ai",

  TEST_REVIEW: "test_review_ai",
  PERFORMANCE_COACH: "performance_coach_ai",
  SKILL_HUB: "skill_hub_ai",

  // 🆕 NEW FINAL AI BRAINS
  CAREER_DIRECTOR: "career_director_ai",
  PROJECT_BUILDER: "project_builder_ai",
  CHALLENGE_GENERATOR: "challenge_generator_ai",
};

/* ===================== SAFE PARSER ===================== */
async function safeParseResponse(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ Non-JSON response received:", text);

    throw new Error(
      "Backend did not return valid JSON. Check server route /ai/core"
    );
  }
}

/* ===================== CORE API ===================== */
const api = {
  sendAIMessage: async ({ feature, message, context = {}, history = [] }) => {
    try {
      const res = await fetch(`${API_BASE}/ai/core`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feature,
          message,
          context,
          history,
        }),
      });

      const data = await safeParseResponse(res);

      if (!res.ok) {
        throw new Error(data?.reply || "AI request failed");
      }

      return data?.reply ?? "⚠️ Empty AI response from backend";
    } catch (err) {
      console.error("🔥 AI CORE ERROR:", err.message);

      return "⚠️ AI system temporarily unavailable. Try again.";
    }
  },
};

export default api;