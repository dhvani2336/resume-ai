
function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-container">
        
        {/* Logo */}
        <div className="navbar-logo-section">
          <a href="#" className="navbar-logo">
            <div className="logo-dot"></div>
            <span>ResumeAI</span>
          </a>
        </div>

        {/* Navigation Links */}
        <nav className="navbar-nav">
          <a href="#features" className="nav-link">
            Features
          </a>
          <a href="#process" className="nav-link">
            How It Works
          </a>
          <a href="#pricing" className="nav-link">
            Pricing
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="navbar-actions">
          <a href="#login" className="nav-link">
            Sign In
          </a>
          <a href="#pricing" className="btn btn-sm btn-primary">
            Get Started
          </a>
        </div>

      </div>
    </header>
  );
}

export default Navbar;
