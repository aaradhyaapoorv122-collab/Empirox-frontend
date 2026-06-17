import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const gold = "#d4af37";

export default function TermsAndConditions() {
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

        <h1 style={styles.title}>Terms & Conditions</h1>

        <p style={styles.date}>
          Last Updated: June 2026
        </p>

        <TextSection
          title="Acceptance of Terms"
          text="By accessing or using Empirox, you agree to comply with these Terms and Conditions."
        />

        <TextSection
          title="Educational Purpose"
          text="Empirox is designed to support learning, education, productivity and personal growth."
        />

        <Section
          title="User Responsibilities"
          items={[
            "Do not abuse the platform",
            "Do not upload harmful content",
            "Do not attempt unauthorized access",
            "Do not interfere with application functionality"
          ]}
        />

        <TextSection
          title="Account Usage"
          text="Users are responsible for maintaining the security and confidentiality of their accounts."
        />

        <TextSection
          title="Subscription Terms"
          text="Certain features may require premium access. Available plans and features may change over time."
        />

        <TextSection
          title="Intellectual Property"
          text="All content, branding, software, design and educational materials belong to Empirox unless otherwise stated."
        />

        <TextSection
          title="Limitation of Liability"
          text="Empirox is provided on an 'as available' basis. We do not guarantee uninterrupted availability of services."
        />

        <TextSection
          title="Termination"
          text="Accounts violating these terms may be restricted, suspended or permanently removed."
        />

        <TextSection
          title="Changes to Terms"
          text="These terms may be updated periodically. Continued use of the application constitutes acceptance of any revisions."
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

