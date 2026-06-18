const express = require('express');
const router = express.Router();
const db = require('../db');

// ============================================================
// 0. CHAMPIONSHIPS — Danh sách mùa giải
// ============================================================
// Lấy danh sách tất cả các mùa giải
router.get('/championships', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM CHAMPIONSHIPS ORDER BY champ_code DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 1. MASTER DATA
// ============================================================
// Lấy danh sách các chặng đua (có thể lọc theo mùa giải)
router.get('/races', async (req, res) => {
    try {
        const { champ_code } = req.query;
        let query = 'SELECT * FROM RACES';
        let params = [];
        if (champ_code) {
            query += ' WHERE champ_code = ?';
            params.push(champ_code);
        }
        query += ' ORDER BY start_time ASC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy danh sách các đội đua
router.get('/teams', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM TEAMS ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy danh sách tay đua thuộc một đội đua
router.get('/teams/:team_code/drivers', async (req, res) => {
    try {
        const [result] = await db.query('CALL sp_get_team_drivers(?)', [req.params.team_code]);
        const rows = result[0].filter(r => r.is_active === 1);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 2. MODULE 1: Register Racing
// ============================================================
// Lấy danh sách đăng ký tham gia chặng đua của một đội đua
router.get('/races/:race_code/teams/:team_code/entries', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.contract_id, (SELECT COUNT(*) FROM RESULTS WHERE entry_id = re.entry_id) as has_result
            FROM RACE_ENTRIES re
            JOIN CONTRACTS c ON re.contract_id = c.contract_id
            WHERE re.race_code = ? AND c.team_code = ?
        `, [req.params.race_code, req.params.team_code]);
        res.json({
            contract_ids: rows.map(r => r.contract_id), // trả về id để frontend biết mà tích là đã chọn r
            locked: rows.some(r => r.has_result > 0)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lưu danh sách đăng ký tham gia chặng đua của một đội đua
router.post('/races/:race_code/teams/:team_code/entries', async (req, res) => {
    const { race_code, team_code } = req.params;
    const { contract_ids } = req.body;

    if (!Array.isArray(contract_ids) || contract_ids.length > 2) {
        return res.status(400).json({ error: 'Please submit maximum of 2 racers.' });
    }

    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            // Kiểm tra đã nhập kết quả đua chưa
            const [hasResults] = await connection.query(`
                SELECT COUNT(*) as count FROM RESULTS r
                JOIN RACE_ENTRIES re ON r.entry_id = re.entry_id
                JOIN CONTRACTS c ON re.contract_id = c.contract_id
                WHERE re.race_code = ? AND c.team_code = ?
            `, [race_code, team_code]);
            if (hasResults[0].count > 0) {
                connection.release();
                return res.status(400).json({ error: 'Data is locked. Cannot alter registration after results have been entered.' });
            }

            //Lấy danh sách các contract_id đã có trong database
            const [existing] = await connection.query(`
                SELECT re.entry_id, re.contract_id 
                FROM RACE_ENTRIES re JOIN CONTRACTS c ON re.contract_id = c.contract_id
                WHERE re.race_code = ? AND c.team_code = ?
            `, [race_code, team_code]);
            const existingIds = existing.map(e => e.contract_id);

            const toDelete = existing.filter(e => !contract_ids.includes(e.contract_id));
            if (toDelete.length > 0) {
                const entryIdsToDelete = toDelete.map(e => e.entry_id);
                await connection.query(`DELETE FROM RESULTS WHERE entry_id IN (?)`, [entryIdsToDelete]);
                await connection.query(`DELETE FROM RACE_ENTRIES WHERE entry_id IN (?)`, [entryIdsToDelete]);
            }

            const toInsert = contract_ids.filter(id => !existingIds.includes(id));
            for (const cid of toInsert) {
                await connection.query(`CALL sp_register_race_entry(?, ?)`, [race_code, cid]);
            }

            await connection.commit();
            res.json({ success: true, message: 'Sync successful' });
        } catch (txnErr) {
            await connection.rollback();
            throw txnErr;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 3. MODULE 2: Update Results
// ============================================================
// Lấy danh sách tay đua đăng ký tham gia một chặng đua
router.get('/races/:race_code/entries', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT re.entry_id, d.name AS driver_name, t.name AS team_name, re.race_code,
                   rs.end_time, rs.laps_completed, rs.status,
                   CASE WHEN rs.entry_id IS NOT NULL THEN 1 ELSE 0 END AS is_locked
            FROM RACE_ENTRIES re 
            JOIN CONTRACTS c ON re.contract_id = c.contract_id 
            JOIN DRIVERS d ON c.driver_code = d.driver_code 
            JOIN TEAMS t ON c.team_code = t.team_code
            LEFT JOIN RESULTS rs ON re.entry_id = rs.entry_id
            WHERE re.race_code = ?
            ORDER BY t.name ASC, d.name ASC
        `, [req.params.race_code]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lưu hoặc cập nhật kết quả chặng đua và tính điểm
router.post('/races/results', async (req, res) => {
    const { results } = req.body;

    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            // Lấy thông tin chặng đua (num_laps) từ entry đầu tiên
            if (results.length > 0) {
                const [raceInfo] = await connection.query(`
                    SELECT r.num_laps, r.name AS race_name
                    FROM RACE_ENTRIES re
                    JOIN RACES r ON re.race_code = r.race_code
                    WHERE re.entry_id = ?
                `, [results[0].entry_id]);

                if (raceInfo.length > 0) {
                    const numLaps = raceInfo[0].num_laps;

                    // Validate: nếu status = 'Finished' thì laps_completed phải = num_laps
                    for (const r of results) {
                        if (r.status === 'Finished') {
                            const laps = parseInt(r.laps_completed);
                            if (laps !== numLaps) {
                                // Lấy tên tay đua để thông báo lỗi cụ thể
                                const [driverInfo] = await connection.query(`
                                    SELECT d.name AS driver_name
                                    FROM RACE_ENTRIES re
                                    JOIN CONTRACTS c ON re.contract_id = c.contract_id
                                    JOIN DRIVERS d ON c.driver_code = d.driver_code
                                    WHERE re.entry_id = ?
                                `, [r.entry_id]);
                                const driverName = driverInfo.length > 0 ? driverInfo[0].driver_name : `Entry #${r.entry_id}`;
                                await connection.rollback();
                                connection.release();
                                return res.status(400).json({
                                    error: `Lỗi nghiệp vụ: Tay đua "${driverName}" có trạng thái "Hoàn thành" (Finished) nhưng số vòng hoàn thành (${laps}) không bằng tổng số vòng của chặng (${numLaps}). Tay đua hoàn thành chặng phải chạy đủ ${numLaps} vòng, hoặc đổi trạng thái thành DNF/Accident.`
                                });
                            }
                        }
                    }
                }
            }

            for (const r of results) {
                const endTime = r.end_time ? r.end_time : null;
                const laps = r.laps_completed ? r.laps_completed : 0;
                await connection.query(`
                    INSERT INTO RESULTS (entry_id, end_time, laps_completed, status)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        end_time = VALUES(end_time),
                        laps_completed = VALUES(laps_completed),
                        status = VALUES(status)
                `, [r.entry_id, endTime, laps, r.status]);
            }

            if (results.length > 0) {
                const [raceData] = await connection.query(
                    `SELECT race_code FROM RACE_ENTRIES WHERE entry_id = ?`,
                    [results[0].entry_id]
                );
                if (raceData.length > 0) {
                    await connection.query(`CALL sp_calculate_points(?)`, [raceData[0].race_code]);
                }
            }

            await connection.commit();
            res.json({ success: true, message: 'Results saved successfully' });
        } catch (txnErr) {
            await connection.rollback();
            throw txnErr;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Xóa kết quả chặng đua của một lượt đăng ký
router.delete('/results/:entry_id', async (req, res) => {
    try {
        await db.query('DELETE FROM RESULTS WHERE entry_id = ?', [req.params.entry_id]);
        res.json({ success: true, message: 'Result cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 4. MODULE 3: Driver Standings — Lọc theo champ_code
// ============================================================
// Lấy bảng xếp hạng cá nhân tay đua
router.get('/standings/drivers', async (req, res) => {
    const { stage, champ_code } = req.query;
    try {
        let query;
        let queryParams = [];

        if (stage) {
            // BXH tính đến một chặng cụ thể (trong cùng mùa giải)
            query = `
                SELECT d.driver_code, d.name, d.nationality, t.name AS team_name,
                SUM(vp.points) AS total_score,
                SUM(CASE WHEN vp.status = 'Finished' THEN vp.finish_time_seconds ELSE 0 END) AS total_time
                FROM DRIVERS d
                JOIN v_race_performance vp ON vp.driver_code = d.driver_code
                JOIN TEAMS t ON vp.team_code = t.team_code
                JOIN RACES r ON vp.race_code = r.race_code
                WHERE r.start_time <= (SELECT start_time FROM RACES WHERE race_code = ?)
                  AND r.champ_code = (SELECT champ_code FROM RACES WHERE race_code = ?)
                GROUP BY d.driver_code, d.name, d.nationality, t.name
                ORDER BY total_score DESC, total_time ASC
            `;
            queryParams = [stage, stage];
        } else if (champ_code) {
            // BXH toàn mùa giải theo champ_code
            query = `
                SELECT d.driver_code, d.name, d.nationality, t.name AS team_name,
                SUM(vp.points) AS total_score,
                SUM(CASE WHEN vp.status = 'Finished' THEN vp.finish_time_seconds ELSE 0 END) AS total_time
                FROM DRIVERS d
                JOIN v_race_performance vp ON vp.driver_code = d.driver_code
                JOIN TEAMS t ON vp.team_code = t.team_code
                WHERE vp.champ_code = ?
                GROUP BY d.driver_code, d.name, d.nationality, t.name
                ORDER BY total_score DESC, total_time ASC
            `;
            queryParams = [champ_code];
        } else {
            query = `SELECT driver_code, name, nationality, team_name, total_score, total_season_time AS total_time FROM v_driver_standings`;
        }

        const [rows] = await db.query(query, queryParams);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy chi tiết kết quả qua các chặng của một tay đua
router.get('/drivers/:driver_code/results', async (req, res) => {
    try {
        const { champ_code } = req.query;
        let query = `
            SELECT r.name AS stage_name, 
                   CASE WHEN vp.status = 'Finished' THEN 
                       (SELECT COUNT(*)+1 FROM v_race_performance vp2 
                        WHERE vp2.race_code = vp.race_code 
                          AND vp2.status = 'Finished' 
                          AND vp2.finish_time_seconds < vp.finish_time_seconds)
                   ELSE NULL END AS finish_rank,
                   vp.points AS score, 
                   vp.finish_time_seconds AS time_to_finish, 
                   vp.status,
                   r.champ_code
            FROM v_race_performance vp
            JOIN RACES r ON vp.race_code = r.race_code
            WHERE vp.driver_code = ?
        `;
        let params = [req.params.driver_code];
        if (champ_code) {
            query += ' AND r.champ_code = ?';
            params.push(champ_code);
        }
        query += ' ORDER BY r.start_time ASC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 5. MODULE 4: Team Standings — Lọc theo champ_code
// ============================================================
// Lấy bảng xếp hạng đồng đội/đội đua
router.get('/standings/teams', async (req, res) => {
    const { stage, champ_code } = req.query;
    try {
        let query;
        let queryParams = [];

        if (stage) {
            query = `
                SELECT t.team_code, t.name AS team_name, t.brand,
                SUM(vp.points) AS total_score,
                SUM(CASE WHEN vp.status = 'Finished' THEN vp.finish_time_seconds ELSE 0 END) AS total_time
                FROM TEAMS t
                JOIN v_race_performance vp ON vp.team_code = t.team_code
                JOIN RACES r ON vp.race_code = r.race_code
                WHERE r.start_time <= (SELECT start_time FROM RACES WHERE race_code = ?)
                  AND r.champ_code = (SELECT champ_code FROM RACES WHERE race_code = ?)
                GROUP BY t.team_code, t.name, t.brand
                ORDER BY total_score DESC, total_time ASC
            `;
            queryParams = [stage, stage];
        } else if (champ_code) {
            query = `
                SELECT t.team_code, t.name AS team_name, t.brand,
                SUM(vp.points) AS total_score,
                SUM(CASE WHEN vp.status = 'Finished' THEN vp.finish_time_seconds ELSE 0 END) AS total_time
                FROM TEAMS t
                JOIN v_race_performance vp ON vp.team_code = t.team_code
                WHERE vp.champ_code = ?
                GROUP BY t.team_code, t.name, t.brand
                ORDER BY total_score DESC, total_time ASC
            `;
            queryParams = [champ_code];
        } else {
            query = `SELECT team_code, team_name, brand, team_total_score AS total_score, team_total_time AS total_time FROM v_team_standings`;
        }

        const [rows] = await db.query(query, queryParams);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy chi tiết kết quả qua các chặng của một đội đua
router.get('/teams/:team_code/results', async (req, res) => {
    try {
        const { champ_code } = req.query;
        let query = `
            SELECT r.name AS stage_name, 
            SUM(vp.points) AS total_score,
            SUM(CASE WHEN vp.status = 'Finished' THEN vp.finish_time_seconds ELSE 0 END) AS total_time
            FROM v_race_performance vp
            JOIN RACES r ON vp.race_code = r.race_code
            WHERE vp.team_code = ?
        `;
        let params = [req.params.team_code];
        if (champ_code) {
            query += ' AND r.champ_code = ?';
            params.push(champ_code);
        }
        query += ' GROUP BY r.race_code, r.name, r.start_time ORDER BY r.start_time ASC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// === DATABASE INSPECTOR START ===
// ==========================================
// Lấy thông tin cấu trúc cơ sở dữ liệu (tables, views, triggers, procedures, indexes)
router.get('/db-metadata', async (req, res) => {
    try {
        const [tables] = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'F1_Championship_Management' AND table_type = 'BASE TABLE'");
        const [views] = await db.query("SELECT table_name FROM information_schema.views WHERE table_schema = 'F1_Championship_Management'");
        const [triggers] = await db.query("SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'F1_Championship_Management'");
        const [procedures] = await db.query("SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'F1_Championship_Management' AND routine_type = 'PROCEDURE'");
        const [indexes] = await db.query(`
            SELECT table_name, index_name, column_name 
            FROM information_schema.statistics 
            WHERE table_schema = 'F1_Championship_Management' 
              AND index_name NOT LIKE 'PRIMARY'
              AND index_name NOT LIKE 'fk_%'
              AND index_name NOT LIKE 'col_%'
              AND index_name NOT LIKE 'contract_id'
              AND index_name NOT LIKE 'driver_code'
              AND index_name NOT LIKE 'race_code'
              AND index_name NOT LIKE 'team_code'
              AND index_name NOT LIKE 'sponsor_code'
        `);

        // Group indexes by name to avoid duplicates due to multi-column indexes
        const uniqueIndexes = [];
        const indexNames = new Set();
        indexes.forEach(idx => {
            const tableName = idx.TABLE_NAME || idx.table_name;
            const indexName = idx.INDEX_NAME || idx.index_name;
            const columnName = idx.COLUMN_NAME || idx.column_name;
            const key = `${tableName}-${indexName}`;
            if (!indexNames.has(key)) {
                indexNames.add(key);
                uniqueIndexes.push({
                    table: tableName,
                    name: indexName,
                    column: columnName
                });
            }
        });

        res.json({
            tables: tables.map(t => t.TABLE_NAME || t.table_name),
            views: views.map(v => v.TABLE_NAME || v.table_name),
            triggers: triggers.map(t => ({
                name: t.TRIGGER_NAME || t.trigger_name,
                event: t.EVENT_MANIPULATION || t.event_manipulation,
                table: t.EVENT_OBJECT_TABLE || t.event_object_table
            })),
            procedures: procedures.map(p => p.ROUTINE_NAME || p.routine_name),
            indexes: uniqueIndexes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy dữ liệu mẫu từ một view được chỉ định
router.get('/db-view/:view_name', async (req, res) => {
    const { view_name } = req.params;
    const allowedViews = [
        'v_race_performance', 'v_driver_standings', 'v_team_standings',
        'v_active_contracts', 'v_race_schedule', 'v_team_sponsors',
        'v_race_penalties', 'v_driver_penalties_summary',
        'v_driver_career_summary', 'v_championship_summary'
    ];

    if (!allowedViews.includes(view_name)) {
        return res.status(400).json({ error: 'View không hợp lệ hoặc không được phép truy cập.' });
    }

    try {
        const [rows] = await db.query(`SELECT * FROM ${view_name} LIMIT 50`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ==========================================
// === DATABASE INSPECTOR END ===
// ==========================================

// ============================================================
// 6. OPERATIONS & MANAGEMENT (PROCEDURES, TRIGGERS, VIEWS)
// ============================================================

// Lấy danh sách toàn bộ tay đua
router.get('/drivers', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM DRIVERS ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Thêm mới tay đua (gọi sp_add_driver, kiểm thử trg_check_dob_insert)
router.post('/drivers', async (req, res) => {
    const { driver_code, name, date_of_birth, nationality, biography } = req.body;
    try {
        await db.query('CALL sp_add_driver(?, ?, ?, ?, ?)', [driver_code, name, date_of_birth, nationality, biography]);
        res.json({ success: true, message: 'Tay đua đã được thêm thành công!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Tạo hợp đồng mới (gọi sp_create_contract, kiểm thử trg_single_active_contract)
router.post('/contracts', async (req, res) => {
    const { driver_code, team_code, is_active } = req.body;
    try {
        await db.query('CALL sp_create_contract(?, ?, ?)', [driver_code, team_code, is_active === undefined ? 1 : is_active]);
        res.json({ success: true, message: 'Hợp đồng được tạo thành công!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Hủy kích hoạt hợp đồng (gọi sp_terminate_active_contracts)
router.post('/contracts/terminate', async (req, res) => {
    const { driver_code } = req.body;
    try {
        await db.query('CALL sp_terminate_active_contracts(?)', [driver_code]);
        res.json({ success: true, message: 'Đã hủy kích hoạt tất cả hợp đồng của tay đua!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Chuyển nhượng tay đua (gọi sp_transfer_driver)
router.post('/contracts/transfer', async (req, res) => {
    const { driver_code, team_code } = req.body;
    try {
        await db.query('CALL sp_transfer_driver(?, ?)', [driver_code, team_code]);
        res.json({ success: true, message: 'Chuyển nhượng tay đua thành công!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Lấy hiệu suất tay đua (gọi sp_get_driver_performance)
router.get('/drivers/:driver_code/performance', async (req, res) => {
    try {
        const [result] = await db.query('CALL sp_get_driver_performance(?)', [req.params.driver_code]);
        res.json(result[0][0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy toàn bộ lượt đăng ký chặng đua để gắn án phạt
router.get('/race-entries-all', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT re.entry_id, r.name AS race_name, d.name AS driver_name, t.name AS team_name, r.champ_code
            FROM RACE_ENTRIES re
            JOIN RACES r ON re.race_code = r.race_code
            JOIN CONTRACTS c ON re.contract_id = c.contract_id
            JOIN DRIVERS d ON c.driver_code = d.driver_code
            JOIN TEAMS t ON c.team_code = t.team_code
            ORDER BY r.champ_code DESC, r.start_time DESC, d.name ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Thêm hình phạt mới (gọi sp_add_penalty, kiểm thử trg_validate_penalty_value)
router.post('/penalties', async (req, res) => {
    const { entry_id, type, severity_value, reason } = req.body;
    try {
        await db.query('CALL sp_add_penalty(?, ?, ?, ?)', [entry_id, type, severity_value, reason]);
        res.json({ success: true, message: 'Đã thêm hình phạt thành công!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Lấy danh sách toàn bộ nhà tài trợ
router.get('/sponsors', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM SPONSORS ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Thêm nhà tài trợ mới (gọi sp_add_sponsor)
router.post('/sponsors', async (req, res) => {
    const { sponsor_code, name, industry, description } = req.body;
    try {
        await db.query('CALL sp_add_sponsor(?, ?, ?, ?)', [sponsor_code, name, industry, description]);
        res.json({ success: true, message: 'Đã thêm nhà tài trợ thành công!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Tạo quan hệ tài trợ đội đua (kiểm thử trg_check_sponsorship_years)
router.post('/sponsorships', async (req, res) => {
    const { team_code, sponsor_code, funding_amount, start_year, end_year } = req.body;
    try {
        await db.query(`
            INSERT INTO TEAM_SPONSORSHIPS (team_code, sponsor_code, funding_amount, start_year, end_year)
            VALUES (?, ?, ?, ?, ?)
        `, [team_code, sponsor_code, funding_amount, start_year, end_year]);
        res.json({ success: true, message: 'Đã đăng ký tài trợ thành công!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Thêm mới chặng đua (kiểm thử trg_prevent_negative_laps_race)
router.post('/races', async (req, res) => {
    const { race_code, name, num_laps, location, start_time, champ_code, description } = req.body;
    try {
        await db.query(`
            INSERT INTO RACES (race_code, name, num_laps, location, start_time, champ_code, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [race_code, name, num_laps, location, start_time, champ_code, description]);
        res.json({ success: true, message: 'Đã thêm chặng đua thành công!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Lấy danh sách hợp đồng active từ View v_active_contracts
router.get('/contracts/active', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM v_active_contracts');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy lịch trình từ View v_race_schedule
router.get('/races/schedule', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM v_race_schedule ORDER BY start_time ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy nhà tài trợ đội đua từ View v_team_sponsors
router.get('/sponsors/teams', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM v_team_sponsors ORDER BY team_name ASC, funding_amount DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy lịch sử phạt từ View v_race_penalties
router.get('/penalties/list', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM v_race_penalties ORDER BY severity_value DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy thống kê phạt từ View v_driver_penalties_summary
router.get('/penalties/summary', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM v_driver_penalties_summary ORDER BY total_severity DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy tóm tắt sự nghiệp tay đua từ View v_driver_career_summary
router.get('/standings/drivers/career-summary', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM v_driver_career_summary ORDER BY total_career_points DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy tóm tắt giải vô địch từ View v_championship_summary
router.get('/championships/summary', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM v_championship_summary ORDER BY champ_code DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
