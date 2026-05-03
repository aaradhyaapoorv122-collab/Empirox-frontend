import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vltnsegmcunpzxndldcf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdG5zZWdtY3VucHp4bmRsZGNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDkxNjUsImV4cCI6MjA3ODc4NTE2NX0.URo0pfgj6KBtMpi1Q_nfmB3AjiQFGhXOJQ-pKC5LIOI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);