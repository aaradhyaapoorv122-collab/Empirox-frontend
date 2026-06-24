import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Home, PanelLeftClose, PanelRightOpen } from "lucide-react";

/* ===============================
   FEATURES (UNCHANGED ORIGINAL)
================================ */
const features = [
  { label: "Smart Chat", icon: "🧠", route: "/empicraft/smart-chat" },
  { label: "Study Planner", icon: "🗓️", route: "/empicraft/study-planner" },
  { label: "Quiz Arena", icon: "🧩", route: "/empicraft/quiz-arena" },
  { label: "Test Review", icon: "📊", route: "/empicraft/test-review" },
  { label: "Concept Blocks", icon: "🧱", route: "/empicraft/concept-block-builder" },
  { label: "AI Summary", icon: "🧠📄", route: "/empicraft/AI-Summary-Mode" },
  { label: "Doubt Solver", icon: "❓", route: "/empicraft/doubt-solver" },
  { label: "Study Companion", icon: "🤖", route: "/empicraft/study-companion" },
  { label: "Project Maker", icon: "📚", route: "/empicraft/project-maker" },
  { label: "Career Detector", icon: "📈", route: "/empicraft/career-detector" },

];

export default function EmpiCraftSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(true);

  /* ===============================
     DASHBOARD SYNC (UNCHANGED LOGIC)
  =============================== */
  const [planType, setPlanType] = useState("free");

  useEffect(() => {
    const localPlan = localStorage.getItem("empicraft_plan") || "free";
    const trialStart = localStorage.getItem("empicraft_trial_start");

    if (localPlan === "premium") {
      setPlanType("premium");
    } else if (localPlan === "trial" && trialStart) {
      const start = new Date(trialStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 90);

      const left = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
      setPlanType(left > 0 ? "trial" : "free");
    } else {
      setPlanType("free");
    }
  }, []);

  /* ===============================
     ACCESS CONTROL (UNCHANGED)
  =============================== */
  const freeFeatures = ["Smart Chat", "Concept Blocks", "Study Companion", "Doubt Solver","Setting"];

  const trialFeatures = [
    ...freeFeatures,
    "Study Planner",
    "Quiz Arena",
    "Test Review",
    "AI Summary",
  ];

  const premiumFeatures = [
    ...trialFeatures,
    
    "Project Maker",
    "Career Detector",
  ];

  const activeAccess = useMemo(() => {
    if (planType === "premium") return premiumFeatures;
    if (planType === "trial") return trialFeatures;
    return freeFeatures;
  }, [planType]);

  const isUnlocked = (label) => activeAccess.includes(label);

  /* ===============================
     FILTER
  =============================== */
  const filtered = useMemo(() => {
    return features.filter((f) =>
      f.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleNavigate = (route, label) => {
    if (isUnlocked(label)) navigate(route);
    else navigate("/tier-selector");
  };

  return (
    <>
      {/* TOGGLE BUTTON (ONLY ADDITION) */}
      <button className="toggleBtn" onClick={() => setOpen(!open)}>
        {open ? <PanelLeftClose size={18} /> : <PanelRightOpen size={18} />}
      </button>

      {/* SIDEBAR (ONLY HIDE/SHOW, NOTHING ELSE CHANGED) */}
      <div
        className="sidebar"
        style={{
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* DASHBOARD */}
        <div className="item" onClick={() => navigate("/Empicraft/Dashboard")}>
          <Home size={18} style={{ marginRight: 10 }} />
          Back to Dashboard
        </div>

        {/* SEARCH */}
        <div className="searchBox">
          <Search size={16} />
          <input
            placeholder="Search features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* FEATURES (FULL VISIBILITY ALWAYS) */}
        <div className="list">
          {filtered.map((item) => {
            const unlocked = isUnlocked(item.label);
            const isActive = location.pathname === item.route;

            return (
              <div
                key={item.route}
                className={`item ${isActive ? "active" : ""}`}
                onClick={() => handleNavigate(item.route, item.label)}
                style={{ opacity: unlocked ? 1 : 0.4 }}
              >
                <span style={{ marginRight: 10 }}>{item.icon}</span>
                {item.label}
                {!unlocked && <span style={{ marginLeft: 8 }}>🔒</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* STYLE */}
      <style>{`
        .sidebar {
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          width: 300px;
          background: #0a0a0a;
          border-right: 1px solid #ff7a18;
          padding: 14px;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
          z-index: 1000;
        }

        .toggleBtn {
          position: fixed;
          top: 15px;
          left: 15px;
          z-index: 1200;
          background: #0a0a0a;
          border: 1px solid #ff7a18;
          color: #ff7a18;
          padding: 8px;
          border-radius: 10px;
          cursor: pointer;
        }

        .searchBox {
          display: flex;
          align-items: center;
          background: #111;
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 12px;
        }

        .searchBox input {
          background: transparent;
          border: none;
          outline: none;
          color: white;
          margin-left: 8px;
          width: 100%;
        }

        .list {
          flex: 1;
          overflow-y: auto;
        }

        .item {
          display: flex;
          align-items: center;
          padding: 12px;
          color: white;
          border-radius: 10px;
          cursor: pointer;
        }

        .item:hover {
          background: #1a1a1a;
        }

        .active {
          background: rgba(255,122,24,0.15);
          box-shadow: inset 3px 0 #ff7a18;
        }
      `}</style>
    </>
  );
}