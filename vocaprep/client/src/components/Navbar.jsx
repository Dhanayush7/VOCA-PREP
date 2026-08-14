import React, { useState } from "react";

export default function Navbar({ view, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItem = (id, label) => (
    <button
      className={`nav-link ${view === id ? "nav-link--active" : ""}`}
      onClick={() => {
        onNavigate(id);
        setMenuOpen(false);
      }}
    >
      {label}
    </button>
  );

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <button className="navbar__brand" onClick={() => onNavigate("dashboard")} aria-label="VocaPrep home">
          <span className="navbar__mark">V</span>
          <span className="navbar__brand-text">VOCA PREP</span>
        </button>

        <nav className="navbar__links navbar__links--desktop" aria-label="Primary">
          {navItem("practice", "Practice")}
          {navItem("interview", "Mock Interview")}
          {navItem("history", "History")}
        </nav>

        <div className="navbar__right navbar__right--desktop">
          <span className="navbar__badge">✨ AI Communication Coach</span>
        </div>

        <button
          className="navbar__menu-btn"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <div className="navbar__mobile-panel">
          {navItem("practice", "Practice")}
          {navItem("interview", "Mock Interview")}
          {navItem("history", "History")}
          <span className="navbar__badge navbar__badge--mobile">✨ AI Communication Coach</span>
        </div>
      )}
    </header>
  );
}