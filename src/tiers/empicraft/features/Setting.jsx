import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Get logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;

      setUser(currentUser);

      if (currentUser) {
        // 📦 Fetch real profile from DB
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (!error) {
          setProfile(data);
        }
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading settings...</div>;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>⚙️ Settings</h1>

      {/* 👤 USER INFO */}
      <div style={styles.card}>
        <h3>👤 Account Info</h3>

        <p><b>Email:</b> {user?.email}</p>
        <p><b>Name:</b> {profile?.name || "Not set"}</p>
        <p><b>Standard:</b> {profile?.standard || "Not set"}</p>
      </div>

      {/* 🔐 LOGIN INFO */}
      <div style={styles.card}>
        <h3>🔐 Login Session</h3>
        <p>User ID: {user?.id}</p>
      </div>

      {/* ⚙️ FUTURE SETTINGS */}
      <div style={styles.card}>
        <h3>⚙️ Preferences</h3>
        <p>More settings coming soon...</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 20,
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
  card: {
    background: "#f5f5f5",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
};