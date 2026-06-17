// ==========================================
// === DATABASE INSPECTOR START ===
// ==========================================
import React, { useState, useEffect } from 'react';
import { Database, Eye, Zap, Play, ListFilter, ShieldAlert } from 'lucide-react';

const viewFriendlyNames = {
  v_race_performance: 'Hiệu suất thi đấu chặng đua',
  v_driver_standings: 'Bảng xếp hạng tay đua',
  v_team_standings: 'Bảng xếp hạng đội đua',
  v_active_contracts: 'Hợp đồng tay đua đang hoạt động',
  v_race_schedule: 'Lịch thi đấu chặng đua',
  v_team_sponsors: 'Nhà tài trợ đội đua',
  v_race_penalties: 'Án phạt chặng đua',
  v_driver_penalties_summary: 'Thống kê lỗi phạt tay đua',
  v_driver_career_summary: 'Thống kê sự nghiệp tay đua',
  v_championship_summary: 'Tổng quan mùa giải vô địch'
};

const tableFriendlyNames = {
  CHAMPIONSHIPS: 'Mùa giải thi đấu',
  TEAMS: 'Đội đua',
  DRIVERS: 'Tay đua',
  CONTRACTS: 'Hợp đồng tay đua',
  RACES: 'Chặng đua',
  RACE_ENTRIES: 'Đăng ký chặng đua',
  RESULTS: 'Kết quả thi đấu',
  SPONSORS: 'Nhà tài trợ',
  TEAM_SPONSORSHIPS: 'Tài trợ đội đua',
  PENALTIES: 'Hình phạt trong chặng'
};

const triggerFriendlyNames = {
  trg_limit_2_riders: 'Giới hạn 2 tay đua/đội/chặng',
  trg_check_time_insert: 'Kiểm tra thời gian hoàn thành',
  trg_check_time_update: 'Kiểm tra thời gian hoàn thành',
  trg_limit_laps_completed_insert: 'Kiểm tra giới hạn vòng đua',
  trg_limit_laps_completed_update: 'Kiểm tra giới hạn vòng đua',
  trg_single_active_contract: 'Ràng buộc duy nhất 1 hợp đồng hoạt động',
  trg_validate_penalty_value: 'Kiểm tra giá trị phạt không âm',
  trg_check_dob_insert: 'Kiểm tra ngày sinh không ở tương lai',
  trg_prevent_negative_laps_race: 'Số vòng đua chặng phải lớn hơn 0',
  trg_check_sponsorship_years: 'Kiểm tra năm tài trợ hợp lệ'
};

const procedureFriendlyNames = {
  sp_calculate_points: 'Tính điểm chặng tự động',
  sp_add_driver: 'Thêm mới tay đua',
  sp_create_contract: 'Ký hợp đồng mới',
  sp_register_race_entry: 'Đăng ký đua chặng',
  sp_add_penalty: 'Thêm hình phạt tay đua',
  sp_add_sponsor: 'Thêm nhà tài trợ',
  sp_get_driver_performance: 'Lấy hiệu suất thi đấu tay đua',
  sp_get_team_drivers: 'Lấy danh sách tay đua của đội',
  sp_terminate_active_contracts: 'Hủy kích hoạt hợp đồng',
  sp_transfer_driver: 'Chuyển nhượng tay đua'
};

const indexFriendlyNames = {
  idx_race_code: 'Tối ưu lọc đăng ký theo chặng đua',
  idx_team_code_contracts: 'Tối ưu lọc hợp đồng theo đội',
  idx_results_status_time: 'Tối ưu lọc kết quả chặng đua',
  idx_races_start_time: 'Tối ưu lọc lịch trình chặng đua',
  idx_races_champ_code: 'Tối ưu lọc chặng theo mùa giải',
  idx_drivers_nationality: 'Tối ưu tìm kiếm tay đua theo quốc tịch',
  idx_contracts_is_active: 'Tối ưu lọc hợp đồng đang kích hoạt',
  idx_drivers_name: 'Tối ưu tìm kiếm tay đua theo tên',
  idx_penalties_entry: 'Tối ưu lọc hình phạt theo đăng ký',
  idx_team_sponsorships_yr: 'Tối ưu lọc tài trợ theo thời hạn'
};

