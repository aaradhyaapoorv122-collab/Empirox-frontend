import React, { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const MAX_FILES = 6;

export default function SmartChat() {
  const { user } = useContext(AuthContext);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const messagesEndRef = useRef(null);
  const fileRef = useRef(null);
  const sessionStartTime = useRef(Date.now());
  const sessionId = useRef(crypto.randomUUID());
  const [debug, setDebug] = useState(null);

  /* ================= SCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ================= TIMER ================= */
  const formatSessionTime = () => {
    const s = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  /* ================= SAFE DATE ================= */
  const safeDate = (d) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return new Date();
    return date;
  };

  /* ================= LOAD CHATS ================= */
 useEffect(() => {
  if (!user?.id) return;

  const loadChats = async () => {
    const { data, error } = await supabase
      .from("feature_history")
      .select("*")
      .eq("user_id", user.id)
      .eq("feature_name", "smart_chat")
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.log("Load error:", error.message);
      return;
    }

    const cleaned = (data || []).map((item) => ({
      ...item,
      created_at: safeDate(item.created_at).toISOString(),
    }));

    setChatSessions(cleaned);
  };

  loadChats();
}, [user]);

useEffect(() => {
  if (!user?.id) return;
  if (!activeSessionId) return;
  if (messages.length === 0) return;

  const timeout = setTimeout(async () => {
    try {
     await supabase.from("feature_history").upsert({
  id: activeSessionId,
  user_id: user.id,
  feature_name: "smart_chat",

  title:
    messages.find((m) => m.type === "question")
      ?.text?.slice(0, 30) || "New Chat",

  content: {
    messages: messages,
  },

  deleted: false,
  created_at: new Date().toISOString(),
},
{
  onConflict: "id"

      });
    } catch (err) {
      console.log("Save error:", err.message);
    }
  }, 800); // faster + smoother like ChatGPT

  return () => clearTimeout(timeout);
}, [messages, user, activeSessionId]);

  /* ================= LOAD CHAT ================= */
  const loadChat = (chat) => {
    setActiveSessionId(chat.id);

    const safeMessages = chat.content?.messages || [];

    setMessages(
      safeMessages.map((m) => ({
        ...m,
        time: safeDate(m.time || chat.created_at).toISOString(),
      }))
    );
  };

  /* ================= NEW CHAT ================= */
 const startNewChat = async () => {
  const id = crypto.randomUUID();

  setActiveSessionId(id);
  sessionId.current = id;

  setMessages([]);
  setInput("");
  setUploadedFiles([]);

  // IMPORTANT: create DB record immediately
  await supabase.from("feature_history").insert({
    id,
    user_id: user?.id,
    feature_name: "smart_chat",
    title: "New Chat",
    content: { messages: [] },
    deleted: false,
    created_at: new Date().toISOString(),
  });
};
  /* ================= DELETE CHAT ================= */
  const deleteChat = async (id) => {
    await supabase
      .from("feature_history")
      .update({
        deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    setChatSessions((prev) => prev.filter((c) => c.id !== id));
  };

  /* ================= FILE ================= */
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);

    if (uploadedFiles.length + files.length > MAX_FILES) return;

    setUploadedFiles((p) => [...p, ...files]);

    setMessages((p) => [
      ...p,
      {
        type: "system",
        text: `📎 ${files.length} file(s) uploaded`,
        time: new Date().toISOString(),
      },
    ]);
  };

  /* ================= SEND ================= */
  const handleSend = async () => {
  if (!input.trim()) return;

  const question = input.trim();

  const newMessages = [
    ...messages,
    {
      type: "question",
      text: question,
      time: new Date().toISOString(),
    },
  ];

  setMessages(newMessages);
  setInput("");
  setLoading(true);

  try {
    const history = newMessages
      .filter((m) => m.type === "question" || m.type === "answer")
      .slice(-12)
      .map((m) => ({
        role: m.type === "question" ? "user" : "assistant",
        content: m.text,
      }));

    const res = await fetch("https://empirox-backend-production.up.railway.app/ai/core", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: question,
        history,
        feature: "smart_chat",
      }),
    });

    const data = await res.json();

    setDebug(data?.debug); // ✅ IMPORTANT

   const finalReply = data?.reply || "⚠️ No response";

