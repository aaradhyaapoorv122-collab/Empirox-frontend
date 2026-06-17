import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
} from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "../context/AuthContext";

const gold = "#d4af37";

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [standard, setStandard] = useState("1");
  const [email, setEmail] = useState("");

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [acceptedPrivacy, setAcceptedPrivacy] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const STANDARDS = useMemo(
    () =>
      Array.from(
        { length: 12 },
        (_, i) => `${i + 1}`
      ).concat(["Above 12"]),
    []
  );

  const sendLoginLink = async () => {
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setError(
        "Please accept Terms & Conditions and Privacy Policy."
      );
      return;
    }

    try {
      setLoading(true);

      localStorage.setItem(
        "empirox_signup",
        JSON.stringify({
          name,
          standard,
          email,
        })
      );

    const { data, error } =
  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: "https://empiroxmindcraft.in",
    },
  });

console.log("OTP RESULT:", { data, error });
      if (error) {
        setError(error.message);
      } else {
        alert(
          "Login link sent. Please check your email."
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const handleSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const user = session.user;

    const storedData = JSON.parse(
      localStorage.getItem("empirox_signup") || "{}"
    );

    const name =
      user.user_metadata?.name ||
      storedData.name ||
      "Student";

    const standard =
      user.user_metadata?.standard ||
      storedData.standard ||
      "1";

    const payload = {
      id: user.id,
      email: user.email,
      name,
      standard,
      role: "student",
      tier_plan: "free",
      updated_at: new Date().toISOString(),
    };

    const { error: dbError } = await supabase
      .from("profiles")
      .upsert(payload, {
        onConflict: "id",
      });

    if (dbError) {
      console.log("DB Error:", dbError);
    }

    login(user);

    navigate("/tier-selector", {
      replace: true,
    });
  };

  handleSession();
}, [login, navigate]);

  return (
    <div style={styles.page}>
      <motion.div
        initial={{
          opacity: 0,
          y: 25,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        style={styles.card}
      >
        <h1 style={styles.title}>
          Welcome to Empirox
        </h1>

        <p style={styles.sub}>
          Create your account or sign in
          securely using email.
        </p>

        <input
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <select
          style={styles.input}
          value={standard}
          onChange={(e) =>
            setStandard(e.target.value)
          }
        >
          {STANDARDS.map((s) => (
            <option key={s}>
              {s}
            </option>
          ))}
        </select>

        <input
          style={styles.input}
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <div
          style={styles.checkboxContainer}
        >
          <label
            style={styles.checkboxLabel}
          >
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) =>
                setAcceptedTerms(
                  e.target.checked
                )
              }
            />

            <span>
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                style={styles.link}
              >
                Terms & Conditions
              </a>
            </span>
          </label>

          <label
            style={styles.checkboxLabel}
          >
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) =>
                setAcceptedPrivacy(
                  e.target.checked
                )
              }
            />

            <span>
              I agree to the{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noreferrer"
                style={styles.link}
              >
                Privacy Policy
              </a>
            </span>
          </label>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <button
          style={styles.button}
          onClick={sendLoginLink}
          disabled={loading}
        >
          {loading
            ? "Sending..."
            : "Continue"}
        </button>

        <p style={styles.footer}>
          Secure Authentication •
          Privacy Protected •
          Supabase Auth
        </p>
      </motion.div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "radial-gradient(circle at top,#141414,#000 70%)",
    padding: 20,
    fontFamily:
      "Inter, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: 460,
    padding: 32,
    borderRadius: 26,
    background:
      "rgba(255,255,255,0.05)",
    border: `1px solid ${gold}55`,
    backdropFilter: "blur(22px)",
    color: "#fff",
  },

  title: {
    fontSize: 34,
    fontWeight: 900,
    color: gold,
  },

  sub: {
    color: "#aaa",
    marginBottom: 18,
  },

  input: {
    width: "100%",
    padding: 14,
    marginTop: 14,
    borderRadius: 14,
    border: `1px solid ${gold}33`,
    background: "#111",
    color: "#fff",
    boxSizing: "border-box",
  },

  checkboxContainer: {
    marginTop: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  checkboxLabel: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    color: "#ddd",
    fontSize: 13,
  },

  link: {
    color: gold,
    textDecoration: "none",
    fontWeight: 700,
  },

  button: {
    width: "100%",
    padding: 14,
    marginTop: 20,
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    background: `linear-gradient(135deg, ${gold}, #b8860b)`,
  },

  error: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    background:
      "rgba(255,0,0,0.15)",
    color: "#ff4d4d",
  },

  footer: {
    marginTop: 16,
    textAlign: "center",
    color: "#888",
    fontSize: 12,
  },
};

