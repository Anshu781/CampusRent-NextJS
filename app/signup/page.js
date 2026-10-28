
"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Signup failed.");
        return;
      }

      setMessage("Account created! You can now log in.");
      setForm({ name: "", email: "", password: "" });
    } catch {
      setMessage("Server se connection nahi ho paaya.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <Link href="/" style={styles.brand}>
          CampusRent
        </Link>

        <p style={styles.tag}>YOUR CAMPUS. YOUR COMMUNITY.</p>
        <h1 style={styles.heading}>Create your account</h1>
        <p style={styles.subheading}>
          Join your campus community and start sharing.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Full name</label>
          <input
            style={styles.input}
            name="name"
            placeholder="Enter your name"
            value={form.name}
            onChange={handleChange}
            required
            maxLength={80}
          />

          <label style={styles.label}>Email address</label>
          <input
            style={styles.input}
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            name="password"
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />

          {message && (
            <p role="status" style={styles.message}>
              {message}
            </p>
          )}

          <button style={styles.button} disabled={loading}>
            {loading ? "Creating account..." : "Create account →"}
          </button>
        </form>

        <p style={styles.bottom}>
          Already have an account?{" "}
          <Link href="/login" style={styles.link}>
            Log in
          </Link>
        </p>

        <Link href="/" style={styles.back}>
          ← Back to homepage
        </Link>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f5f0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    background: "#fff",
    padding: "38px",
    borderRadius: "20px",
    boxShadow: "0 15px 50px rgba(0,0,0,0.07)",
  },
  brand: {
    color: "#171717",
    fontSize: "27px",
    fontWeight: "800",
    textDecoration: "none",
  },
  tag: {
    color: "#71816b",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "2px",
    marginTop: "30px",
  },
  heading: {
    fontSize: "29px",
    marginBottom: "8px",
    color: "#171717",
  },
  subheading: {
    color: "#777",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    marginTop: "25px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "8px",
    marginTop: "15px",
    color: "#333",
  },
  input: {
    padding: "13px",
    border: "1px solid #deded8",
    borderRadius: "9px",
    fontSize: "14px",
    outlineColor: "#71816b",
    background: "#fff",
    color: "#171717",
  },
  button: {
    marginTop: "24px",
    padding: "14px",
    border: "none",
    borderRadius: "9px",
    background: "#222c20",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
  },
  message: {
    fontSize: "13px",
    color: "#a14432",
    lineHeight: 1.5,
  },
  bottom: {
    marginTop: "24px",
    fontSize: "13px",
    textAlign: "center",
    color: "#666",
  },
  link: {
    color: "#354c30",
    fontWeight: "700",
  },
  back: {
    display: "block",
    textAlign: "center",
    marginTop: "22px",
    color: "#777",
    fontSize: "13px",
    textDecoration: "none",
  },
};
