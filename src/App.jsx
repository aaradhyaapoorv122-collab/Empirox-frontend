import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* ================= SCREENS ================= */
import LoginScreen from "./screens/LoginScreen";

import TierSelector from "./components/TierSelector";

/* ================= CONTEXT ================= */
import { AuthContext } from "./context/AuthContext";


/* ================= EMPICRAFT ================= */
import EmpiCraftDashboard from "./tiers/empicraft/EmpiCraftDashboard";
import EmpiCraftFeatureLayout from "./tiers/empicraft/layouts/EmpiCraftFeatureLayout";


import SmartChat from "./tiers/empicraft/features/SmartChat";
import StudyPlanner from "./tiers/empicraft/features/StudyPlanner";
import QuizArena from "./tiers/empicraft/features/QuizArenaSystem/QuizArena";
import ConceptBlocks from "./tiers/empicraft/features/ConceptBlocks";
import TestReview from "./tiers/empicraft/features/TestReview";
import SummaryMode from "./tiers/empicraft/features/SummaryMode";
import DoubtSolver from "./tiers/empicraft/features/DoubtSolver";
import StudyCompanion from "./tiers/empicraft/features/StudyCompanion";

import ProjectMaker from "./tiers/empicraft/features/ProjectMaker";
import CareerDetector from "./tiers/empicraft/features/CareerDetector";

/* ================= POLICIES ================= */
import PrivacyPolicy from "./screens/policies/PrivacyPolicy";
import TermsOfService from "./screens/policies/TermsOfService";


export default function App() {
  const { user, loadingUser } = useContext(AuthContext);

  /* ========== EMPI REMINDER ENGINE ========== */
 
  return (
    <Routes>
      
{/* ================= PUBLIC ================= */}
{!user && (
  <>
    <Route path="/login" element={<LoginScreen />} />

    {/* Privacy Policy */}
    <Route
      path="/privacy-policy"
      element={<PrivacyPolicy />}
    />

    {/* Terms & Conditions */}
    <Route
      path="/terms"
      element={<TermsOfService />}
    />

    <Route
      path="*"
      element={<Navigate to="/login" replace />}
    />
  </>
)}



      {/* ================= PROTECTED ================= */}
      {user && (
        <>
          {/* Tier Selector */}
          <Route path="/tier-selector" element={<TierSelector />} />

          {/* ===== EMPICRAFT DASHBOARD (NO SIDEBAR) ===== */}
          <Route
            path="/empicraft/dashboard"
            element={
                <EmpiCraftDashboard />
              
            }
          />

          {/* ===== EMPICRAFT FEATURES (WITH SIDEBAR) ===== */}
          <Route
            path="/empicraft"
            element={
             
                <EmpiCraftFeatureLayout />
              
            }
          >
            <Route path="smart-chat" element={<SmartChat />} />
            <Route path="study-planner" element={<StudyPlanner />} />
            <Route path="quiz-arena" element={<QuizArena />} />
            <Route path="test-review" element={<TestReview />} />
            <Route path="concept-block-builder" element={<ConceptBlocks />} />
            <Route path="AI-Summary-Mode" element={<SummaryMode />} />
            <Route path="/empicraft/doubt-solver" element={<DoubtSolver />} />
            <Route path="/empicraft/study-companion" element={<StudyCompanion />} />
            <Route path="/empicraft/career-detector" element={<CareerDetector />} />
            <Route path="/empicraft/project-maker" element={<ProjectMaker />} />
            
            </Route>
 

         

          {/* ===== DEFAULT ===== */}
          <Route path="/" element={<Navigate to="/tier-selector" replace />} />
          <Route path="*" element={<Navigate to="/tier-selector" replace />} />
        </>
      )}
    </Routes>
  );
}
