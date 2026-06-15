import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function UpdateResults({ champCode }) {
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState('');
  const [stageInfo, setStageInfo] = useState(null);

  const [entries, setEntries] = useState([]);
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const url = champCode
      ? `http://localhost:5000/api/races?champ_code=${champCode}`
      : 'http://localhost:5000/api/races';
    fetch(url).then(r => r.json()).then(data => {
      setStages(Array.isArray(data) ? data : []);
      setSelectedStage('');
    });
  }, [champCode]);

  useEffect(() => {
    if (selectedStage) {
      const stage = stages.find(s => s.race_code === selectedStage);
      setStageInfo(stage || null);

      fetch(`http://localhost:5000/api/races/${selectedStage}/entries`)
        .then(r => r.json())
        .then(data => {
          setEntries(data);
          const initResults = {};
          data.forEach(e => {
            initResults[e.entry_id] = { 
                end_time: e.end_time ? new Date(new Date(e.end_time).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 19) : '', 
                laps_completed: e.laps_completed !== null ? e.laps_completed : '', 
                status: e.status || 'Finished',
                is_locked: e.is_locked === 1 
            };
          });
          setResults(initResults);
          setErrors({});
          setMessage(null);
        });
    } else {
      setEntries([]);
      setResults({});
      setErrors({});
      setStageInfo(null);
    }
  }, [selectedStage, stages]);

  const handleChange = (entryId, field, value) => {
    setResults(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value,
        // Reset end_time when switching away from Finished
        ...(field === 'status' && value !== 'Finished' ? { end_time: '' } : {})
      }
    }));
    // Clear error for this row when user edits
    setErrors(prev => ({ ...prev, [entryId]: null }));
  };

  // Validate all rows, return true if OK
  const validate = () => {
    const newErrors = {};
    let valid = true;

    entries.forEach(e => {
      const r = results[e.entry_id];
      if (!r) return;

      const lapsVal = parseInt(r.laps_completed);
      if (r.laps_completed === '' || r.laps_completed === null || isNaN(lapsVal) || lapsVal < 0) {
        newErrors[e.entry_id] = 'Số vòng đua phải được nhập và không âm.';
        valid = false;
        return;
      }

      // Validate: nếu status = 'Finished' thì laps_completed phải = num_laps
      if (r.status === 'Finished') {
        if (stageInfo?.num_laps && lapsVal !== stageInfo.num_laps) {
          newErrors[e.entry_id] = `Tay đua có trạng thái "Hoàn thành" phải chạy đủ ${stageInfo.num_laps} vòng (hiện tại: ${lapsVal}). Nếu không chạy đủ vòng, hãy đổi trạng thái thành DNF hoặc Accident.`;
          valid = false;
          return;
        }
        if (!r.end_time) {
          newErrors[e.entry_id] = 'Thời gian kết thúc là bắt buộc khi trạng thái là Hoàn thành (Finished).';
          valid = false;
          return;
        }
        // Validate end_time > start_time (frontend pre-check)
        if (stageInfo?.start_time) {
          const startMs = new Date(stageInfo.start_time).getTime();
          const endMs = new Date(r.end_time).getTime();
          if (endMs <= startMs) {
            newErrors[e.entry_id] = `Thời gian kết thúc phải sau ${stageInfo.start_time.replace('T', ' ').substring(0, 19)}.`;
            valid = false;
            return;
          }
        }
      }

      // Validate: num_laps không được vượt quá tổng số vòng
      if (stageInfo?.num_laps && lapsVal > stageInfo.num_laps) {
        newErrors[e.entry_id] = `Số vòng hoàn thành (${lapsVal}) không được vượt quá tổng số vòng của chặng (${stageInfo.num_laps}).`;
        valid = false;
      }
    });

    setErrors(newErrors);
    return valid;
  };

  const handleSave = async () => {
    if (!validate()) {
      setMessage({ type: 'error', text: 'Vui lòng kiểm tra lại dữ liệu nhập. Có một số ô chưa hợp lệ!' });
      return;
    }

    setLoading(true);
    const payload = Object.keys(results)
      .filter(id => !results[id].is_locked)
      .map(id => ({
        entry_id: parseInt(id),
        ...results[id],
        end_time: results[id].status === 'Finished'
          ? (results[id].end_time ? results[id].end_time.replace('T', ' ') : null)
          : null
      }));

    try {
      const res = await fetch(`http://localhost:5000/api/races/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: payload })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Đã lưu kết quả & tính điểm bảng xếp hạng thành công!\n• Đã cập nhật dữ liệu vào bảng: RESULTS (Kết quả chặng đua)' });
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: data.error || 'Lỗi khi lưu kết quả' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi mạng — Không thể kết nối tới backend.' });
    }
    setLoading(false);
  };

  const handleClearResult = async (entryId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kết quả thi đấu của tay đua này không?')) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/results/${entryId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Xóa kết quả thi đấu thành công!' });
        setResults(prev => ({
          ...prev,
          [entryId]: { end_time: '', laps_completed: '', status: 'Finished' }
        }));
        setErrors(prev => ({ ...prev, [entryId]: null }));
      } else {
        setMessage({ type: 'error', text: 'Lỗi khi xóa kết quả' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối mạng' });
    }
    setLoading(false);
  };

  // Completion summary
  const filledCount = entries.filter(e => {
    const r = results[e.entry_id];
    if (!r) return false;
    const hasLaps = r.laps_completed !== '' && r.laps_completed !== null && r.laps_completed !== undefined;
    if (r.status !== 'Finished') return hasLaps;
    return !!r.end_time && hasLaps;
  }).length;
  const allFilled = filledCount === entries.length && entries.length > 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Nhập kết quả thi đấu</h1>
        <p className="page-subtitle">Nhập thời gian về đích và số vòng chạy hoàn thành cho các tay đua.</p>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className="form-group" style={{ margin: 0, maxWidth: '400px' }}>
          <label className="form-label">Chọn chặng đua</label>
          <select className="form-control" value={selectedStage} onChange={e => setSelectedStage(e.target.value)}>
            <option value="">-- Xem tay đua đã đăng ký --</option>
            {stages.map(s => <option key={s.race_code} value={s.race_code}>{s.race_code} - {s.name}</option>)}
          </select>
        </div>
        {stageInfo && (
          <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              🏁 Thời gian xuất phát: <strong style={{ color: 'var(--text-main)' }}>
                {new Date(stageInfo.start_time).toLocaleString()}
              </strong>
              &nbsp;— Thời gian về đích phải <strong style={{ color: 'var(--primary-color)' }}>sau</strong> mốc này.
            </p>
            <span style={{
              background: 'rgba(225,6,0,0.15)', border: '1px solid rgba(225,6,0,0.4)',
              borderRadius: '20px', padding: '0.2rem 0.8rem',
              color: 'var(--primary-color)', fontWeight: 700, fontSize: '0.9rem'
            }}>
              🔄 Tổng số vòng: {stageInfo.num_laps} vòng
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              ⚠️ Tay đua "Hoàn thành" phải chạy đủ <strong style={{ color: 'var(--text-main)' }}>{stageInfo.num_laps}</strong> vòng.
            </span>
          </div>
        )}
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} style={{ whiteSpace: 'pre-line' }}>{message.text}</div>
      )}

      {selectedStage && entries.length > 0 && (
        <div className="glass-panel">
          {/* Progress bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tiến độ nhập kết quả
              </span>
              <span style={{
                fontWeight: 700,
                color: allFilled ? 'var(--success)' : 'var(--primary-color)',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                {allFilled
                  ? <><CheckCircle size={16} /> Đã điền đầy đủ kết quả</>
                  : <><AlertCircle size={16} /> Đã điền {filledCount} / {entries.length} tay đua</>
                }
              </span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: '3px',
                width: `${entries.length ? (filledCount / entries.length) * 100 : 0}%`,
                background: allFilled ? 'var(--success)' : 'var(--primary-gradient, var(--primary-color))',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tay đua</th>
                  <th>Đội đua</th>
                  <th>Trạng thái</th>
                  <th>Thời gian về đích</th>
                  <th>Số vòng hoàn thành</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => {
                  const r = results[e.entry_id] || {};
                  const rowError = errors[e.entry_id];
                  return (
                    <React.Fragment key={e.entry_id}>
                      <tr style={{ borderLeft: rowError ? '3px solid var(--primary-color)' : '3px solid transparent' }}>
                        <td style={{ fontWeight: 600 }}>{e.driver_name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{e.team_name}</td>
                        <td>
                          <select
                            className="form-control" style={{ padding: '0.5rem' }}
                            value={r.status || 'Finished'}
                            onChange={ev => handleChange(e.entry_id, 'status', ev.target.value)}
                            disabled={r.is_locked}
                          >
                            <option value="Finished">✅ Hoàn thành</option>
                            <option value="DNF">🚫 Không hoàn thành (DNF)</option>
                            <option value="Accident">💥 Tai nạn (Accident)</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="datetime-local" step="0.001"
                            className="form-control"
                            style={{
                                padding: '0.5rem',
                                borderColor: rowError && r.status === 'Finished' && !r.end_time ? 'var(--primary-color)' : undefined
                            }}
                            value={r.end_time || ''}
                            onChange={ev => handleChange(e.entry_id, 'end_time', ev.target.value)}
                            disabled={r.is_locked || r.status !== 'Finished'}
                            min={stageInfo?.start_time}
                          />
                        </td>
                        <td>
                          <input
                            type="number" min="0"
                            max={stageInfo?.num_laps ?? undefined}
                            className="form-control"
                            style={{
                              padding: '0.5rem', width: '100px',
                              borderColor: rowError && (!r.laps_completed || (r.status === 'Finished' && parseInt(r.laps_completed) !== stageInfo?.num_laps)) ? 'var(--primary-color)' : undefined
                            }}
                            value={r.laps_completed || ''}
                            onChange={ev => handleChange(e.entry_id, 'laps_completed', ev.target.value)}
                            placeholder={stageInfo?.num_laps ? `0 – ${stageInfo.num_laps}` : '0'}
                            disabled={r.is_locked}
                          />
                          {stageInfo?.num_laps && r.status === 'Finished' && r.laps_completed !== '' && parseInt(r.laps_completed) !== stageInfo.num_laps && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--primary-color)', marginTop: '2px', lineHeight: 1.3 }}>
                              Cần {stageInfo.num_laps} vòng
                            </div>
                          )}
                        </td>
                        <td>
                          {r.is_locked ? (
                             <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Đã khóa</span>
                          ) : (
                          <button
                            className="btn"
                            style={{ padding: '0.5rem 1rem', background: 'rgba(225, 6, 0, 0.2)', color: 'var(--primary-color)', borderRadius: '20px' }}
                            onClick={() => handleClearResult(e.entry_id)}
                            disabled={loading}
                          >
                            Xóa
                          </button>
                          )}
                        </td>
                      </tr>
                      {rowError && (
                        <tr>
                          <td colSpan="6" style={{ padding: '0.25rem 1rem 0.75rem', paddingTop: 0 }}>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '0.5rem',
                              color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600
                            }}>
                              <AlertCircle size={14} /> {rowError}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
              title={!allFilled ? 'Vui lòng điền tất cả các trường dữ liệu trước' : ''}
            >
              <Save size={18} /> {loading ? 'Đang lưu...' : 'Lưu tất cả kết quả'}
            </button>
          </div>
        </div>
      )}

      {selectedStage && entries.length === 0 && (
        <div className="glass-panel" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Chưa có tay đua nào đăng ký thi đấu chặng này. Vui lòng đăng ký tay đua trước.
        </div>
      )}
    </div>
  );
}
