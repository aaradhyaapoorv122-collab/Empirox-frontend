import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const gold = "#d4af37";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        style={styles.card}
      >
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h1 style={styles.title}>Privacy Policy</h1>

        <p style={styles.date}>
          Last Updated: June 2026
        </p>

        <p style={styles.subtitle}>
          Your privacy is important to Empirox.
        </p>

        <Section
          title="Information We Collect"
          items={[
            "Name",
            "Email Address",
            "Class / Standard",
            "Learning Progress",
            "Subscription Information",
            "Device Information"
          ]}
        />

        <Section
          title="How We Use Information"
          items={[
            "Create and manage your account",
            "Personalize learning experiences",
            "Track learning progress",
            "Improve app performance",
            "Provide customer support"
          ]}
        />

        <TextSection
          title="Data Security"
          text="We use industry-standard security measures to protect user information. Authentication and data storage are secured through trusted cloud services."
        />

        <TextSection
          title="Third-Party Services"
          text="Empirox may use trusted third-party services for authentication, cloud storage, analytics, notifications and payment processing."
        />

        <TextSection
          title="Children's Privacy"
          text="Empirox is designed for educational purposes. Parents or guardians may contact us regarding privacy-related concerns."
        />

        <TextSection
          title="Account Deletion"
          text="Users may request account deletion through the application settings or support channels. Associated data will be removed according to our retention policies."
        />

        <TextSection
          title="Contact"
          text="support@empiroxmindcraft.in"
        />

        <div style={styles.footer}>
          © 2026 Empirox. All Rights Reserved.
        </div>
      </motion.div>
    </div>
  );
}

function Section({ title, items }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.heading}>{title}</h2>

      <ul style={styles.list}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TextSection({ title, text }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.heading}>{title}</h2>
      <p style={styles.text}>{text}</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top,#141414,#000 70%)",
    display: "flex",
    justifyContent: "center",
    padding: 20,
    color: "white",
    fontFamily: "Inter, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: 900,
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${gold}55`,
    borderRadius: 26,
    backdropFilter: "blur(22px)",
    padding: 30,
  },

  backBtn: {
    background: "transparent",
    color: gold,
    border: `1px solid ${gold}`,
    borderRadius: 12,
    padding: "10px 16px",
    cursor: "pointer",
  },

  title: {
    color: gold,
    fontSize: 38,
    fontWeight: 900,
    marginTop: 20,
  },

  date: {
    color: "#aaa",
  },

  subtitle: {
    color: "#ddd",
    marginBottom: 25,
  },

  section: {
    marginTop: 28,
  },

  heading: {
    color: gold,
    marginBottom: 10,
  },

  list: {
    color: "#ddd",
    lineHeight: 1.8,
  },

  text: {
    color: "#ddd",
    lineHeight: 1.8,
  },

  footer: {
    marginTop: 40,
    textAlign: "center",
    color: "#888",
  },
};