function DatabaseInspector() {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tables');

  // === DATABASE INSPECTOR STATES FOR VIEWS ===
  const [selectedView, setSelectedView] = useState('');
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/db-metadata')
      .then(res => {
        if (!res.ok) {
          throw new Error('Không thể kết nối đến API Metadata');
        }
        return res.json();
      })
      .then(data => {
        setMetadata(data);
        if (data.views && data.views.length > 0) {
          setSelectedView(data.views[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Fetch view data dynamically when selectedView changes
  useEffect(() => {
    if (!selectedView) return;
    setViewLoading(true);
    setViewError(null);
    fetch(`http://localhost:5000/api/db-view/${selectedView}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Lỗi tải dữ liệu của view: ${selectedView}`);
        }
        return res.json();
      })
      .then(data => {
        setViewData(data);
        setViewLoading(false);
      })
      .catch(err => {
        setViewError(err.message);
        setViewLoading(false);
      });
  }, [selectedView]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải thông tin cấu trúc cơ sở dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-card">
        <ShieldAlert size={48} className="error-icon" />
        <h3>Lỗi kết nối Cơ sở dữ liệu</h3>
        <p>{error}</p>
        <p className="error-tip">Đảm bảo backend đang chạy và cơ sở dữ liệu đã được import chính xác.</p>
      </div>
    );
  }

  const tabNames = {
    tables: 'Bảng dữ liệu',
    views: 'Khung nhìn (View)',
    triggers: 'Trình kích hoạt (Trigger)',
    procedures: 'Thủ tục lưu trữ (Stored Procedure)',
    indexes: 'Chỉ mục (Index)'
  };

  const cards = [
    { id: 'tables', label: 'Bảng dữ liệu', count: metadata.tables.length, icon: <Database size={24} />, color: '#ef4444' },
    { id: 'views', label: 'Khung nhìn (View)', count: metadata.views.length, icon: <Eye size={24} />, color: '#3b82f6' },
    { id: 'triggers', label: 'Trình kích hoạt', count: metadata.triggers.length, icon: <Zap size={24} />, color: '#eab308' },
    { id: 'procedures', label: 'Thủ tục', count: metadata.procedures.length, icon: <Play size={24} />, color: '#10b981' },
    { id: 'indexes', label: 'Chỉ mục', count: metadata.indexes.length, icon: <ListFilter size={24} />, color: '#8b5cf6' }
  ];

  return (
    <div className="db-inspector-container">
      <div className="page-header">
        <h1 className="page-title">Giám sát Cơ sở Dữ liệu</h1>
        <p className="page-subtitle">Giám sát và kiểm tra cấu trúc cơ sở dữ liệu F1 Championship Management System</p>
      </div>

      {/* Grid thống kê số lượng */}
      <div className="db-cards-grid">
        {cards.map(card => (
          <div
            key={card.id}
            className={`db-card ${activeTab === card.id ? 'active' : ''}`}
            onClick={() => setActiveTab(card.id)}
            style={{ '--card-accent': card.color }}
          >
            <div className="db-card-icon" style={{ color: card.color }}>
              {card.icon}
            </div>
            <div className="db-card-info">
              <div className="db-card-count">{card.count}</div>
              <div className="db-card-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Danh sách chi tiết thực thể */}
      <div className="db-details-panel">
        <div className="panel-header">
          <h2>Danh sách chi tiết: {tabNames[activeTab]} ({cards.find(c => c.id === activeTab).count})</h2>
        </div>
        <div className="panel-content">
          {activeTab === 'tables' && (
            <div className="db-list">
              {metadata.tables.map((table, idx) => (
                <div key={table} className="db-item-row">
                  <span className="item-index">#{idx + 1}</span>
                  <span className="item-name">{table} {tableFriendlyNames[table] ? `(${tableFriendlyNames[table]})` : ''}</span>
                  <span className="item-tag table-tag">Bảng dữ liệu</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'views' && (
            <div className="db-views-layout">
              {/* Top pane: combo box selector */}
              <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
                <div className="form-group" style={{ margin: 0, maxWidth: '600px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Chọn Khung nhìn (View) để hiển thị dữ liệu:
                  </label>
                  <select
                    className="form-control"
                    value={selectedView}
                    onChange={e => setSelectedView(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    {metadata.views.map((view) => (
                      <option key={view} value={view}>
                        {view} {viewFriendlyNames[view] ? `(${viewFriendlyNames[view]})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bottom pane: views data preview */}
              <div className="db-preview-pane full-width">
                {selectedView ? (
                  <div className="view-preview-container">
                    <div className="view-preview-header">
                      <div className="view-preview-title-row">
                        <h3>Dữ liệu Khung nhìn: <strong>{selectedView}</strong></h3>
                        <span className="row-count-badge">
                          {viewData ? `${viewData.length} dòng` : '...'}
                        </span>
                      </div>
                    </div>

                    {viewLoading ? (
                      <div className="view-loader">
                        <div className="spinner"></div>
                        <p>Đang tải dữ liệu của {selectedView}...</p>
                      </div>
                    ) : viewError ? (
                      <div className="view-error-message">
                        <ShieldAlert size={20} className="error-icon-small" />
                        <span>{viewError}</span>
                      </div>
                    ) : viewData && viewData.length > 0 ? (
                      <div className="table-responsive view-table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {Object.keys(viewData[0]).map((key) => (
                                <th key={key}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {viewData.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {Object.values(row).map((val, cIdx) => (
                                  <td key={cIdx}>
                                    {val === null || val === undefined ? (
                                      <em className="text-null">null</em>
                                    ) : typeof val === 'object' ? (
                                      JSON.stringify(val)
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="view-empty-message">
                        <p>Không có dữ liệu trong view này hoặc view rỗng.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="view-select-prompt">
                    <p>Vui lòng chọn một khung nhìn ở bên trên để xem dữ liệu.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'triggers' && (
            <div className="db-list">
              {metadata.triggers.map((trg, idx) => (
                <div key={trg.name} className="db-item-row">
                  <span className="item-index">#{idx + 1}</span>
                  <div className="item-details">
                    <span className="item-name">{trg.name} {triggerFriendlyNames[trg.name] ? `(${triggerFriendlyNames[trg.name]})` : ''}</span>
                    <span className="item-sub">Bảng tác động: <strong>{trg.table} {tableFriendlyNames[trg.table] ? `(${tableFriendlyNames[trg.table]})` : ''}</strong></span>
                  </div>
                  <span className="item-tag trigger-tag">{trg.event}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'procedures' && (
            <div className="db-list">
              {metadata.procedures.map((proc, idx) => (
                <div key={proc} className="db-item-row">
                  <span className="item-index">#{idx + 1}</span>
                  <span className="item-name">{proc}() {procedureFriendlyNames[proc] ? `(${procedureFriendlyNames[proc]})` : ''}</span>
                  <span className="item-tag proc-tag">Thủ tục lưu trữ</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'indexes' && (
            <div className="db-list">
              {metadata.indexes.map((index, idx) => (
                <div key={`${index.table}-${index.name}`} className="db-item-row">
                  <span className="item-index">#{idx + 1}</span>
                  <div className="item-details">
                    <span className="item-name">{index.name} {indexFriendlyNames[index.name] ? `(${indexFriendlyNames[index.name]})` : ''}</span>
                    <span className="item-sub">Bảng: <strong>{index.table} {tableFriendlyNames[index.table] ? `(${tableFriendlyNames[index.table]})` : ''}</strong> | Cột: <strong>{index.column}</strong></span>
                  </div>
                  <span className="item-tag index-tag">Chỉ mục tùy chỉnh</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DatabaseInspector;
// ==========================================
// === DATABASE INSPECTOR END ===
// ==========================================
