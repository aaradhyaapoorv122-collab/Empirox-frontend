import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  async function handleReset() {
    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setMsg(error.message);
    } else {
      setMsg("✅ Password updated successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    }
  }

  return (
    <div style={{padding:40,color:"white"}}>
      <h1>Reset Password</h1>

      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
      />

      <button onClick={handleReset}>
        Save New Password
      </button>

      <p>{msg}</p>
    </div>
  );
}