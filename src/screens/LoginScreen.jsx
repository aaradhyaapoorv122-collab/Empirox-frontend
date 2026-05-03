import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "../context/AuthContext";

export default function AuthScreen() {
  const navigate = useNavigate();
  const { user, setUser } =
    useContext(AuthContext);

    const [resetLoading, setResetLoading] = useState(false);

  const [mode, setMode] =
    useState("login");

  const [name, setName] =
    useState("");

  const [standard, setStandard] =
    useState("1");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const lockRef =
    useRef(false);

  const lastClickRef =
    useRef(0);

  const STANDARDS =
    useMemo(
      () =>
        Array.from(
          { length: 12 },
          (_, i) =>
            `${i + 1}`
        ).concat([
          "Above 12",
        ]),
      []
    );

  /* ===================================
     COUNTRY
  =================================== */
  function detectCountry() {
    try {
      const tz =
        Intl.DateTimeFormat().resolvedOptions()
          .timeZone;

      if (
        tz.includes(
          "Kolkata"
        )
      )
        return "India";

      if (
        tz.includes(
          "Tokyo"
        )
      )
        return "Japan";

      if (
        tz.includes(
          "Seoul"
        )
      )
        return "South Korea";

      return "Global";
    } catch {
      return "Global";
    }
  }

  /* ===================================
     PROFILE CREATOR
  =================================== */
  async function ensureProfile(authUser) {
  if (!authUser) return;

  const today = new Date().toISOString().split("T")[0];

  // check existing profile
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  const metaName =
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    authUser?.user_metadata?.given_name ||
    name ||
    authUser.email?.split("@")[0] ||
    "User";

  const metaStandard =
    authUser?.user_metadata?.standard ||
    standard ||
    "1";

  const payload = {
    id: authUser.id,
    email: authUser.email,

    // preserve old values if already saved
    name: existing?.name || metaName,
    standard: existing?.standard || metaStandard,

    country: existing?.country || detectCountry(),
    tier_plan: existing?.tier_plan || "free",
    role: existing?.role || "student",

    current_streak: existing?.current_streak || 1,
    strictness_score: existing?.strictness_score || 10,

    last_active_date:
      existing?.last_active_date || today,

    updated_at: new Date().toISOString(),
  };

  await supabase
    .from("profiles")
    .upsert(payload, {
      onConflict: "id",
    });

  localStorage.setItem(
    "empirox_profile",
    JSON.stringify(payload)
  );
}

  /* ===================================
     REAL STREAK UPDATE
  =================================== */
  async function updateStreak(
    authUser
  ) {
    if (!authUser)
      return;

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    const yesterday =
      new Date();

    yesterday.setDate(
      yesterday.getDate() -
        1
    );

    const yDate =
      yesterday
        .toISOString()
        .split("T")[0];

    const {
      data: profile,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(
          "current_streak,last_active_date"
        )
        .eq(
          "id",
          authUser.id
        )
        .single();

    if (!profile)
      return;

    let streak =
      profile.current_streak ||
      0;

    if (
      profile.last_active_date ===
      today
    ) {
      return;
    } else if (
      profile.last_active_date ===
      yDate
    ) {
      streak += 1;
    } else {
      streak = 1;
    }

    await supabase
      .from(
        "profiles"
      )
      .update({
        current_streak:
          streak,

        last_active_date:
          today,

        strictness_score:
          Math.min(
            streak *
              10,
            100
          ),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        authUser.id
      );
  }

  /* ===================================
     AUTH WATCHER
  =================================== */
  useEffect(() => {
    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          session
        ) => {
          if (
            session?.user
          ) {
            const authUser =
              session.user;

            setUser(
              authUser
            );

            localStorage.setItem(
              "empirox_user",
              JSON.stringify(
                authUser
              )
            );

            await ensureProfile(
              authUser
            );

            await updateStreak(
              authUser
            );

            navigate(
              "/tier-selector",
              {
                replace: true,
              }
            );
          }
        }
      );

    return () =>
      subscription.unsubscribe();
  }, []);

  /* ===================================
     REDIRECT
  =================================== */
  useEffect(() => {
    if (user) {
      navigate(
        "/tier-selector",
        {
          replace: true,
        }
      );
    }
  }, [user]);

  /* ===================================
     VALIDATE
  =================================== */
  function validate() {
    if (!email)
      return "Enter email.";

    if (
      !email.includes(
        "@"
      )
    )
      return "Valid email required.";

    if (!password)
      return "Enter password.";

    if (
      password.length <
      6
    )
      return "Password min 6 characters.";

    if (
      mode ===
        "signup" &&
      !name
    )
      return "Enter full name.";

    return "";
  }

/* ===================================
   FORGOT PASSWORD
=================================== */
async function handleForgotPassword() {
  if (!email) {
    setError("Enter your email first.");
    return;
  }

  try {
    setResetLoading(true);
    setError("");
    setSuccess("");

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo:
           window.location.origin + "/empicraft/reset-password"
        }
      );

    if (error) throw error;

    setSuccess(
      `🔑 Password reset link sent to ${email}. Check Inbox / Spam.`
    );

    // 30 second cooldown
    setTimeout(() => {
      setResetLoading(false);
    }, 30000);

  } catch (err) {
    if (
      err.message &&
      err.message
        .toLowerCase()
        .includes("rate limit")
    ) {
      setError(
        "Too many requests. Please wait a few minutes and try again."
      );
    } else {
      setError(
        err.message ||
        "Failed to send reset email."
      );
    }

    setResetLoading(false);
  }
}
/* ===================================
   LOGIN / SIGNUP
=================================== */
async function handleSubmit() {
  const now = Date.now();

  if (
    lockRef.current ||
    now - lastClickRef.current < 1200
  )
    return;

  lockRef.current = true;
  lastClickRef.current = now;

  setLoading(true);
  setError("");
  setSuccess("");

  try {
    const msg = validate();

    if (msg) throw new Error(msg);

      if (
        mode ===
        "login"
      ) {
        const {
          data,
          error,
        } =
          await supabase.auth.signInWithPassword(
            {
              email:
                email.trim(),
              password,
            }
          );

        if (error)
          throw error;

        await ensureProfile(
          data.user
        );

        await updateStreak(
          data.user
        );

       setUser(
  data.user
);
      }

      /* SIGNUP */
      else {
        const {
          data,
          error,
        } =
          await supabase.auth.signUp(
            {
              email:
                email.trim(),
              password,

              options:
                {
                  data: {
                    name:
                      name.trim(),
                    standard,
                  },
                },
            }
          );

        if (error)
          throw error;

        if (
          !data.session
        ) {
          setSuccess(
            
`🎉 Account created! Verification link sent to ${email}. Please check Inbox / Spam, click verify, then login.`

         );
          return;
        }

        await ensureProfile(
          data.user
        );

        await updateStreak(
          data.user
        );

        setUser(
  data.user
);
      }
   
  } catch (err) {
  if (
    err.message &&
    err.message
      .toLowerCase()
      .includes(
        "invalid login credentials"
      )
  ) {
    setError(
      "Incorrect email or password. Please try again or use Forgot Password."
    );
  } else {
    setError(
      err.message || "Failed."
    );
  }
}
}

  /* ===================================
     GOOGLE LOGIN
  =================================== */
const handleGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/login",
      skipBrowserRedirect: false
    }
  });
};

  return (
    <div style={styles.page}>
      <motion.div
        initial={{
          opacity: 0,
          y: 30,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        style={styles.card}
      >
        <h1 style={styles.title}>
          Empirox Login
        </h1>

        <p style={styles.sub}>
          Secure AI Access
        </p>

        {mode ===
          "signup" && (
          <>
            <input
              style={
                styles.input
              }
              placeholder="Full Name"
              value={
                name
              }
              onChange={(
                e
              ) =>
                setName(
                  e.target
                    .value
                )
              }
            />

            <select
              style={
                styles.input
              }
              value={
                standard
              }
              onChange={(
                e
              ) =>
                setStandard(
                  e.target
                    .value
                )
              }
            >
              {STANDARDS.map(
                (
                  s
                ) => (
                  <option
                    key={
                      s
                    }
                  >
                    {
                      s
                    }
                  </option>
                )
              )}
            </select>
          </>
        )}

        <input
          style={
            styles.input
          }
          placeholder="Email"
          value={
            email
          }
          onChange={(
            e
          ) =>
            setEmail(
              e.target
                .value
            )
          }
        />

        <div
          style={{
            position:
              "relative",
          }}
        >
          <input
            style={
              styles.input
            }
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder="Password"
            value={
              password
            }
            onChange={(
              e
            ) =>
              setPassword(
                e.target
                  .value
              )
            }
          />

          <span
            style={
              styles.eye
            }
            onClick={() =>
              setShowPassword(
                (
                  p
                ) =>
                  !p
              )
            }
          >
            {showPassword
              ? "Hide"
              : "Show"}
          </span>
        </div>

        {error && (
          <div
            style={
              styles.error
            }
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={
              styles.success
            }
          >
            {success}
          </div>
        )}

        <div
  style={styles.forgot}
  onClick={
    !resetLoading
      ? handleForgotPassword
      : null
  }
>
  {resetLoading
    ? "Please wait..."
    : "Forgot Password?"}
</div>

        <button
          style={
            styles.button
          }
          onClick={
            handleSubmit
          }
          disabled={
            loading
          }
        >
          {loading
            ? "Please wait..."
            : mode ===
              "login"
            ? "Login"
            : "Create Account"}
        </button>

        <button
  type="button"
  style={styles.google}
  onClick={handleGoogle}
>
  Continue with Google
</button>

        <p style={styles.switch}>
          {mode ===
          "login"
            ? "New here?"
            : "Already account?"}{" "}
          <span
            style={
              styles.switchBtn
            }
            onClick={() =>
              setMode(
                mode ===
                  "login"
                  ? "signup"
                  : "login"
              )
            }
          >
            Switch
          </span>
        </p>
      </motion.div>
    </div>
  );
}

const gold =
  "#d4af37";

const styles = {
  page: {
    minHeight:
      "100vh",
    display:
      "flex",
    justifyContent:
      "center",
    alignItems:
      "center",
    padding: 20,
    background:
      "radial-gradient(circle at top,#181818,#000 70%)",
    fontFamily:
      "Inter,sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: 430,
    padding: 30,
    borderRadius: 24,
    background:
      "rgba(255,255,255,0.05)",
    border:
      `1px solid ${gold}44`,
    backdropFilter:
      "blur(18px)",
    color:
      "white",
  },

  title: {
    fontSize: 32,
    margin: 0,
    color: gold,
    fontWeight: 800,
  },

  sub: {
    color:
      "#bbb",
    marginTop: 6,
    marginBottom: 12,
  },

  input: {
    width: "100%",
    padding: 13,
    marginTop: 10,
    borderRadius: 12,
    border:
      "1px solid #333",
    background:
      "#111",
    color:
      "white",
  },

  forgot: {
  marginTop: 8,
  textAlign: "right",
  fontSize: 13,
  color: "#d4af37",
  cursor: "pointer",
  fontWeight: 600,
},

  eye: {
    position:
      "absolute",
    right: 14,
    top: 24,
    fontSize: 12,
    cursor:
      "pointer",
    color:
      "#bbb",
  },

  button: {
    width: "100%",
    padding: 13,
    marginTop: 14,
    border: "none",
    borderRadius: 12,
    cursor:
      "pointer",
    fontWeight: 800,
    background:
      "linear-gradient(145deg,#f6d76f,#c89717)",
    color:
      "#000",
  },

  google: {
    width: "100%",
    padding: 13,
    marginTop: 10,
    border: "none",
    borderRadius: 12,
    cursor:
      "pointer",
    fontWeight: 700,
    background:
      "#fff",
    color:
      "#111",
  },

  switch: {
    marginTop: 14,
    textAlign:
      "center",
    fontSize: 13,
    color:
      "#aaa",
  },

  switchBtn: {
    color: gold,
    cursor:
      "pointer",
    fontWeight: 700,
  },

  error: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    background:
      "rgba(255,0,0,0.12)",
    color:
      "#ff9b9b",
  },

  success: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    background:
      "rgba(0,255,120,0.12)",
    color:
      "#8fffbc",
  },
};