import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

export default function RegisterRacing({ champCode }) {
  const [stages, setStages] = useState([]);
  const [teams, setTeams] = useState([]);
  
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  
  const [racers, setRacers] = useState([]);
  const [selectedRacers, setSelectedRacers] = useState([]);
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const url = champCode
      ? `http://localhost:5000/api/races?champ_code=${champCode}`
      : 'http://localhost:5000/api/races';
    fetch(url).then(r => r.json()).then(data => {
      setStages(Array.isArray(data) ? data : []);
      setSelectedStage('');
    });
    fetch('http://localhost:5000/api/teams').then(r => r.json()).then(setTeams);
  }, [champCode]);

  useEffect(() => {
    if (selectedTeam) {
      fetch(`http://localhost:5000/api/teams/${selectedTeam}/drivers`)
        .then(r => r.json())
        .then(data => {
            setRacers(data);
        });
    } else {
      setRacers([]);
    }
  }, [selectedTeam]);

  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (selectedStage && selectedTeam) {
      fetch(`http://localhost:5000/api/races/${selectedStage}/teams/${selectedTeam}/entries`)
        .then(r => r.json())
        .then(data => {
            if (Array.isArray(data)) {
                setSelectedRacers(data);
                setIsLocked(false);
            } else {
                setSelectedRacers(data.contract_ids || []);
                setIsLocked(data.locked || false);
            }
        });
    } else {
      setSelectedRacers([]);
      setIsLocked(false);
    }
  }, [selectedStage, selectedTeam]);

  const handleCheckboxChange = (contract_id) => {
    setSelectedRacers(prev => {
      if (prev.includes(contract_id)) {
        return prev.filter(id => id !== contract_id);
      } else {
        if (prev.length >= 2) return prev; // Max 2
        return [...prev, contract_id];
      }
    });
  };

  const handleSave = async () => {
    if (!selectedStage || !selectedTeam || selectedRacers.length === 0) {
      setMessage({ text: 'Vui lòng chọn chặng đua, đội đua và ít nhất 1 tay đua.', type: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/races/${selectedStage}/teams/${selectedTeam}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_ids: selectedRacers })
      });
      const data = await res.json();
      
      if (res.ok) {
        const stageObj = stages.find(s => s.race_code === selectedStage);
        const teamObj = teams.find(t => t.team_code === selectedTeam);
        const selectedRacerNames = selectedRacers.map(cid => {
          const r = racers.find(driver => driver.contract_id === cid);
          return r ? `${r.name} (Hợp đồng #${cid})` : `Hợp đồng #${cid}`;
        });
        
        const detailsText = `✅ Đồng bộ đăng ký thành công!\n• Chặng đua: ${stageObj ? `${stageObj.race_code} - ${stageObj.name}` : selectedStage}\n• Đội đua: ${teamObj ? `${teamObj.team_code} - ${teamObj.name}` : selectedTeam}\n• Tay đua đăng ký: ${selectedRacerNames.join(', ')}\n• Đã lưu dữ liệu vào bảng: RACE_ENTRIES (Đăng ký chặng đua)`;
        
        setMessage({ text: detailsText, type: 'success' });
      } else {
        setMessage({ text: data.error || 'Lỗi server', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Lỗi kết nối tới máy chủ backend.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="page-container fadeIn">
      <div className="page-header">
        <h1 className="page-title">Đăng ký tay đua vào chặng</h1>
        <p className="page-subtitle">Chọn tối đa 2 tay đua chính thức thi đấu cho chặng đua tiếp theo.</p>
      </div>

      <div className="glass-panel">
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Chặng đua</label>
            <select className="form-control" value={selectedStage} onChange={e => setSelectedStage(e.target.value)}>
              <option value="">-- Chọn chặng đua --</option>
              {stages.map(s => <option key={s.race_code} value={s.race_code}>{s.race_code} - {s.name} ({s.location})</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Đội đua</label>
            <select className="form-control" value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
              <option value="">-- Chọn đội đua --</option>
              {teams.map(t => <option key={t.team_code} value={t.team_code}>{t.team_code} - {t.name}</option>)}
            </select>
          </div>
        </div>

        {racers.length > 0 && selectedStage && (
          <div className="form-group" style={{ marginTop: '2rem' }}>
            <label className="form-label">Chọn tay đua (Tối đa 2 người)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              {racers.map(r => (
                <label key={r.contract_id} className="checkbox-container" style={isLocked ? {opacity: 0.6, cursor: 'not-allowed'} : {}}>
                  {r.name} ({r.nationality})
                  <input 
                    type="checkbox" 
                    checked={selectedRacers.includes(r.contract_id)} 
                    onChange={() => handleCheckboxChange(r.contract_id)}
                    disabled={isLocked || (!selectedRacers.includes(r.contract_id) && selectedRacers.length >= 2)}
                  />
                  <span className="checkmark"></span>
                </label>
              ))}
            </div>
            
            {isLocked && (
              <p style={{ color: 'var(--primary-color)', fontSize: '0.9rem', marginTop: '1rem', fontWeight: 600 }}>
                ⚠️ Kết quả thi đấu của đội này đã được ghi nhận. Bạn không thể thay đổi danh sách tay đua nữa.
              </p>
            )}

            <div style={{ marginTop: '2.5rem', textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading || isLocked}>
                <Save size={18} /> {loading ? 'Đang lưu...' : 'Đồng bộ Đăng ký'}
              </button>
            </div>
          </div>
        )}
      </div>

      {message.text && (
        <div 
          className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} 
          style={{ whiteSpace: 'pre-line', marginTop: '1.5rem' }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
