import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { generateDashboardAI } from "../../utils/dashboardAI";

export default function EmpiCraftDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [userName, setUserName] =
    useState("User");
  const [email, setEmail] =
    useState("");
  const [standard, setStandard] =
    useState("");

  const [planType, setPlanType] =
    useState("free");
  const [trialDaysLeft, setTrialDaysLeft] =
    useState(0);

  /* REAL STREAK */
  const [streak, setStreak] =
    useState(0);

  const [aiData, setAiData] =
    useState(null);

  /* =====================================
     REAL STREAK SYSTEM
  ===================================== */
  const updateRealStreak =
    async (userId) => {
      const today =
        new Date()
          .toISOString()
          .split("T")[0];

      const yesterdayDate =
        new Date();

      yesterdayDate.setDate(
        yesterdayDate.getDate() - 1
      );

      const yesterday =
        yesterdayDate
          .toISOString()
          .split("T")[0];

      const { data: profile } =
        await supabase
          .from("profiles")
          .select(
            "current_streak,last_active_date"
          )
          .eq("id", userId)
          .single();

      let currentStreak =
        profile?.current_streak || 0;

      const lastDate =
        profile?.last_active_date;

      /* Already visited today */
      if (lastDate === today) {
        setStreak(currentStreak);
        return currentStreak;
      }

      /* Continued streak */
      if (lastDate === yesterday) {
        currentStreak += 1;
      } else {
        /* missed day -> reset */
        currentStreak = 1;
      }

      await supabase
        .from("profiles")
        .update({
          current_streak:
            currentStreak,
          last_active_date:
            today,
        })
        .eq("id", userId);

      setStreak(currentStreak);

      return currentStreak;
    };

  /* =====================================
     LOAD
  ===================================== */
  useEffect(() => {
    async function init() {
      try {
        /* PLAN FROM LOCAL */
        const localPlan =
          localStorage.getItem(
            "empicraft_plan"
          ) || "free";

        const trialStart =
          localStorage.getItem(
            "empicraft_trial_start"
          );

        if (
          localPlan ===
          "premium"
        ) {
          setPlanType(
            "premium"
          );
        } else if (
          localPlan ===
            "trial" &&
          trialStart
        ) {
          const start =
            new Date(
              trialStart
            );

          const end =
            new Date(
              start
            );

          end.setDate(
            end.getDate() + 7
          );

          const diff =
            end -
            new Date();

          const left =
            Math.ceil(
              diff /
                (1000 *
                  60 *
                  60 *
                  24)
            );

          if (left > 0) {
            setPlanType(
              "trial"
            );
            setTrialDaysLeft(
              left
            );
          } else {
            setPlanType(
              "free"
            );
          }
        }

        /* USER */
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) {
          navigate("/login");
          return;
        }

        setEmail(
          user.email || ""
        );

        const {
          data: profile,
        } = await supabase
          .from("profiles")
          .select(
            "name,standard"
          )
          .eq(
            "id",
            user.id
          )
          .single();

        setUserName(
          profile?.name ||
            user
              ?.email?.split(
                "@"
              )[0] ||
            "User"
        );

        setStandard(
          profile?.standard ||
            ""
        );

        /* REAL STREAK */
        const liveStreak =
          await updateRealStreak(
            user.id
          );

        /* AI SYSTEM */
        const ai =
          generateDashboardAI(
            {
              current_streak:
                liveStreak,
              strictness_score:
                Math.min(
                  liveStreak *
                    10,
                  100
                ),
            }
          );

        setAiData(
          ai
        );
      } catch (err) {
        console.log(err);
      } finally {
        setTimeout(
          () =>
            setLoading(
              false
            ),
          1200
        );
      }
    }

    init();
  }, [navigate]);

  /* =====================================
     FEATURES
  ===================================== */
  const freeFeatures = [
    "Smart Chat",
    "Concept Builder",
    "Study Companion",
    "Doubt Solver",
  ];

  const trialFeatures = [
    "Smart Chat",
    "Study Planner",
    "Quiz Arena",
    "Test Review",
    "Concept Builder",
    "AI Summary",
    "Doubt Solver",
    "Study Companion",
    "Blog Builder",
  ];

  const premiumFeatures = [
    ...trialFeatures,
    "Career Detector",
    "Project Builder",
  ];

  const activeAccess =
    useMemo(() => {
      if (
        planType ===
        "premium"
      )
        return premiumFeatures;

      if (
        planType ===
        "trial"
      )
        return trialFeatures;

      return freeFeatures;
    }, [planType]);

  const isUnlocked = (
    label
  ) =>
    activeAccess.includes(
      label
    );

  const handleClick = (
    label,
    route
  ) => {
    if (
      isUnlocked(
        label
      )
    ) {
      navigate(route);
    } else {
      navigate(
        "/tier-selector"
      );
    }
  };

  if (loading) {
    return (
      <div
        style={
          styles.loader
        }
      >
        <div
          style={
            styles.rocket
          }
        >
          🚀
        </div>

        <h1
          style={
            styles.loaderTitle
          }
        >
          Launching Dashboard
        </h1>

        <p>
          Syncing AI,
          streak &
          progress...
        </p>
      </div>
    );
  }

  const features = [
    [
      "🧠",
      "Smart Chat",
      "/empicraft/smart-chat",
    ],
    [
      "📅",
      "Study Planner",
      "/empicraft/study-planner",
    ],
    [
      "🎯",
      "Quiz Arena",
      "/empicraft/quiz-arena",
    ],
    [
      "📊",
      "Test Review",
      "/empicraft/test-review",
    ],
    [
      "🧱",
      "Concept Builder",
      "/empicraft/concept-block-builder",
    ],
    [
      "📄",
      "AI Summary",
      "/empicraft/AI-Summary-Mode",
    ],
    [
      "❓",
      "Doubt Solver",
      "/empicraft/doubt-solver",
    ],
    [
      "🤖",
      "Study Companion",
      "/empicraft/study-companion",
    ],
   
    [
      "📈",
      "Career Detector",
      "/empicraft/career-detector",
    ],
    [
      "🚀",
      "Project Builder",
      "/empicraft/project-maker",
    ],
  ];

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div
        style={
          styles.header
        }
      >
        <div>
          <h1
            style={
              styles.title
            }
          >
            Welcome,{" "}
            {userName} 👑
          </h1>

          <p
            style={
              styles.sub
            }
          >
            {standard
              ? `Class ${standard}`
              : email}
          </p>
        </div>

        <button
          style={
            styles.planBtn
          }
          onClick={() =>
            navigate(
              "/tier-selector"
            )
          }
        >
          Plans
        </button>
      </div>

      {/* STREAK */}
      <div
        style={
          styles.streakCard
        }
      >
        🔥 Current
        Streak:{" "}
        <b>
          {streak}{" "}
          day
          {streak !==
          1
            ? "s"
            : ""}
        </b>
      </div>

      {/* PLAN */}
      <div
        style={
          styles.card
        }
      >
        <h2>
          {planType ===
            "free" &&
            "🟢 Free Plan"}

          {planType ===
            "trial" &&
            "🚀 Trial Plan"}

          {planType ===
            "premium" &&
            "👑 Premium Plan"}
        </h2>

        {planType ===
          "trial" && (
          <p>
            {
              trialDaysLeft
            }{" "}
            days left
          </p>
        )}
      </div>

      {/* AI */}
      <div
        style={
          styles.card
        }
      >
        <h2>
          🤖 AI Focus
        </h2>

        <p>
          {aiData
            ?.title ||
            "Keep learning daily."}
        </p>

        <p
          style={
            styles.small
          }
        >
          {aiData
            ?.action}
        </p>
      </div>

      {/* FEATURES */}
      <div
        style={
          styles.grid
        }
      >
        {features.map(
          (
            item
          ) => {
            const unlocked =
              isUnlocked(
                item[1]
              );

            return (
              <div
                key={
                  item[1]
                }
                onClick={() =>
                  handleClick(
                    item[1],
                    item[2]
                  )
                }
                style={{
                  ...styles.feature,
                  opacity:
                    unlocked
                      ? 1
                      : 0.45,
                }}
              >
                <div
                  style={
                    styles.icon
                  }
                >
                  {
                    item[0]
                  }
                </div>

                <p>
                  {
                    item[1]
                  }
                </p>

                {!unlocked && (
                  <span>
                    🔒
                  </span>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

/* ===================================== */

const gold =
  "#d4af37";

const styles = {
  page: {
    minHeight:
      "100vh",
    background:
      "radial-gradient(circle at top,#181818,#000 70%)",
    color:
      "white",
    padding: 25,
    fontFamily:
      "Inter,sans-serif",
  },

  loader: {
    minHeight:
      "100vh",
    display:
      "flex",
    flexDirection:
      "column",
    justifyContent:
      "center",
    alignItems:
      "center",
    background:
      "radial-gradient(circle,#181818,#000)",
    color:
      "white",
  },

  rocket: {
    fontSize:
      70,
  },

  loaderTitle: {
    color: gold,
    marginTop: 10,
  },

  header: {
    display:
      "flex",
    justifyContent:
      "space-between",
    flexWrap:
      "wrap",
    gap: 15,
  },

  title: {
    margin: 0,
    color: gold,
  },

  sub: {
    color:
      "#aaa",
  },

  planBtn: {
    padding:
      "10px 16px",
    background:
      "#111",
    color:
      "white",
    border:
      `1px solid ${gold}`,
    borderRadius:
      12,
    cursor:
      "pointer",
  },

  streakCard: {
    marginTop: 20,
    padding: 18,
    borderRadius:
      18,
    background:
      "#111",
    border:
      `1px solid ${gold}44`,
    fontSize: 20,
  },

  card: {
    marginTop: 18,
    padding: 20,
    borderRadius:
      18,
    background:
      "#0c0c0c",
    border:
      `1px solid ${gold}33`,
  },

  small: {
    color:
      "#bbb",
  },

  grid: {
    marginTop: 25,
    display:
      "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(170px,1fr))",
    gap: 16,
  },

  feature: {
    padding: 20,
    borderRadius:
      18,
    background:
      "#111",
    border:
      `1px solid ${gold}22`,
    textAlign:
      "center",
    cursor:
      "pointer",
  },

  icon: {
    fontSize:
      30,
    marginBottom: 10,
  },
};