import React, { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import ModeSelector from "./components/ModeSelector.jsx";
import PracticeMode from "./components/PracticeMode.jsx";
import InterviewMode from "./components/InterviewMode.jsx";
import HistoryMode from "./components/HistoryMode.jsx";

export default function App() {
  const [view, setView] = useState("dashboard"); // dashboard | practice | interview | history

  return (
    <div className="app-shell">
      <Navbar view={view} onNavigate={setView} />

      <main className="app-main">
        {view === "dashboard" && <ModeSelector onSelect={setView} />}
        {view === "practice" && <PracticeMode />}
        {view === "interview" && <InterviewMode onNavigateToPractice={() => setView("practice")} />}
        {view === "history" && <HistoryMode />}
      </main>

      <footer className="app-footer">
        <span>VocaPrep — AI Communication Coach</span>
      </footer>
    </div>
  );
}