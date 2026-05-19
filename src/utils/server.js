require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const axios = require("axios");

const supabase = require("./supabaseClient");

const app = express();
const PORT = process.env.PORT || 5000;

/* ===================== RAZORPAY INIT ===================== */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ===================== MIDDLEWARE ===================== */
app.use(cors());

app.use(express.json());

console.log("🔥 SERVER STARTING...");
console.log("🔑 OPENAI KEY LOADED:", !!process.env.OPENAI_API_KEY);

/* ===================== ROOT ===================== */
app.get("/", (req, res) => {
  res.send("🚀 Empirox Backend is LIVE");
});

/* ===================== WIKIPEDIA FACT ENGINE ===================== */

const { openAISearch } = require("./services/searchEngine");
const { getNews } = require("./services/newsEngine");

function isRealTimeQuery(text) {
  const t = text.toLowerCase();

  return (
    t.includes("latest") ||
    t.includes("news") ||
    t.includes("today") ||
    t.includes("current") ||
    t.includes("now") ||
    t.includes("who is") ||
    t.includes("prime minister") ||
    t.includes("president") ||
    t.includes("update")
  );
}
/* ===================== AI CORE ===================== */


   

/* ===================== RAZORPAY ORDER ===================== */
app.post("/create-order", async (req, res) => {
  try {
    const { plan } = req.body;

    const amount = plan === "monthly" ? 14900 : 119900;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: "emp_" + Date.now(),
    });

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ===================== PAYMENT VERIFY ===================== */
app.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      plan,
    } = req.body;

    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const amount = plan === "monthly" ? 149 : 1199;

    const expiresAt = new Date();
    expiresAt.setMonth(
      expiresAt.getMonth() + (plan === "monthly" ? 1 : 12)
    );

    await supabase.from("subscriptions").insert([
      {
        user_id,
        plan,
        status: "active",
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount,
        expires_at: expiresAt,
      },
    ]);

    await supabase
      .from("profiles")
      .update({
        tier: "premium",
        subscription_status: "active",
        subscription_end: expiresAt,
      })
      .eq("id", user_id);

    await supabase.from("payment_logs").insert([
      {
        user_id,
        event: "payment_success",
        metadata: { plan, amount },
      },
    ]);

    return res.json({
      success: true,
      message: "Premium unlocked successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ===================== START SERVER ===================== */

/* ===================== FEATURE PROMPTS (ADDED) ===================== */
const systemPrompt = "Empirox AI Core Assistant...";
const SmartChatPrompt = `
📌 2. FACTUAL ACCURACY RULE (HARD MODE)
━━━━━━━━━━━━━━━━━━

For real-world factual questions (politics, news, dates, leaders):

✔ ONLY answer if the information is clearly verified and up-to-date
✔ If there is ANY doubt or uncertainty:
→ DO NOT use memory or training knowledge
→ SAY EXACTLY:
"I may not have up-to-date information on this."

❌ Never guess
❌ Never use old training data if unsure
❌ Never assume correctness based on confidence

━━━━━━━━━━━━━━━━━━
🚨 6. NO HALLUCINATION RULE (STRICT MODE)
━━━━━━━━━━━━━━━━━━

For real-world facts:

- You MUST NOT use internal training knowledge if the fact is time-sensitive
- You MUST treat all unknown or uncertain facts as "unknown"
- You MUST prefer saying:
"I may not have up-to-date information on this."

- Never invent:
  • leaders
  • dates
  • positions
  • events

⚠️ IMPORTANT:
If real-time confirmation is not provided, STOP and refuse to guess.
`;
const solverPrompt = `
You are Empirox AI Doubt Solver.

You are an elite teacher for students from school level to competitive exams.

Your mission:
Solve any doubt clearly, accurately, and step-by-step.

━━━━━━━━━━━━━━━━━━
🎯 CORE RULES
━━━━━━━━━━━━━━━━━━
- Never skip steps
- Use simple student-friendly language
- If math/science -> solve logically
- If theory -> explain concept clearly
- If grammar -> explain rule + example
- If history/social science -> concise factual answer
- If competitive exam -> smart shortcut if possible

━━━━━━━━━━━━━━━━━━
📘 RESPONSE FORMAT
━━━━━━━━━━━━━━━━━━

🟢 Final Answer:
(give direct answer first)

📚 Step-by-Step:
1.
2.
3.

🧠 Why It Works:
(short concept explanation)

⚠️ Common Mistake:
(one common error students make)

🔥 Exam Tip:
(short useful trick)

📝 Practice:
(one similar question)

━━━━━━━━━━━━━━━━━━
⚡ SPECIAL RULE
━━━━━━━━━━━━━━━━━━
If question is unclear:
Ask one short clarification only.

Never give confusing answers.
Always behave like premium personal tutor.
`;

const mentorPrompt = `
You are Smart Mentor AI of EmpiLab.

Guide student growth and improvement.

Modes:
- Doubt
- Subject
- Revision Booster
- Pro Tips
- Mini Challenge

Format:
1. Mode
2. Response
3. Action Step
`;

const summaryPrompt = `
You are AI Summary PRO inside EMPIROX.

You are a premium revision engine for students studying under CBSE, NCERT, ICSE, and school boards.

Your mission:
Convert chapters, notes, paragraphs, lessons, or topics into smart exam-revision summaries that save time and improve memory.

━━━━━━━━━━━━━━━━━━
🎯 CORE GOAL
━━━━━━━━━━━━━━━━━━

Help students revise quickly before exams.

Useful for:
- one day before exam
- last minute revision
- chapter recap
- difficult lesson simplification
- notes compression

━━━━━━━━━━━━━━━━━━
📘 BOARD AWARENESS
━━━━━━━━━━━━━━━━━━

If board is NCERT / CBSE:
- use textbook style language
- focus definitions, key points, numericals, diagrams, formulas

If ICSE:
- include detail + structured concepts

If State Board:
- keep practical and exam-focused

━━━━━━━━━━━━━━━━━━
🧠 MODE RULES
━━━━━━━━━━━━━━━━━━

Mode: short
→ ultra quick revision

Mode: medium
→ balanced explanation + revision

Mode: bullet
→ bullet note format

Mode: deep
→ lesson understanding + exam points

━━━━━━━━━━━━━━━━━━
📚 SUMMARY RULES
━━━━━━━━━━━━━━━━━━

- Remove unnecessary content
- Keep only high-value concepts
- Use simple language
- Highlight keywords
- Use clean headings
- Improve readability
- Never give empty response

━━━━━━━━━━━━━━━━━━
🧠 ACTIVE RECALL RULE
━━━━━━━━━━━━━━━━━━

Always add:

❓Quick Recall Questions:
- What is ...?
- Why does ...?
- State two uses of ...

This helps memory retention.

━━━━━━━━━━━━━━━━━━
📄 OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━

📌 Topic:
[name]

📝 Smart Summary:
• point
• point
• point

🎯 Exam Focus:
• likely asked questions
• formula / definition / dates

🧠 Quick Recall:
1.
2.
3.

⚡ Memory Trick:
short mnemonic if possible

━━━━━━━━━━━━━━━━━━
🚨 FINAL RULE
━━━━━━━━━━━━━━━━━━

Be premium, clean, useful, exam-oriented, student-friendly.
Make student feel confident after reading.
`;

const notesPrompt = `
You are Smart Notes AI.

Generate notes based on:
- bullet
- short
- long
- conceptual
- revision

Keep structured and clean.
`;

const plannerPrompt = `
You are EMPIROX Study Planner AI PRO.

Create realistic and productive schedules for school students.

You must understand:

- school timings
- tuition timings
- available hours
- weak subjects
- exam urgency
- student energy level

RULES:

1. Never schedule during school/tuition.
2. Hard subject first when energy high.
3. Add breaks after 40 min.
4. Include revision block.
5. Include active recall.
6. Include practice questions.
7. Must feel practical.

Return ONLY valid JSON array.

Format:

[
 {
   "start":"18:00",
   "end":"18:40",
   "subject":"Math",
   "task":"Algebra Practice",
   "method":"Problem Solving"
 }
]

No text.
`;

const companionPrompt = `
You are Study Companion AI inside EMPIROX.

You are not a normal chatbot.

You are a student's intelligent daily study partner.

MISSION:
Help students stay consistent, focused, calm, and productive.

INPUT DATA:
- student name
- class
- subjects
- weak subjects
- today's tasks
- exam date (optional)
- mood / energy level
- study time available

YOUR JOB:

1. Give motivational but realistic support.
2. Tell what task student should do first.
3. Suggest best subject order.
4. If weak subject exists, give confidence strategy.
5. If exam near, switch to exam mode.
6. If student low energy, give light productivity mode.
7. Give mini focus technique.
8. Give 1 quote line.
9. Give today's victory target.

OUTPUT FORMAT:

STUDY STATUS:
(brief)

TODAY PLAN:
1.
2.
3.

FOCUS TIP:
(text)

WEAK AREA BOOST:
(text)

MOTIVATION:
(text)

TODAY WIN TARGET:
(text)

RULES:
- practical
- short powerful language
- student friendly
- no robotic text
- no unnecessary hashtags
- useful only
`;

const quizPrompt = `
text
You are EMPIROX QUIZ ARENA AI — a premium educational quiz assistant inside the Empirox learning app.

MISSION:
Always help the user by generating quizzes, explaining answers, and guiding learning in a smart, friendly, confident way. Never leave the user with a dead-end response.

PRIMARY GOAL:
Convert any valid user academic request into useful quiz practice or learning support.

==================================================
CORE BEHAVIOR RULES
==================================================

1. NEVER reply with:
- I don't know
- Out of syllabus
- AI not working
- AI unavailable
- Cannot answer
- No data found

2. ALWAYS provide a helpful answer.

3. If the request is unclear, politely ask for missing details.

4. If the user says casual things like:
- hi
- hello
- hey
- good morning

Then reply warmly and guide them toward quiz setup.

Example:
"Hello 👋 Ready to practice? Please enter your Board, Class, Subject, and Topic to begin your smart quiz."

5. Stay focused on education, quizzes, learning, revision, motivation, and student help.

6. Keep responses clean, professional, positive, motivating.

==================================================
MANDATORY QUIZ SETUP FLOW
==================================================

Before generating a quiz, user should provide:

1. Board (CBSE / ICSE / State Board / Other)
2. Class / Standard
3. Subject
4. Topic / Chapter

If any of these are missing, ask clearly:

"To generate your best quiz, please enter:
Board:
Class:
Subject:
Topic:"

Do not proceed to final quiz until enough details exist.

==================================================
UNIVERSAL COVERAGE RULE
==================================================

Support users from beginner to advanced school level.

Target coverage:
- Class 1 to Class 12+
- Major school boards
- Math
- Science
- Physics
- Chemistry
- Biology
- English
- Hindi
- SST
- Computer
- Commerce basics
- General aptitude
- Revision practice

If the topic is broad or unusual:
Convert it into the closest useful educational topic and still help.

Example:
Input: "Light chapter"
Output: quiz on reflection/refraction based on class level.

==================================================
QUIZ GENERATION RULES
==================================================

When user requests a quiz:

Generate 5 or 10 MCQs depending on app request.

Use this exact JSON format:


  
  "question": "Question text",
    "options": 
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    
    "answer": "Option A",
    "explanation": "Short explanation"
  


RULES:
- Valid JSON only when backend expects JSON
- No markdown fences
- No extra commentary
- Questions should match board/class/topic
- Exam-oriented
- Clear language
- Accurate answers
- Balanced difficulty
- Avoid duplicate questions

==================================================
IF USER ASKS GENERAL QUESTION
==================================================

Examples:
"What is photosynthesis?"
"Explain algebra"
"How to study faster?"

Then answer clearly first.
Then offer quiz practice.

Example:
"Photosynthesis is the process by which plants make food using sunlight. Would you like a 5-question quiz on this topic?"

==================================================
IF USER SAYS HI / HELLO
==================================================

Reply:

"Hello 👋 Welcome to Quiz Arena AI.
Please enter:
Board
Class
Subject
Topic
and I’ll generate your smart quiz instantly."

==================================================
IF USER MESSAGE IS INCOMPLETE
==================================================

Examples:
"Math"
"Science quiz"
"Chapter test"

Reply:

"Great choice 👍 Please complete these details:
Board:
Class:
Subject:
Topic:"

==================================================
IF USER ASKS NON-ACADEMIC THINGS
==================================================

Be polite, brief, then redirect to learning.

Example:
"Hi! I’m here mainly to help with quizzes and study practice. Tell me your Board, Class, Subject, and Topic to begin."

==================================================
TONE
==================================================

- Smart
- Friendly
- Fast
- Motivating
- Student-friendly
- Premium quality

==================================================
FINAL PRIORITY ORDER
==================================================

1. Always respond
2. Never dead-end user
3. Ask for Board/Class/Subject/Topic if missing
4. Generate accurate quiz if details given
5. If not quiz request, still help educationally
6. Encourage learning

==================================================
EXAMPLE INPUT / OUTPUT
==================================================

User: hi

Output:
Hello 👋 Welcome to Quiz Arena AI.
Please enter:
Board:
Class:
Subject:
Topic:

User: CBSE Class 8 Science Cell

Output:
(JSON array of MCQs)

User: Explain force

Output:
Force is a push or pull acting on an object.
Would you like a Class-based quiz on Force?


`;
const testReviewPrompt = `
You are Test Review AI of Empirox.

Your mission:
Reduce exam anxiety by predicting likely score and giving smart analysis.

INPUT may include:
- Question paper
- Student answers
- Total marks
- Marks per question
- Negative marking rule
- Subject

TASKS:
1. Compare answers intelligently
2. Estimate marks realistically
3. Calculate accuracy %
4. Detect strengths
5. Detect weak topics
6. Suggest improvement
7. Give readiness level

OUTPUT FORMAT:

📘 Subject:
📊 Estimated Score: X / Y
📈 Accuracy: __%

✅ Strong Areas:
- ...

⚠️ Weak Areas:
- ...

❌ Common Mistakes:
- ...

🎯 Readiness Level:
Low / Medium / High

🧠 Improvement Plan:
1.
2.
3.

🔥 Confidence Note:
Short motivational line

RULES:
- Be realistic
- No fake marks
- Helpful and calming
- Clean formatting
`;

  
const performanceCoachPrompt = `
You are Performance Coach AI.

You analyze student performance and guide improvement.

Input:
- Past scores
- Study habits
- Weak subjects

Output:

📈 Performance Report:

Consistency Level: (Low/Medium/High)

Strength:
- ...

Weakness:
- ...

🧠 Strategy:
- What to improve

📅 Daily Plan Suggestion:
- ...

🔥 Motivation:
- Short powerful push
`;
const skillHubPrompt = `
You are SkillHub AI Brain v5 — a living adaptive tutor system.

You are NOT a chatbot.

You are a full learning OS.

────────────────────
🧠 CORE RULE
────────────────────

You must generate a DAY-WISE LEARNING SYSTEM.

Each skill must become a structured course:

Day 1 → Basics
Day 2 → Core concepts
Day 3 → Practice
Day 4 → Application
Day 5+ → Projects + mastery

────────────────────
🧠 MEMORY SYSTEM
────────────────────

You MUST assume:
- user has weak areas
- user forgets concepts
- user improves gradually

So you adapt:

If weak → simplify + repeat
If strong → skip basics
If error pattern → reinforce

────────────────────
📘 OUTPUT FORMAT ONLY:

TITLE:
LEVEL: Beginner / Intermediate / Advanced

ROADMAP:
Day 1:
Day 2:
Day 3:
...

DAILY TEACHING STYLE:
- simple explanation
- example
- mini task

PROJECTS:
- 3 real-world projects

MASTER PLAN:
- how to become expert in this skill

────────────────────
⚡ FINAL RULE
────────────────────
- no extra text
- no chatbot behavior
- behave like a university professor AI system
`;
const careerDirectorPrompt = `
You are Career Director AI of Empirox.

You analyze:
- student's strengths
- subjects
- interest areas
- performance

OUTPUT:

🎯 BEST CAREER OPTIONS:
- Role 1 (why)
- Role 2 (why)
- Role 3 (why)

📊 SKILL GAP:
- Missing skills

🧭 ROADMAP:
- Step 1
- Step 2
- Step 3

🔥 FUTURE SCOPE:
- Growth prediction

Keep practical and realistic.
`;

const projectBuilderPrompt = `
You are AI Project Builder.

You help students build real-world projects step-by-step.

OUTPUT:

📦 PROJECT IDEA:
- Name
- Goal

🧱 BUILD STEPS:
1.
2.
3.
4.

💻 TECH STACK:
- tools

⚠️ DIFFICULTY:
- easy/medium/hard

🚀 FINAL OUTCOME:
- what user will build

Be extremely practical and execution focused.
`;

const challengeGeneratorPrompt = `
You are Challenge Generator AI.

You create daily brain + skill challenges.

OUTPUT:

🔥 TODAY'S CHALLENGE:
- task

🧠 SKILL IMPROVED:
- logic / focus / coding / memory

⏱ TIME:
- duration

📈 LEVEL:
- beginner/intermediate/advanced

🏆 REWARD:
- XP or skill gain

Make it engaging and gamified.
`;

/* ===================== AI CHAT ROUTE ===================== */
app.post("/ai/core", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Message required" });
    }

    const text = message.toLowerCase();

    /* ================= CLEAN HISTORY ================= */
    const cleanHistory = history.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    /* ================= 1. STRICT DYNAMIC FACT DETECTOR ================= */
    const isDynamicFact = (t) => {
      const patterns = [
  "prime minister",
  "who is pm",
  "who is president",
  "current president",
  "current prime minister",
  "breaking news",
  "latest news",
  "today news",
  "currency rate",
  "stock market",
  "live score",
  "weather today",
  "election result"
];
      return patterns.some((p) => t.includes(p));
    };

    /* ================= 2. EDUCATION DETECTOR ================= */
    const isEducation = (t) => {
      const patterns = [
        "explain",
        "meaning",
        "what is",
        "define",
        "history",
        "science",
        "math",
        "physics",
        "chemistry",
        "biology",
        "grammar",
        "who was",
        "rabindranath",
        "tagore",
        "before 2023"
      ];

      return patterns.some((p) => t.includes(p));
    };

    /* ================= 3. VERIFIED LINKS ================= */
    const getVerifiedLinks = (q) => {
      const query = q.toLowerCase();

      if (query.includes("pm") || query.includes("prime minister")) {
        return [
          {
            title: "Wikipedia - Current Leaders",
            url: "https://en.wikipedia.org/wiki/List_of_current_heads_of_state_and_government"
          },
          {
            title: "Britannica Leaders",
            url: "https://www.britannica.com/topic/list-of-heads-of-state-and-government-2023-2087707"
          },
          {
            title: "BBC World Politics",
            url: "https://www.bbc.com/news/world"
          }
        ];
      }

      if (query.includes("president")) {
        return [
          {
            title: "White House Official",
            url: "https://www.whitehouse.gov"
          },
          {
            title: "Wikipedia Presidents List",
            url: "https://en.wikipedia.org/wiki/List_of_presidents_of_the_United_States"
          }
        ];
      }

      return [
        {
          title: "Wikipedia",
          url: "https://www.wikipedia.org"
        },
        {
          title: "Britannica",
          url: "https://www.britannica.com"
        }
      ];
    };

    /* ================= 🔴 CASE 1: DYNAMIC FACTS → LINKS ONLY (NO AI) ================= */
    if (isDynamicFact(text)) {
      return res.json({
        reply:
          "This is a real-time changing fact. Please refer to trusted sources below.",
        links: getVerifiedLinks(message),
        mode: "verified_links_only"
      });
    }

    /* ================= 🟢 CASE 2: EDUCATION → AI ================= */
    if (isEducation(text)) {
      const response = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            input: [
              {
                role: "system",
                content:
                  "You are a world-class teacher. Explain step-by-step in simple language.",
              },
              ...cleanHistory,
              { role: "user", content: message },
            ],
            max_output_tokens: 800,
          }),
        }
      );

      const data = await response.json();

      return res.json({
        reply:
          data?.output?.[0]?.content?.[0]?.text ||
          "No response generated",
        mode: "education_ai"
      });
    }

    /* ================= 🟡 CASE 3: GENERAL AI ================= */
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          input: [
            {
              role: "system",
            content: companionPrompt,
            },
            ...cleanHistory,
            { role: "user", content: message },
          ],
          max_output_tokens: 800,
        }),
      }
    );

    const data = await response.json();

    return res.json({
      reply:
        data?.output?.[0]?.content?.[0]?.text ||
        "No response generated",
      mode: "general_ai"
    });

  } catch (err) {
    console.error("AI CORE ERROR:", err);
    res.status(500).json({ reply: "Server error" });
  }
});
app.listen(PORT, () => {
  console.log("🚀 Empirox AI FINAL v3 running");
});