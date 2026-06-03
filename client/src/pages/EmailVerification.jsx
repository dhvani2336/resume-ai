import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function EmailVerification() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("Verifying your email address, please hold...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing from the link URL.");
      return;
    }
    verifyAccount();
  }, [token]);

  const verifyAccount = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed. The token may be invalid or expired.");
      }

      setStatus("success");
      setMessage(data.message || "Account verified successfully!");
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="glass-card auth-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
        
        {status === "loading" && (
          <div>
            <div className="spinner" style={{ 
              width: "48px", 
              height: "48px", 
              border: "3px solid transparent", 
              borderTopColor: "var(--color-cyan)", 
              borderRadius: "50%", 
              margin: "0 auto 1.5rem",
              animation: "spin 1s linear infinite" 
            }}></div>
            <h2 className="auth-title">Verifying Account</h2>
            <p style={{ color: "var(--color-text-secondary)", marginTop: "1rem" }}>{message}</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              borderRadius: "50%", 
              backgroundColor: "rgba(16, 185, 129, 0.15)", 
              color: "var(--color-emerald)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              margin: "0 auto 1.5rem"
            }}>
              <svg style={{ width: "32px", height: "32px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="auth-title" style={{ color: "var(--color-emerald)" }}>Success!</h2>
            <p style={{ color: "var(--color-text-secondary)", margin: "1rem 0 2rem" }}>{message}</p>
            <Link to="/login" className="btn btn-primary btn-block" style={{ display: "block" }}>
              Sign In to Your Account
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              borderRadius: "50%", 
              backgroundColor: "rgba(244, 63, 94, 0.15)", 
              color: "var(--color-rose)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              margin: "0 auto 1.5rem"
            }}>
              <svg style={{ width: "32px", height: "32px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="auth-title" style={{ color: "var(--color-rose)" }}>Verification Failed</h2>
            <p style={{ color: "var(--color-text-secondary)", margin: "1rem 0 2rem" }}>{message}</p>
            <Link to="/" className="btn btn-secondary btn-block" style={{ display: "block" }}>
              Go Back Home
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default EmailVerification;
