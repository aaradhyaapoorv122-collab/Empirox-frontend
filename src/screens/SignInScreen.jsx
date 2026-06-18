import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "../context/AuthContext";

const gold = "#d4af37";

export default function SignInScreen() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Enter email and password");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      login(data.user);
      navigate("/tier-selector", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <div style={styles.page}>
      {/* BACKGROUND GLOW */}
      <div style={styles.bgGlow} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={styles.card}
      >
        {/* TITLE */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.title}
        >
          Welcome Back
        </motion.h1>

        <p style={styles.subtitle}>Sign in to continue to Empirox</p>

        {/* EMAIL */}
        <motion.input
          whileFocus={{ scale: 1.02 }}
          style={styles.input}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <motion.input
          whileFocus={{ scale: 1.02 }}
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* ERROR */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.error}
          >
            {error}
          </motion.div>
        )}

        {/* SIGN IN BUTTON */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing you in..." : "Sign In"}
        </motion.button>

        {/* DIVIDER */}
        <div style={styles.divider}>
          <span style={styles.dividerText}>OR</span>
        </div>

        {/* GOOGLE LOGIN */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={styles.google}
          onClick={googleLogin}
        >
          Continue with Google
        </motion.button>

        {/* FOOTER LINKS */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            New user?{" "}
            <span
              style={styles.link}
              onClick={() => navigate("/login")}
            >
              Create account
            </span>
          </p>

          <p style={styles.footerSmall}>
            By continuing, you agree to our{" "}
            <span
              style={styles.link}
              onClick={() => navigate("/terms")}
            >
              Terms
            </span>{" "}
            and{" "}
            <span
              style={styles.link}
              onClick={() => navigate("/privacy-policy")}
            >
              Privacy Policy
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "radial-gradient(circle at top, #111, #000)",
    position: "relative",
    overflow: "hidden",
  },

  bgGlow: {
    position: "absolute",
    width: 400,
    height: 400,
    background: gold,
    filter: "blur(150px)",
    opacity: 0.15,
    top: "-100px",
    left: "-100px",
  },

  card: {
    width: 420,
    padding: 32,
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${gold}`,
    backdropFilter: "blur(12px)",
    color: "#fff",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
  },

  title: {
    color: gold,
    fontSize: 30,
    marginBottom: 5,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 20,
  },

  input: {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    background: "#111",
    border: "1px solid #333",
    color: "#fff",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: 12,
    background: `linear-gradient(135deg, ${gold}, #b8860b)`,
    border: "none",
    fontWeight: "bold",
    marginTop: 10,
    borderRadius: 10,
    color: "#000",
  },

  google: {
    width: "100%",
    padding: 12,
    marginTop: 10,
    background: "#fff",
    color: "#000",
    fontWeight: "bold",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },

  error: {
    color: "#ff4d4d",
    fontSize: 13,
    marginBottom: 10,
  },

  divider: {
    margin: "15px 0",
    textAlign: "center",
    position: "relative",
  },

  dividerText: {
    fontSize: 12,
    color: "#666",
  },

  footer: {
    marginTop: 18,
    textAlign: "center",
  },

  footerText: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 6,
  },

  footerSmall: {
    color: "#666",
    fontSize: 11,
  },

  link: {
    color: gold,
    cursor: "pointer",
    fontWeight: "bold",
    textDecoration: "underline",
  },
};