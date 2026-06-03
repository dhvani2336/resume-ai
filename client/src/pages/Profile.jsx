import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [message, setMessage] = useState({ text: "", type: "" });
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to load profile.");
      }

      setUser(data.user);
      setName(data.user.name);
      setEmail(data.user.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!name || !email) {
      setMessage({ text: "Name and email are required.", type: "error" });
      return;
    }

    setProfileLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage({ text: data.message || "Profile updated successfully.", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ text: "Please fill all password fields.", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: "New password must be at least 6 characters.", type: "error" });
      return;
    }

    setPasswordLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ text: "Password updated successfully.", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ text: "Please upload an image file only.", type: "error" });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setAvatarLoading(true);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/auth/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload avatar image.");
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage({ text: "Profile image updated successfully.", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification email.");
      }

      setMessage({ text: "Verification link sent to your email!", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="container" style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="skeleton skeleton-text" style={{ width: "30%", height: "2.5rem" }}></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
            <div className="glass-card" style={{ height: "20rem", padding: "2rem" }}>
              <div className="skeleton skeleton-block" style={{ width: "100px", height: "100px", borderRadius: "50%", margin: "0 auto 1.5rem" }}></div>
              <div className="skeleton skeleton-text" style={{ width: "80%", margin: "0 auto 0.5rem" }}></div>
              <div className="skeleton skeleton-text" style={{ width: "50%", margin: "0 auto" }}></div>
            </div>
            <div className="glass-card" style={{ height: "25rem", padding: "2rem" }}>
              <div className="skeleton skeleton-text" style={{ width: "40%", height: "1.875rem", marginBottom: "1.5rem" }}></div>
              <div className="skeleton skeleton-block" style={{ height: "2.5rem", marginBottom: "1.25rem" }}></div>
              <div className="skeleton skeleton-block" style={{ height: "2.5rem", marginBottom: "1.25rem" }}></div>
              <div className="skeleton skeleton-btn" style={{ width: "100px", height: "2.5rem" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = user.profilePhoto
    ? `${API_BASE}${user.profilePhoto}`
    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;

  return (
    <div className="dashboard-wrapper animate-fade-in" style={{ paddingBottom: "4rem" }}>
      {/* Header */}
      <header className="dashboard-header" style={{ borderBottom: "1px solid var(--color-border)", marginBottom: "2rem" }}>
        <div className="db-brand">
          <Link to="/dashboard" className="nav-back-link" style={{ marginRight: "1rem" }}>
            ← Back
          </Link>
          <div className="db-logo-dot"></div>
          <span>My Profile</span>
        </div>
        <div>
          <button onClick={handleLogout} className="btn btn-sm btn-secondary">
            Log Out
          </button>
        </div>
      </header>

      <div className="container">
        {/* Verification Warning Alert */}
        {!user.isVerified && (
          <div className="glass-card" style={{ borderLeft: "4px solid var(--color-rose)", padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h4 style={{ color: "var(--color-rose)", fontWeight: 600, marginBottom: "0.25rem" }}>Email Account Unverified</h4>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>Please verify your email address to access workspace invitations and premium updates.</p>
            </div>
            <button onClick={handleResendVerification} className="btn btn-sm btn-primary" style={{ backgroundColor: "var(--color-rose)" }}>
              Resend Verification Link
            </button>
          </div>
        )}

        {message.text && (
          <div className="glass-card animate-toast-slide" style={{
            padding: "1rem",
            marginBottom: "2rem",
            borderLeft: `4px solid ${message.type === "success" ? "var(--color-emerald)" : "var(--color-rose)"}`,
            backgroundColor: "rgba(17, 24, 39, 0.8)"
          }}>
            <p style={{ color: message.type === "success" ? "var(--color-emerald)" : "var(--color-rose)", fontSize: "0.9375rem" }}>
              {message.text}
            </p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          {/* Main Layout Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>

            {/* LEFT COLUMN: Image & Status details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Profile Card */}
              <div className="glass-card" style={{ padding: "2.5rem 2rem", textAlign: "center", position: "relative" }}>
                <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 1.5rem", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--color-border-hover)" }}>
                  {avatarLoading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: "rgba(0,0,0,0.5)" }}>
                      <div className="spinner" style={{ width: "24px", height: "24px", border: "2px solid transparent", borderTopColor: "var(--color-cyan)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                    </div>
                  ) : (
                    <img src={avatarUrl} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>

                <label className="btn btn-sm btn-secondary" style={{ display: "inline-block", cursor: "pointer", marginBottom: "1.5rem" }}>
                  {avatarLoading ? "Uploading..." : "Upload New Photo"}
                  <input type="file" onChange={handleAvatarChange} style={{ display: "none" }} accept="image/*" disabled={avatarLoading} />
                </label>

                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>{user.name}</h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{user.email}</p>

                <hr style={{ border: 0, borderTop: "1px solid var(--color-border)", margin: "1.5rem 0" }} />

                <div style={{ display: "flex", justifyContent: "space-around" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", tracking: "0.05em", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>Role</div>
                    <span className="badge" style={{
                      backgroundColor: user.role === "admin" ? "rgba(168, 85, 247, 0.15)" : "rgba(99, 102, 241, 0.15)",
                      color: user.role === "admin" ? "var(--color-purple)" : "var(--color-indigo)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "1rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "capitalize"
                    }}>{user.role}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", tracking: "0.05em", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>Subscription</div>
                    <span className="badge" style={{
                      backgroundColor: user.subscription === "premium" ? "rgba(16, 185, 129, 0.15)" : "rgba(14, 165, 233, 0.15)",
                      color: user.subscription === "premium" ? "var(--color-emerald)" : "var(--color-cyan)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "1rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "capitalize"
                    }}>{user.subscription}</span>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Card */}
              <div className="glass-card" style={{ padding: "1.5rem" }}>
                <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Workspace Controls</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <Link to="/team-workspace" className="btn btn-secondary btn-block" style={{ textAlign: "center" }}>
                    Go to Workspace Dashboard
                  </Link>
                  {user.role === "admin" && (
                    <Link to="/admin" className="btn btn-primary btn-block" style={{ textAlign: "center", backgroundColor: "var(--color-purple)" }}>
                      Open Admin Panel
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Account settings forms */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Account Details form */}
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "1.5rem" }}>Account Details</h3>

                <form onSubmit={handleUpdateProfile}>
                  <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                      * Note: Changing your email will log you out until email verification is completed.
                    </small>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                    {profileLoading ? "Updating..." : "Save Account Changes"}
                  </button>
                </form>
              </div>

              {/* Password update form */}
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "1.5rem" }}>Security & Password</h3>

                <form onSubmit={handleChangePassword}>
                  <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                    <label>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-secondary" disabled={passwordLoading}>
                    {passwordLoading ? "Updating Password..." : "Change Password"}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
