import React, { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';

const formatTime = (seconds) => {
  if (!seconds || seconds === 0) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins > 0 ? mins + ':' : ''}${secs.toFixed(3)}`;
};

const translateStatus = (status) => {
  if (!status) return '-';
  switch (status) {
    case 'Finished': return 'Hoàn thành';
    case 'DNF': return 'Không hoàn thành (DNF)';
    case 'Accident': return 'Tai nạn (Accident)';
    default: return status;
  }
};

export default function DriverStandings({ champCode }) {
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState('');

  const [standings, setStandings] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverDetails, setDriverDetails] = useState([]);

  // Load stages khi đổi mùa giải
  useEffect(() => {
    const url = champCode
      ? `http://localhost:5000/api/races?champ_code=${champCode}`
      : 'http://localhost:5000/api/races';

    fetch(url).then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setStages(data);
        // Mặc định chọn chặng mới nhất đã qua
        if (data.length > 0) setSelectedStage(data[data.length - 1].race_code);
        else setSelectedStage('');
      }
    }).catch(console.error);

    setSelectedDriver(null);
    setStandings([]);
  }, [champCode]);

  // Load standings khi đổi chặng hoặc đổi mùa
  useEffect(() => {
    if (!champCode) return;

    let url;
    if (selectedStage) {
      url = `http://localhost:5000/api/standings/drivers?stage=${selectedStage}`;
    } else {
      url = `http://localhost:5000/api/standings/drivers?champ_code=${champCode}`;
    }

    fetch(url)
      .then(r => r.json())
      .then(data => setStandings(Array.isArray(data) ? data : []))
      .catch(console.error);

    setSelectedDriver(null);
  }, [selectedStage, champCode]);

  const handleRowClick = (driverCode) => {
    if (selectedDriver === driverCode) {
      setSelectedDriver(null);
      return;
    }
    setSelectedDriver(driverCode);
    const url = champCode
      ? `http://localhost:5000/api/drivers/${driverCode}/results?champ_code=${champCode}`
      : `http://localhost:5000/api/drivers/${driverCode}/results`;
    fetch(url).then(r => r.json()).then(data => setDriverDetails(data));
  };

  return (
    <div className="page-container fadeIn">
      <div className="page-header">
        <h1 className="page-title">Bảng xếp hạng Tay đua</h1>
        <p className="page-subtitle">Bảng xếp hạng tay đua toàn giải đấu dựa trên tổng điểm tích lũy.</p>
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
                <th>Tay đua</th>
                <th>Quốc tịch</th>
                <th>Đội đua</th>
                <th>Tổng điểm</th>
                <th>Tổng thời gian (s)</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, index) => (
                <React.Fragment key={s.driver_code}>
                  <tr onClick={() => handleRowClick(s.driver_code)} style={{ background: selectedDriver === s.driver_code ? 'rgba(255,255,255,0.05)' : '' }}>
                    <td>
                      <span className={`rank-badge ${index < 3 ? 'rank-' + (index + 1) : ''}`}>
                        {index === 0 ? <Crown size={20} color="#000" fill="#000" /> : index + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '1.1rem' }}>{s.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.nationality}</td>
                    <td>{s.team_name}</td>
                    <td><span className="score-badge">{s.total_score} PTS</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{formatTime(s.total_time)}</td>
                  </tr>

                  {selectedDriver === s.driver_code && (
                    <tr>
                      <td colSpan="6" style={{ padding: 0 }}>
                        <div className="details-panel">
                          <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Lịch sử thi đấu của {s.name}</h4>
                          <table className="data-table" style={{ background: 'transparent' }}>
                            <thead>
                              <tr>
                                <th>Chặng đua</th>
                                <th>Vị trí</th>
                                <th>Trạng thái</th>
                                <th>Điểm</th>
                                <th>Thời gian</th>
                              </tr>
                            </thead>
                            <tbody>
                              {driverDetails.length === 0 && <tr><td colSpan="5">Chưa có dữ liệu thi đấu</td></tr>}
                              {driverDetails.map((d, i) => (
                                <tr key={i} style={{ cursor: 'default' }}>
                                  <td style={{ fontWeight: 500 }}>{d.stage_name}</td>
                                  <td>{d.finish_rank || '-'}</td>
                                  <td className={`status-${d.status.toLowerCase()}`}>{translateStatus(d.status)}</td>
                                  <td style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{d.score}</td>
                                  <td style={{ fontFamily: 'monospace' }}>{formatTime(d.time_to_finish)}</td>
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
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