const links = data?.links || [];
    setMessages((prev) => [
  ...prev,
  {
    type: "answer",
    text: finalReply,
    links: links,
    time: new Date().toISOString(),
  },
]);
  

  } catch (err) {
    setMessages((prev) => [
      ...prev,
      {
        type: "answer",
        text: "⚠️ Something went wrong",
        time: new Date().toISOString(),
      },
    ]);
  }



  setLoading(false);
};
  /* ================= UI ================= */
 return (
  <div style={styles.container}>
    
    {/* SIDEBAR */}
    <div style={styles.sidebar}>
      <div style={styles.brand}>🧠 Smart Chat</div>

      <button style={styles.newBtn} onClick={startNewChat}>
        + New Chat
      </button>

      <div style={styles.chatList}>
        {chatSessions.map((c) => (
          <div
            key={c.id}
            style={styles.chatItem}
          >
            <div onClick={() => loadChat(c)} style={{ flex: 1 }}>
              💬 {c.title}
            </div>
            <button onClick={() => deleteChat(c.id)} style={styles.delBtn}>
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>

    {/* MAIN CHAT AREA */}
    <div style={styles.chatArea}>
      
      {/* TOP BAR (GLASS STYLE FEEL) */}
      <div style={styles.topBar}>
        <div style={{ fontWeight: 600 }}>Smart Chat AI</div>

        {debug?.realtimeMode && (
          <div style={{ color: "#00ff88", fontSize: 12 }}>
            ⚡ Real-time mode ON
          </div>
        )}

        <div style={{ color: "#D4AF37", fontSize: 13 }}>
          {formatSessionTime()}
        </div>
      </div>

      {/* CHAT MESSAGES */}
      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems:
                m.type === "question" ? "flex-end" : "flex-start",
              marginBottom: 18,
            }}
          >

            {/* USER MESSAGE */}
            {m.type === "question" && (
              <div style={styles.userMsg}>
                {m.text}
              </div>
            )}

            {/* AI MESSAGE */}
            {m.type === "answer" && (
              <div style={styles.aiMsg}>
                {m.text}

                {/* LINKS AS CARDS */}
                {m.links && m.links.length > 0 && (
                  <div style={styles.linkBox}>
                    {m.links.map((l, idx) => (
                      <a
                        key={idx}
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.linkCard}
                      >
                        🔗 {l.title}
                        <span style={{ opacity: 0.6 }}>→</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        ))}

        {/* LOADING STATE */}
        {loading && (
          <div style={styles.loadingText}>
            {debug?.realtimeMode
              ? "🌐 Fetching verified sources..."
              : "🧠 Thinking..."}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div style={styles.inputBar}>
        
        <button
          onClick={() => fileRef.current.click()}
          style={styles.iconBtn}
        >
          📎
        </button>

        <input
          type="file"
          multiple
          hidden
          ref={fileRef}
          onChange={handleFileSelect}
        />

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Smart Chat..."
          style={styles.input}
        />

        <button onClick={handleSend} style={styles.sendBtn}>
          ➤
        </button>

      </div>
    </div>
  </div>
);
}

/* ================= STYLES ================= */
const styles = {
  /* ================= LAYOUT ================= */
  container: {
    display: "flex",
    height: "100vh",
    background:
      "radial-gradient(circle at top, #0a0a0a 0%, #000 60%, #000 100%)",
    color: "#EAEAEA",
    fontFamily: "Inter, sans-serif",
  },

  /* ================= SIDEBAR ================= */
  sidebar: {
    width: 280,
    background:
      "linear-gradient(180deg, rgba(10,10,10,0.98), rgba(5,5,5,0.95))",
    padding: 15,
    borderRight: "1px solid rgba(212,175,55,0.15)",
    boxShadow: "0 0 25px rgba(212,175,55,0.05)",
  },

  brand: {
    fontSize: 20,
    fontWeight: 900,
    color: "#D4AF37",
    marginBottom: 14,
    letterSpacing: 1,
    textShadow: "0 0 12px rgba(212,175,55,0.4)",
  },

  newBtn: {
    width: "100%",
    padding: 11,
    background:
      "linear-gradient(135deg, #D4AF37, #f6d365)",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
    color: "#111",
    boxShadow: "0 0 18px rgba(212,175,55,0.35)",
    transition: "0.2s",
  },

  chatList: {
    marginTop: 12,
  },

  chatItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    background:
      "rgba(255,255,255,0.03)",
    marginBottom: 6,
    borderRadius: 10,
    border: "1px solid rgba(212,175,55,0.12)",
    transition: "0.2s",
  },

  delBtn: {
    background: "transparent",
    border: "none",
    color: "#D4AF37",
    cursor: "pointer",
    fontSize: 14,
    opacity: 0.8,
  },

  /* ================= CHAT AREA ================= */
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background:
      "radial-gradient(circle at bottom, rgba(212,175,55,0.05), transparent 60%)",
  },

  topBar: {
    padding: "12px 16px",
    borderBottom: "1px solid rgba(212,175,55,0.12)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background:
      "rgba(0,0,0,0.6)",
    backdropFilter: "blur(10px)",
  },

  /* ================= CHAT BOX ================= */
  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  /* ================= MESSAGES ================= */
  userMsg: {
    padding: "12px 14px",
    borderRadius: 14,
    maxWidth: "70%",
    alignSelf: "flex-end",
    background:
      "linear-gradient(135deg, #D4AF37, #ffdd77)",
    color: "#111",
    fontWeight: 600,
    boxShadow: "0 0 18px rgba(212,175,55,0.25)",
  },

  aiMsg: {
    padding: "12px 14px",
    borderRadius: 14,
    maxWidth: "70%",
    alignSelf: "flex-start",
    background:
      "rgba(255,255,255,0.04)",
    border: "1px solid rgba(212,175,55,0.15)",
    color: "#EAEAEA",
    boxShadow: "0 0 20px rgba(0,0,0,0.4)",
  },

  /* ================= LINKS ================= */
  linkBox: {
    marginTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  linkCard: {
    padding: "10px 12px",
    borderRadius: 10,
    background:
      "rgba(212,175,55,0.08)",
    border: "1px solid rgba(212,175,55,0.2)",
    color: "#D4AF37",
    textDecoration: "none",
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    transition: "0.2s",
  },

  /* ================= INPUT ================= */
  inputBar: {
    display: "flex",
    padding: 12,
    borderTop: "1px solid rgba(212,175,55,0.12)",
    background:
      "rgba(5,5,5,0.9)",
    backdropFilter: "blur(10px)",
  },

  input: {
    flex: 1,
    padding: 12,
    background: "#0d0d0d",
    border: "1px solid rgba(212,175,55,0.2)",
    color: "#fff",
    borderRadius: 12,
    outline: "none",
    transition: "0.2s",
  },

  sendBtn: {
    marginLeft: 10,
    background:
      "linear-gradient(135deg, #D4AF37, #ffcc33)",
    border: "none",
    padding: "10px 16px",
    cursor: "pointer",
    borderRadius: 12,
    fontWeight: 900,
    color: "#111",
    boxShadow: "0 0 18px rgba(212,175,55,0.35)",
    transition: "0.2s",
  },

  iconBtn: {
    marginRight: 10,
    background: "rgba(0,0,0,0.6)",
    color: "#D4AF37",
    border: "1px solid rgba(212,175,55,0.3)",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    transition: "0.2s",
  },

  /* ================= STATES ================= */
  loadingText: {
    color: "#D4AF37",
    fontSize: 13,
    opacity: 0.8,
    padding: 10,
    textAlign: "center",
  },
};