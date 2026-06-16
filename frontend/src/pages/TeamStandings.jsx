import React, { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';

const formatTime = (seconds) => {
  if (!seconds || seconds === 0) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins > 0 ? mins + ':' : ''}${secs.toFixed(3)}`;
};

export default function TeamStandings({ champCode }) {
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState('');

  const [standings, setStandings] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamDetails, setTeamDetails] = useState([]);

  // Load stages khi đổi mùa giải
  useEffect(() => {
    const url = champCode
      ? `http://localhost:5000/api/races?champ_code=${champCode}`
      : 'http://localhost:5000/api/races';

    fetch(url).then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setStages(data);
        if (data.length > 0) setSelectedStage(data[data.length - 1].race_code);
        else setSelectedStage('');
      }
    }).catch(console.error);

    setSelectedTeam(null);
    setStandings([]);
  }, [champCode]);

  // Load standings khi đổi chặng hoặc mùa
  useEffect(() => {
    if (!champCode) return;

    let url;
    if (selectedStage) {
      url = `http://localhost:5000/api/standings/teams?stage=${selectedStage}`;
    } else {
      url = `http://localhost:5000/api/standings/teams?champ_code=${champCode}`;
    }

    fetch(url)
      .then(r => r.json())
      .then(data => setStandings(Array.isArray(data) ? data : []))
      .catch(console.error);

    setSelectedTeam(null);
  }, [selectedStage, champCode]);

  const handleRowClick = (teamCode) => {
    if (selectedTeam === teamCode) {
      setSelectedTeam(null);
      return;
    }
    setSelectedTeam(teamCode);
    const url = champCode
      ? `http://localhost:5000/api/teams/${teamCode}/results?champ_code=${champCode}`
      : `http://localhost:5000/api/teams/${teamCode}/results`;
    fetch(url).then(r => r.json()).then(data => setTeamDetails(data));
  };

  return (
    <div className="page-container fadeIn">
      <div className="page-header">
        <h1 className="page-title">Bảng xếp hạng Đội đua</h1>
        <p className="page-subtitle">Tổng điểm tích lũy của các đội đua dựa trên thành tích của các tay đua thuộc đội.</p>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className="form-group" style={{ margin: 0, maxWidth: '400px' }}>
          <label className="form-label">Tính điểm xếp hạng đến hết chặng</label>
          <select className="form-control" value={selectedStage} onChange={e => setSelectedStage(e.target.value)}>
            <option value="">-- Cả mùa giải --</option>
            {stages.map(s => <option key={s.race_code} value={s.race_code}>{s.race_code} - {s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Hạng</th>
                <th>Tên Đội</th>
                <th>Hãng xe</th>
                <th>Tổng điểm</th>
                <th>Tổng thời gian (s)</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, index) => (
                <React.Fragment key={s.team_code}>
                  <tr onClick={() => handleRowClick(s.team_code)} style={{ background: selectedTeam === s.team_code ? 'rgba(255,255,255,0.05)' : '' }}>
                    <td>
                      <span className={`rank-badge ${index < 3 ? 'rank-' + (index + 1) : ''}`}>
                        {index === 0 ? <Crown size={20} color="#000" fill="#000" /> : index + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-main)' }}>{s.team_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.brand}</td>
                    <td><span className="score-badge" style={{ fontSize: '1.1rem' }}>{s.total_score} PTS</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{formatTime(s.total_time)}</td>
                  </tr>

                  {selectedTeam === s.team_code && (
                    <tr>
                      <td colSpan="5" style={{ padding: 0 }}>
                        <div className="details-panel" style={{ borderColor: 'var(--accent-color)' }}>
                          <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Điểm số tích lũy theo từng chặng</h4>
                          <table className="data-table" style={{ background: 'transparent' }}>
                            <thead>
                              <tr>
                                <th>Chặng đua</th>
                                <th>Điểm số đạt được</th>
                                <th>Tổng thời gian chạy</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teamDetails.length === 0 && <tr><td colSpan="3">Chưa có dữ liệu thi đấu</td></tr>}
                              {teamDetails.map((d, i) => (
                                <tr key={i} style={{ cursor: 'default' }}>
                                  <td style={{ fontWeight: 500 }}>{d.stage_name}</td>
                                  <td style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>+{d.total_score}</td>
                                  <td style={{ fontFamily: 'monospace' }}>{formatTime(d.total_time)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {standings.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
