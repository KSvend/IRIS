"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      background: "#f5f5f5",
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem" }}>IRIS Login</h1>

        {error && (
          <p style={{ color: "red", fontSize: "0.875rem", margin: "0 0 1rem" }}>
            {error}
          </p>
        )}

        <label style={{ display: "block", marginBottom: "1rem" }}>
          <span style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "1.5rem" }}>
          <span style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: loading ? "#999" : "#333",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
