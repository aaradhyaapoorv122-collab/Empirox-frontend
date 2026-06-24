import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import {
  Search,
  Home,
  PanelLeftClose,
  PanelRightOpen,
  User,
  Settings
} from "lucide-react";

/* ===============================
   FEATURES (SOURCE OF TRUTH)
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
     PLAN STATE (SUPABASE)
  =============================== */
  const [planType, setPlanType] = useState("free");
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      setLoadingPlan(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setPlanType("free");
        setLoadingPlan(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("tier_plan, premium_expires_at, trial_start")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        setPlanType("free");
        setLoadingPlan(false);
        return;
      }

      const now = new Date();

      // PREMIUM
      if (data.tier_plan === "premium") {
        const expiry = data.premium_expires_at
          ? new Date(data.premium_expires_at)
          : null;

        setPlanType(!expiry || expiry > now ? "premium" : "free");
      }

      // TRIAL
      else if (data.tier_plan === "trial" && data.trial_start) {
        const start = new Date(data.trial_start);
        const end = new Date(start);
        end.setDate(end.getDate() + 90);

        setPlanType(end > now ? "trial" : "free");
      }

      // FREE
      else {
        setPlanType("free");
      }

      setLoadingPlan(false);
    };

    fetchPlan();
  }, []);

  /* ===============================
     ACCESS CONTROL (FIXED)
  =============================== */

  const freeLimit = 4;
  const trialLimit = 8;

  const activeAccess = useMemo(() => {
    if (planType === "premium") {
      return features.map(f => f.label); // ALL
    }

    if (planType === "trial") {
      return features.slice(0, trialLimit).map(f => f.label);
    }

    return features.slice(0, freeLimit).map(f => f.label);
  }, [planType]);

  const isUnlocked = (label) => {
    if (loadingPlan) return false;
    return activeAccess.includes(label);
  };

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
      {/* TOGGLE */}
      <button className="toggleBtn" onClick={() => setOpen(!open)}>
        {open ? <PanelLeftClose size={18} /> : <PanelRightOpen size={18} />}
      </button>

      {/* SIDEBAR */}
      <div
        className="sidebar"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* DASHBOARD */}
        <div className="item" onClick={() => navigate("/empicraft/dashboard")}>
          <Home size={18} style={{ marginRight: 10 }} />
          Dashboard
        </div>

        {/* PROFILE */}
        <div className="item" onClick={() => navigate("/empicraft/profile")}>
          <User size={18} style={{ marginRight: 10 }} />
          Profile
        </div>

        {/* SETTINGS */}
        <div className="item" onClick={() => navigate("/empicraft/settings")}>
          <Settings size={18} style={{ marginRight: 10 }} />
          Settings
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

        {/* FEATURES */}
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

      {/* STYLES (UNCHANGED) */}
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