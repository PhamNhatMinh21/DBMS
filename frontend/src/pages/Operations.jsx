import React, { useState, useEffect } from 'react';
import { Users, Award, ShieldAlert, BadgeDollarSign, Calendar, PlusCircle, ArrowLeftRight, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

function TablePagination({ currentPage, totalItems, onPageChange }) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', padding: '0 0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        Hiển thị {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} trong {totalItems} bản ghi
      </span>
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <button
          type="button"
          className="btn"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', display: 'inline-flex', alignItems: 'center', minWidth: 'auto', gap: '2px' }}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={14} /> Trước
        </button>
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 0.75rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Trang <strong style={{ color: 'var(--text-main)', margin: '0 4px' }}>{currentPage}</strong> / {totalPages}
        </span>
        <button
          type="button"
          className="btn"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', display: 'inline-flex', alignItems: 'center', minWidth: 'auto', gap: '2px' }}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Sau <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function Operations({ champCode }) {
  const [activeTab, setActiveTab] = useState('drivers');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Master & Shared Lists ---
  const [drivers, setDrivers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [championships, setChampionships] = useState([]);
  const [raceEntries, setRaceEntries] = useState([]);

  // --- Views state ---
  const [activeContracts, setActiveContracts] = useState([]);
  const [driverCareerSummary, setDriverCareerSummary] = useState([]);
  const [racePenalties, setRacePenalties] = useState([]);
  const [driverPenaltiesSummary, setDriverPenaltiesSummary] = useState([]);
  const [teamSponsors, setTeamSponsors] = useState([]);
  const [championshipSummary, setChampionshipSummary] = useState([]);
  const [raceSchedule, setRaceSchedule] = useState([]);

  // --- Pagination states ---
  const [activeContractsPage, setActiveContractsPage] = useState(1);
  const [driverCareerPage, setDriverCareerPage] = useState(1);
  const [racePenaltiesPage, setRacePenaltiesPage] = useState(1);
  const [driverPenaltiesPage, setDriverPenaltiesPage] = useState(1);
  const [teamSponsorsPage, setTeamSponsorsPage] = useState(1);
  const [championshipSummaryPage, setChampionshipSummaryPage] = useState(1);
  const [raceSchedulePage, setRaceSchedulePage] = useState(1);

  // --- Form states ---
  // Driver Form
  const [newDriver, setNewDriver] = useState({
    driver_code: '',
    name: '',
    date_of_birth: '',
    nationality: '',
    biography: ''
  });

  // Transfer Form
  const [transfer, setTransfer] = useState({
    driver_code: '',
    team_code: ''
  });

  // Contract Form
  const [newContract, setNewContract] = useState({
    driver_code: '',
    team_code: '',
    is_active: 1
  });

  // Performance View State
  const [selectedDriverPerf, setSelectedDriverPerf] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState(null);

  // Penalty Form
  const [newPenalty, setNewPenalty] = useState({
    entry_id: '',
    type: '',
    severity_value: '',
    reason: ''
  });

  // Sponsor Form
  const [newSponsor, setNewSponsor] = useState({
    sponsor_code: '',
    name: '',
    industry: '',
    description: ''
  });

  // Team Sponsorship Form
  const [newSponsorship, setNewSponsorship] = useState({
    team_code: '',
    sponsor_code: '',
    funding_amount: '',
    start_year: '',
    end_year: ''
  });

  // Race Form
  const [newRace, setNewRace] = useState({
    race_code: '',
    name: '',
    num_laps: '',
    location: '',
    start_time: '',
    champ_code: champCode || '',
    description: ''
  });

  // --- Data Fetching ---
  const fetchAllData = () => {
    setLoading(true);
    // Fetch master lists
    fetch('http://localhost:5000/api/drivers').then(r => r.json()).then(data => setDrivers(Array.isArray(data) ? data : [])).catch(console.error);
    fetch('http://localhost:5000/api/teams').then(r => r.json()).then(data => setTeams(Array.isArray(data) ? data : [])).catch(console.error);
    fetch('http://localhost:5000/api/sponsors').then(r => r.json()).then(data => setSponsors(Array.isArray(data) ? data : [])).catch(console.error);
    fetch('http://localhost:5000/api/championships').then(r => r.json()).then(data => setChampionships(Array.isArray(data) ? data : [])).catch(console.error);
    fetch('http://localhost:5000/api/race-entries-all').then(r => r.json()).then(data => setRaceEntries(Array.isArray(data) ? data : [])).catch(console.error);

    // Fetch view statistics
    fetch('http://localhost:5000/api/contracts/active').then(r => r.json()).then(data => setActiveContracts(Array.isArray(data) ? data : [])).catch(console.error);
    fetch('http://localhost:5000/api/standings/drivers/career-summary').then(r => r.json()).then(data => setDriverCareerSummary(Array.isArray(data) ? data : [])).catch(console.error);
    fetch('http://localhost:5000/api/penalties/list').then(r => r.json()).then(data => setRacePenalties(Array.isArray(data) ? data : [])).catch(console.error);
    fetch('http://localhost:5000/api/penalties/summary').then(r => r.json()).then(data => setDriverPenaltiesSummary(Array.isArray(data) ? data : [])).catch(console.error);
    fetch('http://localhost:5000/api/sponsors/teams').then(r => r.json()).then(data => setTeamSponsors(Array.isArray(data) ? data : [])).catch(console.error);
    fetch('http://localhost:5000/api/championships/summary').then(r => r.json()).then(data => setChampionshipSummary(Array.isArray(data) ? data : [])).catch(console.error);
    fetch('http://localhost:5000/api/races/schedule').then(r => r.json()).then(data => setRaceSchedule(Array.isArray(data) ? data : [])).catch(console.error);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (champCode) {
      setNewRace(prev => ({ ...prev, champ_code: champCode }));
    }
  }, [champCode]);

  // Fetch driver performance when requested
  useEffect(() => {
    if (selectedDriverPerf) {
      fetch(`http://localhost:5000/api/drivers/${selectedDriverPerf}/performance`)
        .then(r => r.json())
        .then(data => setDriverPerformance(data))
        .catch(console.error);
    } else {
      setDriverPerformance(null);
    }
  }, [selectedDriverPerf]);

  // Reset pagination when active tab changes
  useEffect(() => {
    setActiveContractsPage(1);
    setDriverCareerPage(1);
    setRacePenaltiesPage(1);
    setDriverPenaltiesPage(1);
    setTeamSponsorsPage(1);
    setChampionshipSummaryPage(1);
    setRaceSchedulePage(1);
  }, [activeTab]);

  // --- API Submit Handlers ---
  const handleAddDriver = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await fetch('http://localhost:5000/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDriver)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `✅ Thêm tay đua thành công!\n• Tên: ${newDriver.name}\n• Mã: ${newDriver.driver_code}\n• Gọi sp_add_driver() thành công.` });
        setNewDriver({ driver_code: '', name: '', date_of_birth: '', nationality: '', biography: '' });
        fetchAllData();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối tới máy chủ backend.' });
    }
  };

  const handleTransferDriver = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!transfer.driver_code || !transfer.team_code) {
      setMessage({ type: 'error', text: 'Vui lòng chọn tay đua và đội muốn chuyển nhượng.' });
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/contracts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transfer)
      });
      const data = await res.json();
      if (res.ok) {
        const dObj = drivers.find(d => d.driver_code === transfer.driver_code);
        const tObj = teams.find(t => t.team_code === transfer.team_code);
        setMessage({ type: 'success', text: `✅ Chuyển nhượng tay đua thành công!\n• Tay đua: ${dObj ? dObj.name : transfer.driver_code}\n• Đội đua mới: ${tObj ? tObj.name : transfer.team_code}\n• Đã gọi sp_transfer_driver().` });
        setTransfer({ driver_code: '', team_code: '' });
        fetchAllData();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối tới máy chủ.' });
    }
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!newContract.driver_code || !newContract.team_code) {
      setMessage({ type: 'error', text: 'Vui lòng chọn tay đua và đội đua.' });
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContract)
      });
      const data = await res.json();
      if (res.ok) {
        const dObj = drivers.find(d => d.driver_code === newContract.driver_code);
        const tObj = teams.find(t => t.team_code === newContract.team_code);
        setMessage({ 
          type: 'success', 
          text: `✅ Tạo hợp đồng mới thành công!\n• Tay đua: ${dObj ? dObj.name : newContract.driver_code}\n• Đội đua: ${tObj ? tObj.name : newContract.team_code}\n• Kích hoạt: ${newContract.is_active === 1 ? 'Có' : 'Không'}\n• Gọi sp_create_contract() thành công.` 
        });
        setNewContract({ driver_code: '', team_code: '', is_active: 1 });
        fetchAllData();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối tới máy chủ.' });
    }
  };

  const handleTerminateContract = async (driver_code) => {
    if (!window.confirm('Bạn có chắc chắn muốn kết thúc hợp đồng hiện tại của tay đua này?')) return;
    setMessage(null);
    try {
      const res = await fetch('http://localhost:5000/api/contracts/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_code })
      });
      const data = await res.json();
      if (res.ok) {
        const dObj = drivers.find(d => d.driver_code === driver_code);
        setMessage({ type: 'success', text: `✅ Hủy kích hoạt hợp đồng thành công cho tay đua: ${dObj ? dObj.name : driver_code}.\n• Đã gọi sp_terminate_active_contracts().` });
        fetchAllData();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối mạng.' });
    }
  };

  const handleAddPenalty = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!newPenalty.entry_id || !newPenalty.type || newPenalty.severity_value === '') {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/penalties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: parseInt(newPenalty.entry_id),
          type: newPenalty.type,
          severity_value: parseInt(newPenalty.severity_value),
          reason: newPenalty.reason
        })
      });
      const data = await res.json();
      if (res.ok) {
        const entryObj = raceEntries.find(re => re.entry_id === parseInt(newPenalty.entry_id));
        setMessage({ 
          type: 'success', 
          text: `✅ Thêm hình phạt thành công!\n• Tay đua chịu phạt: ${entryObj ? `${entryObj.driver_name} (${entryObj.team_name})` : `Lượt #${newPenalty.entry_id}`}\n• Chặng đua: ${entryObj ? entryObj.race_name : ''}\n• Loại phạt: ${newPenalty.type}\n• Severity: ${newPenalty.severity_value} giây/điểm\n• Đã gọi sp_add_penalty() thành công.` 
        });
        setNewPenalty({ entry_id: '', type: '', severity_value: '', reason: '' });
        fetchAllData();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối.' });
    }
  };

  const handleAddSponsor = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await fetch('http://localhost:5000/api/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSponsor)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `✅ Thêm nhà tài trợ thành công!\n• Tên: ${newSponsor.name}\n• Lĩnh vực: ${newSponsor.industry}\n• Gọi sp_add_sponsor() thành công.` });
        setNewSponsor({ sponsor_code: '', name: '', industry: '', description: '' });
        fetchAllData();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối.' });
    }
  };

  const handleAddSponsorship = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!newSponsorship.team_code || !newSponsorship.sponsor_code || !newSponsorship.funding_amount || !newSponsorship.start_year || !newSponsorship.end_year) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ các trường thông tin.' });
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_code: newSponsorship.team_code,
          sponsor_code: newSponsorship.sponsor_code,
          funding_amount: parseFloat(newSponsorship.funding_amount),
          start_year: parseInt(newSponsorship.start_year),
          end_year: parseInt(newSponsorship.end_year)
        })
      });
      const data = await res.json();
      if (res.ok) {
        const tObj = teams.find(t => t.team_code === newSponsorship.team_code);
        const sObj = sponsors.find(s => s.sponsor_code === newSponsorship.sponsor_code);
        setMessage({ 
          type: 'success', 
          text: `✅ Thêm hợp đồng tài trợ thành công!\n• Nhà tài trợ: ${sObj ? sObj.name : newSponsorship.sponsor_code}\n• Đội nhận tài trợ: ${tObj ? tObj.name : newSponsorship.team_code}\n• Số tiền: ${parseFloat(newSponsorship.funding_amount).toLocaleString()} USD\n• Thời hạn: ${newSponsorship.start_year} - ${newSponsorship.end_year}\n• Ghi nhận dữ liệu vào bảng: TEAM_SPONSORSHIPS.` 
        });
        setNewSponsorship({ team_code: '', sponsor_code: '', funding_amount: '', start_year: '', end_year: '' });
        fetchAllData();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối.' });
    }
  };

  const handleAddRace = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!newRace.race_code || !newRace.name || !newRace.num_laps || !newRace.location || !newRace.start_time || !newRace.champ_code) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ các trường bắt buộc.' });
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRace,
          num_laps: parseInt(newRace.num_laps)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: `✅ Thêm chặng đua thành công!\n• Tên chặng: ${newRace.name}\n• Mã chặng: ${newRace.race_code}\n• Địa điểm: ${newRace.location}\n• Mùa giải: ${newRace.champ_code}\n• Số lượng vòng: ${newRace.num_laps} vòng\n• Ghi nhận dữ liệu vào bảng: RACES.` 
        });
        setNewRace({ race_code: '', name: '', num_laps: '', location: '', start_time: '', champ_code: champCode || '', description: '' });
        fetchAllData();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối.' });
    }
  };

  // Sliced arrays for pagination
  const slicedActiveContracts = activeContracts.slice((activeContractsPage - 1) * ITEMS_PER_PAGE, activeContractsPage * ITEMS_PER_PAGE);
  const slicedDriverCareer = driverCareerSummary.slice((driverCareerPage - 1) * ITEMS_PER_PAGE, driverCareerPage * ITEMS_PER_PAGE);
  const slicedRacePenalties = racePenalties.slice((racePenaltiesPage - 1) * ITEMS_PER_PAGE, racePenaltiesPage * ITEMS_PER_PAGE);
  const slicedDriverPenalties = driverPenaltiesSummary.slice((driverPenaltiesPage - 1) * ITEMS_PER_PAGE, driverPenaltiesPage * ITEMS_PER_PAGE);
  const slicedTeamSponsors = teamSponsors.slice((teamSponsorsPage - 1) * ITEMS_PER_PAGE, teamSponsorsPage * ITEMS_PER_PAGE);
  const slicedChampionshipSummary = championshipSummary.slice((championshipSummaryPage - 1) * ITEMS_PER_PAGE, championshipSummaryPage * ITEMS_PER_PAGE);
  const slicedRaceSchedule = raceSchedule.slice((raceSchedulePage - 1) * ITEMS_PER_PAGE, raceSchedulePage * ITEMS_PER_PAGE);

  return (
    <div className="fadeIn">
      <div className="page-header">
        <h1 className="page-title">Quản lý Nghiệp vụ DBMS</h1>
        <p className="page-subtitle">Sử dụng toàn bộ Stored Procedures, Views và kiểm tra các ràng buộc dữ liệu (Triggers).</p>
      </div>

      {/* Tabs Selector */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className={`theme-btn ${activeTab === 'drivers' ? 'active' : ''}`} onClick={() => { setActiveTab('drivers'); setMessage(null); }} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Users size={16} /> Tay đua & Hợp đồng
        </button>
        <button className={`theme-btn ${activeTab === 'penalties' ? 'active' : ''}`} onClick={() => { setActiveTab('penalties'); setMessage(null); }} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <ShieldAlert size={16} /> Án phạt thi đấu
        </button>
        <button className={`theme-btn ${activeTab === 'sponsors' ? 'active' : ''}`} onClick={() => { setActiveTab('sponsors'); setMessage(null); }} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <BadgeDollarSign size={16} /> Nhà tài trợ & Tài trợ
        </button>
        <button className={`theme-btn ${activeTab === 'races' ? 'active' : ''}`} onClick={() => { setActiveTab('races'); setMessage(null); }} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Calendar size={16} /> Mùa giải & Chặng đua
        </button>
      </div>

      {/* Message feedback */}
      {message && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ whiteSpace: 'pre-line', marginBottom: '2rem' }}>
          {message.text}
        </div>
      )}

      {/* ==================== TAB 1: DRIVERS ==================== */}
      {activeTab === 'drivers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Driver Performance Modal/Section if selected */}
          {selectedDriverPerf && (
            <div className="details-panel" style={{ borderLeftColor: 'var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} className="highlight" /> Hiệu suất Tay đua: <strong>{selectedDriverPerf}</strong>
                </h3>
                <button className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)' }} onClick={() => setSelectedDriverPerf(null)}>
                  Đóng
                </button>
              </div>
              {driverPerformance ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', textval: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{driverPerformance.total_races || 0}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng chặng đã tham gia</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', textval: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>{driverPerformance.total_points || 0}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng điểm tích lũy</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', textval: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'gold' }}>{driverPerformance.total_wins || 0}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Số chiến thắng (P1)</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', textval: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-color)' }}>{driverPerformance.total_dnfs || 0}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Số chặng bỏ cuộc (DNF)</div>
                  </div>
                </div>
              ) : (
                <div className="view-loader"><div className="spinner"></div></div>
              )}
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
                * Dữ liệu thống kê được tính toán thời gian thực thông qua Stored Procedure: <strong>sp_get_driver_performance()</strong>
              </p>
            </div>
          )}

          <div className="grid-2">
            {/* Form 1: Thêm tay đua mới */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={20} className="highlight" /> Thêm Tay Đua Mới
              </h2>
              <form onSubmit={handleAddDriver} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mã tay đua (3 chữ cái in hoa)</label>
                  <input type="text" className="form-control" placeholder="Ví dụ: HAM, VER, LEC" maxLength={10} required value={newDriver.driver_code} onChange={e => setNewDriver({ ...newDriver, driver_code: e.target.value.toUpperCase() })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Họ và Tên</label>
                  <input type="text" className="form-control" placeholder="Tên tay đua" required value={newDriver.name} onChange={e => setNewDriver({ ...newDriver, name: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Ngày sinh (Thử chọn Tương Lai để kiểm tra Trigger)</label>
                  <input type="date" className="form-control" required value={newDriver.date_of_birth} onChange={e => setNewDriver({ ...newDriver, date_of_birth: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Quốc tịch</label>
                  <input type="text" className="form-control" placeholder="Ví dụ: British, German, Vietnamese" required value={newDriver.nationality} onChange={e => setNewDriver({ ...newDriver, nationality: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tiểu sử (Biography)</label>
                  <textarea className="form-control" placeholder="Tóm tắt tiểu sử tay đua..." rows={2} value={newDriver.biography} onChange={e => setNewDriver({ ...newDriver, biography: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  Thêm tay đua (sp_add_driver)
                </button>
              </form>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                ⚠️ Ràng buộc Trigger: <strong>trg_check_dob_insert</strong> kiểm tra nếu <code>date_of_birth &gt; CURDATE()</code> sẽ ngăn chặn và trả về lỗi DB.
              </div>
            </div>

            {/* Form 2: Chuyển nhượng hoặc ký hợp đồng */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowLeftRight size={18} className="highlight" /> Chuyển Nhượng Tay Đua
                </h2>
                <form onSubmit={handleTransferDriver} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Tay đua muốn chuyển nhượng</label>
                    <select className="form-control" value={transfer.driver_code} onChange={e => setTransfer({ ...transfer, driver_code: e.target.value })}>
                      <option value="">-- Chọn tay đua --</option>
                      {drivers.map(d => <option key={d.driver_code} value={d.driver_code}>{d.name} ({d.driver_code})</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Đội đua tiếp nhận</label>
                    <select className="form-control" value={transfer.team_code} onChange={e => setTransfer({ ...transfer, team_code: e.target.value })}>
                      <option value="">-- Chọn đội đua nhận --</option>
                      {teams.map(t => <option key={t.team_code} value={t.team_code}>{t.name} ({t.team_code})</option>)}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
                    Thực hiện chuyển nhượng (sp_transfer_driver)
                  </button>
                </form>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  * sp_transfer_driver tự động chấm dứt hợp đồng cũ (sp_terminate_active_contracts) và kích hoạt hợp đồng mới (sp_create_contract).
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PlusCircle size={18} className="highlight" /> Ký Hợp Đồng Mới
                </h2>
                <form onSubmit={handleCreateContract} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Tay đua</label>
                      <select className="form-control" value={newContract.driver_code} onChange={e => setNewContract({ ...newContract, driver_code: e.target.value })}>
                        <option value="">-- Chọn --</option>
                        {drivers.map(d => <option key={d.driver_code} value={d.driver_code}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Đội đua</label>
                      <select className="form-control" value={newContract.team_code} onChange={e => setNewContract({ ...newContract, team_code: e.target.value })}>
                        <option value="">-- Chọn --</option>
                        {teams.map(t => <option key={t.team_code} value={t.team_code}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Trạng thái hợp đồng</label>
                    <select className="form-control" value={newContract.is_active} onChange={e => setNewContract({ ...newContract, is_active: parseInt(e.target.value) })}>
                      <option value={1}>Hoạt động (Active)</option>
                      <option value={0}>Không hoạt động (Inactive)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
                    Ký Hợp Đồng (sp_create_contract)
                  </button>
                </form>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ⚠️ Ràng buộc Trigger: <strong>trg_single_active_contract</strong> kiểm tra mỗi tay đua chỉ được phép có 1 hợp đồng hoạt động (is_active = 1) duy nhất tại một thời điểm.
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách hợp đồng đang hoạt động */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={20} className="highlight" /> Hợp Đồng Tay Đua Đang Hoạt Động (View: v_active_contracts)
            </h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID Hợp đồng</th>
                    <th>Tay đua</th>
                    <th>Mã Tay đua</th>
                    <th>Đội đua tiếp quản</th>
                    <th>Mã Đội</th>
                    <th style={{ textAlign: 'center' }}>Thao tác nghiệp vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {slicedActiveContracts.length > 0 ? (
                    slicedActiveContracts.map(c => (
                      <tr key={c.contract_id}>
                        <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>#{c.contract_id}</td>
                        <td>{c.driver_name}</td>
                        <td><code className="font-mono">{c.driver_code}</code></td>
                        <td>{c.team_name}</td>
                        <td><code className="font-mono">{c.team_code}</code></td>
                        <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(0, 242, 96, 0.15)', color: 'var(--success)' }} onClick={() => setSelectedDriverPerf(c.driver_code)}>
                            Xem Hiệu suất (SP)
                          </button>
                          <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(255, 62, 0, 0.15)', color: 'var(--primary-color)' }} onClick={() => handleTerminateContract(c.driver_code)}>
                            Hủy hợp đồng (SP)
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có hợp đồng nào đang kích hoạt.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination currentPage={activeContractsPage} totalItems={activeContracts.length} onPageChange={setActiveContractsPage} />
          </div>

          {/* Tóm tắt sự nghiệp toàn bộ tay đua */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} className="highlight" /> Tóm Tắt Sự Nghiệp Tay Đua (View: v_driver_career_summary)
            </h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tay đua</th>
                    <th>Quốc tịch</th>
                    <th style={{ textAlign: 'center' }}>Số chặng tham dự</th>
                    <th style={{ textAlign: 'center' }}>Số chặng hoàn thành</th>
                    <th style={{ textAlign: 'center' }}>Điểm sự nghiệp</th>
                  </tr>
                </thead>
                <tbody>
                  {slicedDriverCareer.length > 0 ? (
                    slicedDriverCareer.map(d => (
                      <tr key={d.driver_code}>
                        <td style={{ fontWeight: 600 }}>{d.name} ({d.driver_code})</td>
                        <td>{d.nationality}</td>
                        <td style={{ textAlign: 'center' }}>{d.total_races_entered}</td>
                        <td style={{ textAlign: 'center' }}>{d.total_finishes}</td>
                        <td style={{ textAlign: 'center' }}><span className="score-badge">{d.total_career_points} pts</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không có thông tin thống kê.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination currentPage={driverCareerPage} totalItems={driverCareerSummary.length} onPageChange={setDriverCareerPage} />
          </div>
        </div>
      )}

      {/* ==================== TAB 2: PENALTIES ==================== */}
      {activeTab === 'penalties' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="grid-2">
            {/* Form ghi nhận lỗi phạt */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={20} className="highlight" /> Ghi Nhận Hình Phạt Mới
              </h2>
              <form onSubmit={handleAddPenalty} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Chọn Tay đua & Chặng đua (Lượt đăng ký)</label>
                  <select className="form-control" required value={newPenalty.entry_id} onChange={e => setNewPenalty({ ...newPenalty, entry_id: e.target.value })}>
                    <option value="">-- Chọn tay đua đã đăng ký thi đấu --</option>
                    {raceEntries.map(re => (
                      <option key={re.entry_id} value={re.entry_id}>
                        [{re.champ_code}] {re.driver_name} - {re.team_name} | Chặng: {re.race_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Loại hình phạt (Penalty Type)</label>
                  <input type="text" className="form-control" placeholder="Ví dụ: Time Penalty, Grid Penalty, Disqualification" required value={newPenalty.type} onChange={e => setNewPenalty({ ...newPenalty, type: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mức phạt (Severity Value - Thử nhập số ÂM để kiểm tra Trigger)</label>
                  <input type="number" className="form-control" placeholder="Ví dụ: 5 (giây), 10 (giây), 3 (grid positions)" required value={newPenalty.severity_value} onChange={e => setNewPenalty({ ...newPenalty, severity_value: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Lý do bị phạt (Reason)</label>
                  <textarea className="form-control" placeholder="Ví dụ: Causing a collision, Speeding in pit lane..." rows={3} value={newPenalty.reason} onChange={e => setNewPenalty({ ...newPenalty, reason: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  Ghi Án Phạt (sp_add_penalty)
                </button>
              </form>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ⚠️ Ràng buộc Trigger: <strong>trg_validate_penalty_value</strong> đảm bảo mức phạt (severity_value) phải lớn hơn hoặc bằng 0.
              </div>
            </div>

            {/* View: Bảng tổng quan án phạt từng tay đua */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} className="highlight" /> Thống Kê Lỗi Phạt Tay Đua (View: v_driver_penalties_summary)
              </h2>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tay đua</th>
                      <th style={{ textAlign: 'center' }}>Số lần bị phạt</th>
                      <th style={{ textAlign: 'center' }}>Tổng mức phạt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slicedDriverPenalties.length > 0 ? (
                      slicedDriverPenalties.map(p => (
                        <tr key={p.driver_code}>
                          <td style={{ fontWeight: 600 }}>{p.driver_name}</td>
                          <td style={{ textAlign: 'center' }}>{p.total_penalties} lần</td>
                          <td style={{ textAlign: 'center', color: 'var(--primary-color)', fontWeight: 'bold' }}>{p.total_severity}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có tay đua nào bị phạt.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination currentPage={driverPenaltiesPage} totalItems={driverPenaltiesSummary.length} onPageChange={setDriverPenaltiesPage} />
            </div>
          </div>

          {/* View: Danh sách chi tiết hình phạt của các chặng đua */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={20} className="highlight" /> Nhật Ký Hình Phạt Chặng Đua (View: v_race_penalties)
            </h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Chặng đua</th>
                    <th>Tay đua</th>
                    <th>Đội đua</th>
                    <th>Loại phạt</th>
                    <th style={{ textAlign: 'center' }}>Mức phạt</th>
                    <th>Lý do vi phạm</th>
                  </tr>
                </thead>
                <tbody>
                  {slicedRacePenalties.length > 0 ? (
                    slicedRacePenalties.map((rp, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{rp.race_name}</td>
                        <td>{rp.driver_name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{rp.team_name}</td>
                        <td><span style={{ padding: '0.2rem 0.6rem', background: 'rgba(255, 62, 0, 0.1)', color: 'var(--primary-color)', border: '1px solid rgba(255, 62, 0, 0.2)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{rp.penalty_type}</span></td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{rp.severity_value}</td>
                        <td style={{ fontSize: '0.85rem' }}>{rp.reason}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Lịch sử chặng đua chưa ghi nhận hình phạt nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination currentPage={racePenaltiesPage} totalItems={racePenalties.length} onPageChange={setRacePenaltiesPage} />
          </div>
        </div>
      )}

      {/* ==================== TAB 3: SPONSORS ==================== */}
      {activeTab === 'sponsors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="grid-2">
            {/* Form thêm nhà tài trợ mới */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={20} className="highlight" /> Đăng Ký Nhà Tài Trợ Mới
              </h2>
              <form onSubmit={handleAddSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mã tài trợ (Sponsor Code)</label>
                  <input type="text" className="form-control" placeholder="Ví dụ: ROLEX, DHL" maxLength={10} required value={newSponsor.sponsor_code} onChange={e => setNewSponsor({ ...newSponsor, sponsor_code: e.target.value.toUpperCase() })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tên nhà tài trợ</label>
                  <input type="text" className="form-control" placeholder="Tên công ty / thương hiệu" required value={newSponsor.name} onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Lĩnh vực kinh doanh (Industry)</label>
                  <input type="text" className="form-control" placeholder="Ví dụ: Luxury, Logistics, Banking" required value={newSponsor.industry} onChange={e => setNewSponsor({ ...newSponsor, industry: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mô tả chi tiết</label>
                  <textarea className="form-control" placeholder="Mô tả nhà tài trợ..." rows={3} value={newSponsor.description} onChange={e => setNewSponsor({ ...newSponsor, description: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  Thêm nhà tài trợ (sp_add_sponsor)
                </button>
              </form>
            </div>

            {/* Form tạo tài trợ cho đội đua */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BadgeDollarSign size={20} className="highlight" /> Thiết Lập Quan Hệ Tài Trợ Đội Đua
              </h2>
              <form onSubmit={handleAddSponsorship} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Chọn Đội đua</label>
                  <select className="form-control" required value={newSponsorship.team_code} onChange={e => setNewSponsorship({ ...newSponsorship, team_code: e.target.value })}>
                    <option value="">-- Chọn đội đua --</option>
                    {teams.map(t => <option key={t.team_code} value={t.team_code}>{t.name} ({t.team_code})</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Chọn Nhà tài trợ</label>
                  <select className="form-control" required value={newSponsorship.sponsor_code} onChange={e => setNewSponsorship({ ...newSponsorship, sponsor_code: e.target.value })}>
                    <option value="">-- Chọn nhà tài trợ --</option>
                    {sponsors.map(s => <option key={s.sponsor_code} value={s.sponsor_code}>{s.name} ({s.sponsor_code})</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Kinh phí tài trợ (USD)</label>
                  <input type="number" className="form-control" placeholder="Ví dụ: 50000000" required value={newSponsorship.funding_amount} onChange={e => setNewSponsorship({ ...newSponsorship, funding_amount: e.target.value })} />
                </div>
                <div className="grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Năm bắt đầu (Start Year - Thử chọn &gt; Năm kết thúc)</label>
                    <input type="number" className="form-control" placeholder="Ví dụ: 2026" required value={newSponsorship.start_year} onChange={e => setNewSponsorship({ ...newSponsorship, start_year: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Năm kết thúc (End Year)</label>
                    <input type="number" className="form-control" placeholder="Ví dụ: 2025" required value={newSponsorship.end_year} onChange={e => setNewSponsorship({ ...newSponsorship, end_year: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  Đồng bộ quan hệ Tài trợ
                </button>
              </form>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ⚠️ Ràng buộc Trigger: <strong>trg_check_sponsorship_years</strong> kiểm tra nếu <code>start_year &gt; end_year</code> sẽ bị chặn giao dịch.
              </div>
            </div>
          </div>

          {/* View: Danh sách tài trợ đội đua */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BadgeDollarSign size={20} className="highlight" /> Tài Trợ Đội Đua Hiện Tại (View: v_team_sponsors)
            </h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Đội đua</th>
                    <th>Nhà tài trợ</th>
                    <th>Lĩnh vực tài trợ</th>
                    <th style={{ textAlign: 'right' }}>Kinh phí (USD / Mùa giải)</th>
                  </tr>
                </thead>
                <tbody>
                  {slicedTeamSponsors.length > 0 ? (
                    slicedTeamSponsors.map((ts, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{ts.team_name} ({ts.team_code})</td>
                        <td>{ts.sponsor_name}</td>
                        <td>{ts.industry}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--success)' }}>
                          ${parseFloat(ts.funding_amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có hợp đồng tài trợ nào được thiết lập.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination currentPage={teamSponsorsPage} totalItems={teamSponsors.length} onPageChange={setTeamSponsorsPage} />
          </div>
        </div>
      )}

      {/* ==================== TAB 4: RACES ==================== */}
      {activeTab === 'races' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="grid-2">
            {/* Form thêm chặng đua mới */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={20} className="highlight" /> Tạo Chặng Đua Mới
              </h2>
              <form onSubmit={handleAddRace} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Mã chặng đua (Race Code)</label>
                    <input type="text" className="form-control" placeholder="Ví dụ: VN26, SGP26" maxLength={10} required value={newRace.race_code} onChange={e => setNewRace({ ...newRace, race_code: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Chọn Mùa Giải (Championship)</label>
                    <select className="form-control" required value={newRace.champ_code} onChange={e => setNewRace({ ...newRace, champ_code: e.target.value })}>
                      <option value="">-- Mùa giải --</option>
                      {championships.map(c => <option key={c.champ_code} value={c.champ_code}>{c.champ_code}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tên chặng đua</label>
                  <input type="text" className="form-control" placeholder="Ví dụ: Vietnam Grand Prix" required value={newRace.name} onChange={e => setNewRace({ ...newRace, name: e.target.value })} />
                </div>
                <div className="grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Số vòng chạy (Thử nhập &lt;= 0 để kiểm tra Trigger)</label>
                    <input type="number" className="form-control" placeholder="Ví dụ: 55" required value={newRace.num_laps} onChange={e => setNewRace({ ...newRace, num_laps: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Địa điểm diễn ra</label>
                    <input type="text" className="form-control" placeholder="Ví dụ: Hanoi, Vietnam" required value={newRace.location} onChange={e => setNewRace({ ...newRace, location: e.target.value })} />
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Thời điểm xuất phát</label>
                  <input type="datetime-local" className="form-control" required value={newRace.start_time} onChange={e => setNewRace({ ...newRace, start_time: e.target.value.replace('T', ' ') })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mô tả chặng đua</label>
                  <textarea className="form-control" placeholder="Mô tả chặng đua..." rows={2} value={newRace.description} onChange={e => setNewRace({ ...newRace, description: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  Tạo chặng đua mới (RACES)
                </button>
              </form>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ⚠️ Ràng buộc Trigger: <strong>trg_prevent_negative_laps_race</strong> yêu cầu số lượng vòng đua của chặng phải lớn hơn 0.
              </div>
            </div>

            {/* View: Tổng quan mùa giải */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} className="highlight" /> Tổng Quan Mùa Giải (View: v_championship_summary)
              </h2>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mùa giải</th>
                      <th style={{ textAlign: 'center' }}>Tổng số chặng</th>
                      <th style={{ textAlign: 'center' }}>Số Đội đua tham gia</th>
                      <th style={{ textAlign: 'center' }}>Số Tay đua có hợp đồng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slicedChampionshipSummary.length > 0 ? (
                      slicedChampionshipSummary.map(cs => (
                        <tr key={cs.champ_code}>
                          <td style={{ fontWeight: 600 }}>{cs.championship_name} ({cs.champ_code})</td>
                          <td style={{ textAlign: 'center' }}>{cs.total_races} chặng</td>
                          <td style={{ textAlign: 'center' }}>{cs.total_participating_teams} đội</td>
                          <td style={{ textAlign: 'center' }}>{cs.total_participating_drivers} tay đua</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy thông tin tổng kết mùa giải.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination currentPage={championshipSummaryPage} totalItems={championshipSummary.length} onPageChange={setChampionshipSummaryPage} />
            </div>
          </div>

          {/* View: Lịch thi đấu chặng đua */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} className="highlight" /> Lịch Thi Đấu Chặng Đua (View: v_race_schedule)
            </h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã chặng</th>
                    <th>Chặng đua</th>
                    <th>Mùa giải</th>
                    <th>Địa điểm diễn ra</th>
                    <th>Thời điểm khởi tranh</th>
                  </tr>
                </thead>
                <tbody>
                  {slicedRaceSchedule.length > 0 ? (
                    slicedRaceSchedule.map(rs => (
                      <tr key={rs.race_code}>
                        <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{rs.race_code}</td>
                        <td style={{ fontWeight: 600 }}>{rs.race_name}</td>
                        <td>{rs.championship_name}</td>
                        <td>{rs.location}</td>
                        <td>{new Date(rs.start_time).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa cấu hình lịch thi đấu.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination currentPage={raceSchedulePage} totalItems={raceSchedule.length} onPageChange={setRaceSchedulePage} />
          </div>
        </div>
      )}
    </div>
  );
}
