import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import AlbumsPage from "./pages/AlbumsPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import LoginPage from "./pages/LoginPage";
import OtpVerifyPage from "./pages/OtpVerifyPage";
import "./App.css";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("pendingEmail");
    navigate("/login");
  }

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Top rated", path: "/", hash: "#top" },
    { label: "New releases", path: "/", hash: "#new" },
    { label: "Reviews", path: "/", hash: "#reviews" } 
  ];

  const isActive = (item) => {
    if (item.path !== "/") return location.pathname === item.path;
    return location.pathname === "/" && (!item.hash || location.hash === item.hash);
  };

  function handleNavClick(e, item) {
    if (item.hash) {
      e.preventDefault();
      navigate(item.path + item.hash);
      const el = document.querySelector(item.hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <header className="rzt-header">
      <div className="rzt-header-inner">
        <div className="rzt-logo" onClick={() => navigate("/")}>
          <span className="rzt-logo-badge">SS</span>
          <div className="rzt-logo-text">
            <div className="rzt-logo-title">SoundScope</div>
            <div className="rzt-logo-subtitle">Community-driven album ratings</div>
          </div>
        </div>

        <nav className="rzt-nav">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.path + (item.hash || "")}
              onClick={(e) => handleNavClick(e, item)}
              className={`rzt-nav-link ${isActive(item) ? "rzt-nav-link-active" : ""}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="rzt-header-right">
          {role && (
            <span className="rzt-role-pill">
              Role: <strong>{role}</strong>
            </span>
          )}
          {!token ? (
            <button className="rzt-login-btn" onClick={() => navigate("/login")}>
              Log in
            </button>
          ) : (
            <button className="rzt-login-btn rzt-logout-btn" onClick={handleLogout}>
              Log out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="rzt-app">
      <Header />
      <main className="rzt-main">
        <Routes>
          <Route path="/" element={<AlbumsPage />} />
          <Route path="/albums/:id" element={<AlbumDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-otp" element={<OtpVerifyPage />} />
        </Routes>
      </main>
      <footer className="rzt-footer">
        <div className="rzt-footer-inner">
          <span>SoundScope © 2025</span>
          <span>Course project – Modern Web Technologies</span>
        </div>
      </footer>
    </div>
  );
}