import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    try {
      await api.post("/auth/login", {
        email: form.email,
        password: form.password
      });
      localStorage.setItem("pendingEmail", form.email);
      setMsg("OTP sent to your email. Redirecting...");
      setTimeout(() => navigate("/verify-otp"), 800);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h1>Login</h1>
      {error && <div style={{ color: "#ff6b6b", marginBottom: 8 }}>{error}</div>}
      {msg && <div style={{ color: "#8ff09b", marginBottom: 8 }}>{msg}</div>}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}