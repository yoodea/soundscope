import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function OtpVerifyPage() {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("pendingEmail");
    if (!stored) {
      navigate("/login");
    } else {
      setEmail(stored);
    }
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/verify-otp", {
        email,
        otp
      });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.removeItem("pendingEmail");

      setMsg("Login successful. Redirecting...");
      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h1>Verify OTP</h1>
      <p style={{ fontSize: 14, color: "#aaa" }}>Email: {email}</p>
      {error && <div style={{ color: "#ff6b6b", marginBottom: 8 }}>{error}</div>}
      {msg && <div style={{ color: "#8ff09b", marginBottom: 8 }}>{msg}</div>}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <div>
          <input
            placeholder="Enter OTP code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}