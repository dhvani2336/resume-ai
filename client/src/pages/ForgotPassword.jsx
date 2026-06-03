import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setDevOtp("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate password reset request.");
      }

      setSuccessMsg(data.message || "A password reset code has been sent.");
      
      // If development mode, API returns OTP to ease debugging
      if (data.otp) {
        setDevOtp(data.otp);
      }

      // Small delay before redirecting to reset page
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="glass-card auth-card">
        <h2 className="auth-title">Forgot Password</h2>
        <p className="auth-desc">Enter your email address and we'll dispatch a 6-digit reset code.</p>

        {error && <div className="auth-error-alert">{error}</div>}
        {successMsg && (
          <div className="glass-card" style={{ padding: "0.75rem", marginBottom: "1rem", borderLeft: "4px solid var(--color-emerald)" }}>
            <p style={{ color: "var(--color-emerald)", fontSize: "0.875rem" }}>{successMsg}</p>
          </div>
        )}

        {devOtp && (
          <div className="glass-card" style={{ padding: "0.75rem", marginBottom: "1.25rem", borderLeft: "4px solid var(--color-cyan)" }}>
            <p style={{ color: "var(--color-text-primary)", fontSize: "0.875rem" }}>
              [DEV MODE] Password Reset OTP Code: <b style={{ color: "var(--color-cyan)" }}>{devOtp}</b>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Requesting code..." : "Send Reset Code"}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: "1.5rem" }}>
          Remembered your password? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
