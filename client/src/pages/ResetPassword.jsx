import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const initialEmail = location.state?.email || "";
  
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email || !otp || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Password reset failed. Verify your code.");
      }

      setSuccessMsg(data.message || "Password has been successfully updated!");
      
      setTimeout(() => {
        navigate("/login");
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
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-desc">Provide your account details and the 6-digit OTP to create a new password.</p>

        {error && <div className="auth-error-alert">{error}</div>}
        {successMsg && (
          <div className="glass-card" style={{ padding: "0.75rem", marginBottom: "1rem", borderLeft: "4px solid var(--color-emerald)" }}>
            <p style={{ color: "var(--color-emerald)", fontSize: "0.875rem" }}>{successMsg}</p>
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

          <div className="form-group">
            <label htmlFor="otp">6-Digit OTP Code</label>
            <input
              type="text"
              id="otp"
              placeholder="123456"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Resetting password..." : "Confirm Password Reset"}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: "1.5rem" }}>
          Nevermind? <Link to="/login" className="auth-link">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
