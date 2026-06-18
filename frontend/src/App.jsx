import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Flag, Timer, Trophy, Users, Sun, Moon, Monitor, ChevronDown, Sliders } from 'lucide-react';
import RegisterRacing from './pages/RegisterRacing';
import UpdateResults from './pages/UpdateResults';
import DriverStandings from './pages/DriverStandings';
import TeamStandings from './pages/TeamStandings';
// === DATABASE INSPECTOR START ===
import DatabaseInspector from './pages/DatabaseInspector';
import { Server } from 'lucide-react';
// === DATABASE INSPECTOR END ===
import Operations from './pages/Operations';


function App() {
  const [theme, setTheme] = useState(localStorage.getItem('f1-theme') || 'default');

  // ── Season Selector ──────────────────────────────────────
  const [championships, setChampionships] = useState([]);
  const [champCode, setChampCode] = useState(
    localStorage.getItem('f1-champ') || ''
  );

  useEffect(() => {
    fetch('http://localhost:5000/api/championships')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setChampionships(data);
          // Nếu chưa chọn hoặc mùa đã chọn không còn tồn tại → chọn mùa mới nhất
          const codes = data.map(c => c.champ_code);
          if (!champCode || !codes.includes(champCode)) {
            setChampCode(data[0].champ_code);
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('f1-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('f1-champ', champCode);
  }, [champCode]);

  const currentChamp = championships.find(c => c.champ_code === champCode);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand brand-font">
          <Flag className="highlight" size={28} />
          <span>F1<span className="highlight">MGR</span></span>
        </div>

        {/* Season Selector */}
        <div className="season-selector">
          <div className="season-label">Mùa giải</div>
          <div className="season-select-wrapper">
            <select
              className="season-select"
              value={champCode}
              onChange={e => setChampCode(e.target.value)}
            >
              {championships.map(c => (
                <option key={c.champ_code} value={c.champ_code}>
                  {c.champ_code} - {c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="season-chevron" />
          </div>
          {currentChamp?.description && (
            <div className="season-desc">{currentChamp.description}</div>
          )}
        </div>

        <nav className="nav-links">
          <NavLink to="/register" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={20} /> Đăng ký thi đấu
          </NavLink>
          <NavLink to="/results" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Timer size={20} /> Nhập kết quả
          </NavLink>
          <NavLink to="/standings/driver" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Trophy size={20} /> BXH Tay đua
          </NavLink>
          <NavLink to="/standings/team" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Trophy size={20} /> BXH Đội đua
          </NavLink>
          {/* === DATABASE INSPECTOR START === */}
          <NavLink to="/database" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Server size={20} /> Giám sát CSDL
          </NavLink>
          {/* === DATABASE INSPECTOR END === */}
          <NavLink to="/operations" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Sliders size={20} /> Quản lý Nghiệp vụ
          </NavLink>
        </nav>

        {/* Theme Switcher */}
        <div className="theme-switcher">
          <div className="theme-switcher-title">Chế độ giao diện</div>
          <button className={`theme-btn ${theme === 'default' ? 'active' : ''}`} onClick={() => setTheme('default')}>
            <Monitor size={16} /> Mặc định
          </button>
          <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
            <Sun size={16} /> Sáng
          </button>
          <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
            <Moon size={16} /> Tối
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DriverStandings champCode={champCode} />} />
          <Route path="/register" element={<RegisterRacing champCode={champCode} />} />
          <Route path="/results" element={<UpdateResults champCode={champCode} />} />
          <Route path="/standings/driver" element={<DriverStandings champCode={champCode} />} />
          <Route path="/standings/team" element={<TeamStandings champCode={champCode} />} />
          {/* === DATABASE INSPECTOR START === */}
          <Route path="/database" element={<DatabaseInspector />} />
          {/* === DATABASE INSPECTOR END === */}
          <Route path="/operations" element={<Operations champCode={champCode} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
