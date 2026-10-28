
"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Login successful!");
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch {
      setMessage("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Login to your CampusRent account</p>

        <label style={styles.label}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          style={styles.input}
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          style={styles.input}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && <p style={styles.message}>{message}</p>}

        <p style={styles.footer}>
          Don't have an account? <Link href="/signup">Sign up</Link>
        </p>

        <Link href="/" style={styles.back}>Back to Home</Link>
      </form>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f3",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "36px",
    background: "#fff",
    borderRadius: "18px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
  },
  title: { margin: "0 0 8px", color: "#263b29", fontSize: "30px" },
  subtitle: { marginBottom: "28px", color: "#777" },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#333",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    marginBottom: "20px",
    border: "1px solid #ddd",
    borderRadius: "9px",
    fontSize: "15px",
  },
  button: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "9px",
    background: "#354c30",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  message: { marginTop: "16px", color: "#354c30", overflowWrap: "anywhere" },
  footer: { marginTop: "24px", textAlign: "center", color: "#666" },
  back: {
    display: "block",
    textAlign: "center",
    marginTop: "18px",
    color: "#777",
    textDecoration: "none",
  },
};
