import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// 1️⃣ IMPORT SUPABASE ON TOP
import { supabase } from "../lib/supabaseClient";
// use your correct path if different

export default function EmpiCraftTierSelector() {
  const navigate = useNavigate();

  /* ===============================
     STORAGE KEYS
  =============================== */
  const TRIAL_KEY = "empicraft_trial_start";
  const PLAN_KEY = "empicraft_plan";

  const [popup, setPopup] = useState(false);
  const [premiumPopup, setPremiumPopup] = useState(false);

  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hrs: 0,
    mins: 0,
    secs: 0,
  });

  /* ===============================
     TIMER SYSTEM (REAL 3 MONTH TRIAL)
  =============================== */
  useEffect(() => {
    const updateTimer = () => {
      const savedTrial = localStorage.getItem(TRIAL_KEY);

      if (!savedTrial) {
        setTimeLeft({
          days: 0,
          hrs: 0,
          mins: 0,
          secs: 0,
        });
        return;
      }

      const startDate = new Date(savedTrial);
      const endDate = new Date(startDate);

      // add 90 days = approx 3 months
      endDate.setDate(endDate.getDate() + 7);

      const now = new Date();
      const diff = endDate - now;

      if (diff <= 0) {
        localStorage.removeItem(TRIAL_KEY);
        localStorage.setItem(PLAN_KEY, "free");

        setTimeLeft({
          days: 0,
          hrs: 0,
          mins: 0,
          secs: 0,
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hrs = Math.floor(
        (diff / (1000 * 60 * 60)) % 24
      );
      const mins = Math.floor(
        (diff / (1000 * 60)) % 60
      );
      const secs = Math.floor(
        (diff / 1000) % 60
      );

      setTimeLeft({
        days,
        hrs,
        mins,
        secs,
      });
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ===============================
     BUTTON ACTIONS
  =============================== */

  // FREE PLAN
  const startFree = () => {
    localStorage.setItem(PLAN_KEY, "free");
    navigate("/empicraft/dashboard");
  };

  // START TRIAL
  const startTrial = () => {
    const alreadyStarted =
      localStorage.getItem(TRIAL_KEY);

    if (!alreadyStarted) {
      localStorage.setItem(
        TRIAL_KEY,
        new Date().toISOString()
      );
    }

    localStorage.setItem(PLAN_KEY, "trial");

    navigate("/empicraft/dashboard");
  };

 const startPremium = async () => {
  try {
    const res = await fetch(
      "https://empirox-backend-production.up.railway.app/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: "monthly" }),
      }
    );

    const data = await res.json();
    console.log("CREATE ORDER RESPONSE:", data);

    if (!res.ok || !data.success || !data.order) {
      alert(data.message || "Failed to create order");
      return;
    }

    const razorOrder = data.order;

    if (!window.Razorpay) {
      alert("Razorpay SDK not loaded");
      return;
    }

    const options = {
      key: "rzp_live_T596teW6GxIj86",
      amount: razorOrder.amount,
      currency: razorOrder.currency,
      name: "EmpiCraft",
      description: "Premium Plan",
      order_id: razorOrder.id,

      // ✅ IMPORTANT (LIVE STABILITY)
      prefill: {
        name: "EmpiCraft User",
        email: "user@empirox.com",
        contact: "9999999999",
      },

      handler: async function (response) {
        try {
          const verifyRes = await fetch(
            "https://empirox-backend-production.up.railway.app/verify-payment",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: "monthly",
                user_id: "USER_ID_HERE",
              }),
            }
          );

          const verifyData = await verifyRes.json().catch(() => ({}));

          console.log("VERIFY RESPONSE:", verifyData);

          if (verifyData?.success) {
            alert("Payment Successful 🎉");
            navigate("/empicraft/dashboard");
          } else {
            alert(verifyData?.message || "Payment verification failed");
          }
        } catch (err) {
          console.error("Verification error:", err);
          alert("Verification request failed");
        }
      },

      theme: {
        color: "#d4af37",
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", function (response) {
      console.error("PAYMENT FAILED:", response.error);
      alert(response.error.description || "Payment failed");
    });

    rzp.open();
  } catch (err) {
    console.error("START PREMIUM ERROR:", err);
    alert("Something went wrong. Please try again.");
  }
};
  // 2️⃣ ADD THIS FUNCTION INSIDE COMPONENT
const handleLogout = async (e) => {
  if (e) e.stopPropagation();

  try {
    await supabase.auth.signOut();

    localStorage.clear();

    const { login } = useContext(AuthContext);
    login(null);

    window.location.href = "/login";

  } catch (err) {
    localStorage.clear();
    window.location.href = "/login";
  }

};
const lockedClick = () => {
  setPopup(true);

  setTimeout(() => {
    setPopup(false);
  }, 2200);
};

  const Feature = ({ text }) => (
    <div style={styles.featureRow}>
      <span style={styles.tick}>✔</span>
      <span>{text}</span>
    </div>
  );


  return (
    <div style={styles.page}>
      {/* Locked Popup */}
      {popup && (
        <div style={styles.popup}>
          🔒 Upgrade to Premium to unlock
        </div>
      )}

      {/* Premium Popup */}
      {premiumPopup && (
        <div style={styles.popup}>
          💳 Payment gateway coming soon...
        </div>
      )}

      <div style={styles.wrapper}>
        {/* HEADER */}
       <div style={styles.header}>
  <div style={styles.logo}>👑</div>

  <div style={styles.brand}>EmpiCraft</div>

  <div style={styles.tag}>
    AI Learning. Unlimited Potential.
  </div>

  <button
    style={styles.logoutBtn}
    onClick={handleLogout}
  >
    Logout ↗
  </button>
</div>
  
        {/* MAIN CARD */}
        <div style={styles.mainCard}>
          {/* FREE */}
          <div style={styles.section}>
            <div style={styles.row}>
              <div style={styles.leftBox}>
                <div style={styles.iconBox}>📦</div>

                <div>
                  <div style={styles.title}>
                    FREE PLAN
                  </div>

                  <div style={styles.badgeDark}>
                    4 Features
                  </div>

                  <div style={styles.desc}>
                    Start your learning
                    <br />
                    journey with basics.
                  </div>

                  <button
                    style={styles.freeBtn}
                    onClick={startFree}
                  >
                    Start Free →
                  </button>
                </div>
              </div>

              <div style={styles.rightList}>
                <Feature text="Smart Chat" />
                <Feature text="Doubt Resolver" />
                <Feature text="Study Companion" />
                <Feature text="Block Builder" />
              </div>
            </div>

            <div style={styles.premiumRibbon}>
              💎 PREMIUM
            </div>
          </div>

          <div style={styles.line}></div>

          {/* TRIAL */}
          <div style={styles.sectionGlow}>
            <div style={styles.row}>
              <div style={styles.leftBox}>
                <div style={styles.goldIcon}>⚡</div>

                <div>
                  <div style={styles.goldTitle}>
                    3-MONTH TRIAL
                  </div>

                  <div style={styles.badgeGold}>
                    8 Core Features
                  </div>

                  <div style={styles.goldDesc}>
                    Unlock powerful AI tools
                    <br />
                    for 3 months.
                  </div>
                </div>
              </div>

              <div style={styles.rightList}>
                <Feature text="Smart Chat" />
                <Feature text="Doubt Solver" />
                <Feature text="Study Companion" />
                <Feature text="Block Builder" />
                <Feature text="Test Review" />
                <Feature text="Quiz Arena" />
                <Feature text="Study Planner" />
                <Feature text="AI Summary" />
              </div>

              <div style={styles.timerBox}>
                <div style={styles.timerLabel}>
                  TRIAL ENDS IN
                </div>

                <div style={styles.timerNumber}>
                  {timeLeft.days}d :
                  {timeLeft.hrs}h :
                  {timeLeft.mins}m :
                  {timeLeft.secs}s
                </div>

                <div style={styles.timerText}>
                  Real live timer based on
                  <br />
                  your trial activation.
                </div>

                <button
                  style={styles.freeBtn}
                  onClick={startTrial}
                >
                  Start Trial →
                </button>

                <div style={styles.smallText}>
                  No payment needed now
                </div>
              </div>
            </div>
          </div>

          <div style={styles.line}></div>

          {/* PREMIUM */}
          <div style={styles.section}>
            <div style={styles.row}>
              <div style={styles.leftBox}>
                <div style={styles.goldIcon}>👑</div>

                <div>
                  <div style={styles.goldTitle}>
                    PREMIUM PLAN
                  </div>

                  <div style={styles.badgeGold}>
                    All 11 Features
                  </div>

                  <div style={styles.desc}>
                    Everything unlocked.
                  </div>
                </div>
              </div>

              <div style={styles.rightList}>
                
                <Feature text="Career Detector" />
                <Feature text="Project Builder" />
              </div>

              <div style={styles.priceBox}>
                <div style={styles.price}>
                  ₹199
                  <span style={styles.month}>
                    /month
                  </span>
                </div>

                <button
                  style={styles.goldButton}
                  onClick={startPremium}
                >
                  Upgrade Premium 👑
                </button>

                <div style={styles.smallText}>
                  Razorpay next step later
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOCKED */}
        <div style={styles.lockTitle}>
          🔒 PREMIUM FEATURES 🔒
        </div>

        <div style={styles.cardsWrap}>
          {[
            
            ["🎯", "Career Detector"],
            ["🚀", "Project Builder"],
          ].map((item, i) => (
            <div
              key={i}
              style={styles.lockCard}
              onClick={lockedClick}
            >
              <div style={styles.bigIcon}>
                {item[0]}
              </div>
              <div style={styles.cardTitle}>
                {item[1]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===============================
   STYLES (same UI kept)
=============================== */

const gold = "#d4af37";

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top,#141414,#050505 60%)",
    padding: "25px",
    color: "white",
    fontFamily: "Inter, sans-serif",
  },

  wrapper: {
    maxWidth: "1180px",
    margin: "0 auto",
  },

  header: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "12px",
  textAlign: "center",
  marginBottom: "25px",
},

  logo: { fontSize: "42px" },

  brand: {
    fontSize: "56px",
    fontWeight: "800",
    color: gold,
  },

  tag: {
  color: "#aaa",
  fontSize: "20px",
  width: "100%",
  textAlign: "center",
  marginTop: "8px",
},

  mainCard: {
    border: `1px solid ${gold}55`,
    borderRadius: "28px",
    background:
      "linear-gradient(145deg,#080808,#0f0f0f)",
    overflow: "hidden",
  },

  section: { padding: "30px" },
  sectionGlow: {
    padding: "30px",
    background: "rgba(212,175,55,0.03)",
  },

  row: {
    display: "flex",
    gap: "28px",
    flexWrap: "wrap",
  },

  leftBox: {
    width: "300px",
    display: "flex",
    gap: "18px",
  },

  iconBox: {
    width: "72px",
    height: "72px",
    borderRadius: "18px",
    background: "#151515",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "34px",
  },

  goldIcon: {
    width: "72px",
    height: "72px",
    borderRadius: "18px",
    background:
      "linear-gradient(145deg,#f6d76f,#7b5a00)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "34px",
    color: "#000",
  },

  title: {
    fontSize: "34px",
    fontWeight: "800",
  },

  goldTitle: {
    fontSize: "34px",
    fontWeight: "800",
    color: gold,
  },

  badgeDark: {
    marginTop: "8px",
    padding: "6px 14px",
    borderRadius: "20px",
    background: "#1b1b1b",
    display: "inline-block",
  },

  badgeGold: {
    marginTop: "8px",
    padding: "6px 14px",
    borderRadius: "20px",
    background: `${gold}22`,
    display: "inline-block",
    color: gold,
  },

  desc: {
    marginTop: "14px",
    color: "#aaa",
    lineHeight: "1.6",
  },

  goldDesc: {
    marginTop: "14px",
    color: "#f7e2a0",
    lineHeight: "1.6",
  },

  freeBtn: {
    marginTop: "18px",
    padding: "12px 18px",
    borderRadius: "12px",
    background: "#171717",
    color: "white",
    border: "none",
    cursor: "pointer",
  },

  goldButton: {
    marginTop: "18px",
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    background:
      "linear-gradient(145deg,#f6d76f,#c89717)",
    border: "none",
    fontWeight: "800",
    cursor: "pointer",
  },

  rightList: { flex: 1 },

  featureRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },

  tick: { color: gold },

  timerBox: {
    width: "280px",
    border: `1px solid ${gold}55`,
    borderRadius: "20px",
    padding: "20px",
    background: "#0b0b0b",
  },

  timerLabel: {
    color: gold,
    textAlign: "center",
    fontWeight: "700",
  },

  timerNumber: {
    marginTop: "15px",
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "800",
  },

  timerText: {
    textAlign: "center",
    marginTop: "14px",
    color: "#aaa",
  },

  priceBox: {
    width: "280px",
    border: `1px solid ${gold}55`,
    borderRadius: "20px",
    padding: "20px",
    background: "#0b0b0b",
  },

  price: {
    fontSize: "38px",
    textAlign: "center",
    color: gold,
    fontWeight: "800",
  },

  month: {
    fontSize: "15px",
    color: "#aaa",
  },

  line: {
    height: "1px",
    background:
      "linear-gradient(90deg,transparent,#d4af37,transparent)",
  },

  premiumRibbon: {
    position: "absolute",
    top: "0",
    right: "0",
    padding: "10px 18px",
    background: gold,
    color: "#000",
    fontWeight: "800",
  },
  // 4️⃣ ADD THIS STYLE INSIDE styles OBJECT

logoutBtn: {
  marginTop: "18px",
  padding: "12px 18px",
  borderRadius: "12px",
  background: "#111",
  color: "#d4af37",
  border: "1px solid #d4af37",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "15px",
},

  lockTitle: {
    textAlign: "center",
    marginTop: "30px",
    fontSize: "24px",
    color: gold,
    fontWeight: "800",
  },

  cardsWrap: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginTop: "18px",
  },

  lockCard: {
    background: "#0c0c0c",
    border: `1px solid ${gold}33`,
    borderRadius: "20px",
    padding: "25px",
    textAlign: "center",
    cursor: "pointer",
  },

  bigIcon: { fontSize: "42px" },

  cardTitle: {
    marginTop: "12px",
    fontSize: "22px",
    fontWeight: "800",
  },

  smallText: {
    textAlign: "center",
    marginTop: "10px",
    color: "#888",
    fontSize: "13px",
  },

  popup: {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "#000",
    border: `1px solid ${gold}`,
    color: gold,
    padding: "14px 18px",
    borderRadius: "14px",
    zIndex: 999,
  },
};