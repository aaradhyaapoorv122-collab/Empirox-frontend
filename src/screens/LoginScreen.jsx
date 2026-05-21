import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
} from "react";

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "../context/AuthContext";

export default function AuthScreen() {
  const navigate = useNavigate();

  const { login } =
    useContext(AuthContext);

  const [name, setName] =
    useState("");

  const [standard, setStandard] =
    useState("1");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const STANDARDS =
    useMemo(
      () =>
        Array.from(
          { length: 12 },
          (_, i) => `${i + 1}`
        ).concat([
          "Above 12",
        ]),
      []
    );

  /* ==============================
     DEVICE ID
  ============================== */
  function getDeviceId() {
    let id =
      localStorage.getItem(
        "empirox_device_id"
      );

    if (!id) {
      id =
        "dev_" +
        crypto.randomUUID();

      localStorage.setItem(
        "empirox_device_id",
        id
      );
    }

    return id;
  }

  /* ==============================
     LOAD SAVED USER
  ============================== */
  useEffect(() => {
    const saved =
      localStorage.getItem(
        "empirox_user"
      );

    if (saved) {
      try {
        const parsed =
          JSON.parse(saved);

        if (parsed?.name)
          setName(parsed.name);

        if (parsed?.standard)
          setStandard(
            parsed.standard
          );
      } catch {}
    }
  }, []);

  /* ==============================
     SAVE PROFILE
  ============================== */
  async function saveProfile(
    authUser,
    deviceId
  ) {
    const payload = {
      id: authUser.id,
      device_id: deviceId,

      name,
      standard,

      role: "student",
      tier_plan: "free",

      updated_at:
        new Date().toISOString(),
    };

    localStorage.setItem(
      "empirox_user",
      JSON.stringify(payload)
    );

    await supabase
      .from("profiles")
      .upsert(payload, {
        onConflict: "id",
      });
  }

  /* ==============================
     START APP
  ============================== */
  const handleStart =
    async () => {
      if (
        !name ||
        !standard
      ) {
        setError(
          "Please enter name and class"
        );
        return;
      }

      setLoading(true);
      setError("");

      try {
        /* ==========================
           REAL AUTH SESSION
        ========================== */

        const {
          data,
          error,
        } =
          await supabase.auth.signInAnonymously();

        if (error)
          throw error;

        const authUser =
          data.user;

        if (!authUser)
          throw new Error(
            "User creation failed"
          );

        const deviceId =
          getDeviceId();

        /* ==========================
           SAVE PROFILE
        ========================== */

        await saveProfile(
          authUser,
          deviceId
        );

        /* ==========================
           GLOBAL USER
        ========================== */

        login(authUser);

        console.log(
          "AUTH SUCCESS"
        );

        /* ==========================
           NAVIGATION
        ========================== */

        navigate(
          "/tier-selector",
          {
            replace: true,
          }
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Something went wrong"
        );
      }

      setLoading(false);
    };

  /* ==============================
     UI
  ============================== */
  return (
    <div style={styles.page}>
      <motion.div
        initial={{
          opacity: 0,
          y: 30,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.5,
        }}
        style={styles.card}
      >
        <div
          style={styles.glowBox}
        />

        <h1 style={styles.title}>
          Empirox
        </h1>

        <p style={styles.sub}>
          Premium AI Learning
          System
        </p>

        <input
          style={styles.input}
          placeholder="Enter Your Name"
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
        />

        <select
          style={styles.input}
          value={standard}
          onChange={(e) =>
            setStandard(
              e.target.value
            )
          }
        >
          {STANDARDS.map(
            (s) => (
              <option key={s}>
                {s}
              </option>
            )
          )}
        </select>

        {error && (
          <div
            style={styles.error}
          >
            {error}
          </div>
        )}

        <button
          style={styles.button}
          onClick={handleStart}
          disabled={loading}
        >
          {loading
            ? "Starting..."
            : "Enter Empirox 🚀"}
        </button>

        <p style={styles.footer}>
          Secure Device Session •
          Premium Experience
        </p>
      </motion.div>
    </div>
  );
}

/* ==============================
   PREMIUM UI
============================== */

const gold =
  "#d4af37";

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent:
      "center",
    alignItems:
      "center",
    background:
      "radial-gradient(circle at top,#141414,#000 70%)",
    fontFamily:
      "Inter, sans-serif",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 430,
    padding: 32,
    borderRadius: 26,
    position: "relative",
    background:
      "rgba(255,255,255,0.05)",
    border: `1px solid ${gold}55`,
    backdropFilter:
      "blur(22px)",
    color: "white",
    boxShadow: `0 0 40px ${gold}22`,
    overflow: "hidden",
  },

  glowBox: {
    position: "absolute",
    top: -60,
    left: -60,
    width: 200,
    height: 200,
    background: gold,
    filter: "blur(120px)",
    opacity: 0.25,
    borderRadius: "50%",
  },

  title: {
    fontSize: 36,
    fontWeight: 900,
    color: gold,
    margin: 0,
    letterSpacing: 1,
  },

  sub: {
    color: "#aaa",
    marginBottom: 20,
    fontSize: 14,
  },

  input: {
    width: "100%",
    padding: 14,
    marginTop: 14,
    borderRadius: 14,
    border: `1px solid ${gold}33`,
    background: "#111",
    color: "white",
    outline: "none",
    fontSize: 14,
  },

  button: {
    width: "100%",
    padding: 14,
    marginTop: 18,
    borderRadius: 14,
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
    background: `linear-gradient(135deg, ${gold}, #b8860b)`,
    color: "#000",
    boxShadow: `0 0 25px ${gold}33`,
  },

  error: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    background:
      "rgba(255,0,0,0.15)",
    color: "#ff4d4d",
    fontSize: 13,
  },

  footer: {
    marginTop: 14,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
};