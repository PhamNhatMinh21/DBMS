DROP DATABASE IF EXISTS F1_Championship_Management;
CREATE DATABASE F1_Championship_Management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE F1_Championship_Management;

SET SQL_SAFE_UPDATES = 0;

CREATE TABLE CHAMPIONSHIPS (
    champ_code  VARCHAR(10)  PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE TEAMS (
    team_code   VARCHAR(10)  PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    brand       VARCHAR(100),
    owner       VARCHAR(100),
    description TEXT
);

CREATE TABLE DRIVERS (
    driver_code   VARCHAR(10)  PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    nationality   VARCHAR(50),
    biography     TEXT
);

CREATE TABLE CONTRACTS (
    contract_id INT          AUTO_INCREMENT PRIMARY KEY,
    driver_code VARCHAR(10),
    team_code   VARCHAR(10),
    is_active   TINYINT      DEFAULT 1,
    FOREIGN KEY (driver_code) REFERENCES DRIVERS(driver_code),
    FOREIGN KEY (team_code)   REFERENCES TEAMS(team_code)
);

CREATE TABLE RACES (
    race_code    VARCHAR(10)  PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    num_laps     INT          NOT NULL,
    location     VARCHAR(255),
    start_time   DATETIME(3),
    champ_code   VARCHAR(10),
    description  TEXT,
    FOREIGN KEY (champ_code) REFERENCES CHAMPIONSHIPS(champ_code)
);

CREATE TABLE RACE_ENTRIES (
    entry_id    INT AUTO_INCREMENT PRIMARY KEY,
    race_code   VARCHAR(10),
    contract_id INT,
    FOREIGN KEY (race_code)   REFERENCES RACES(race_code),
    FOREIGN KEY (contract_id) REFERENCES CONTRACTS(contract_id),
    UNIQUE(race_code, contract_id)
);

CREATE TABLE RESULTS (
    entry_id       INT PRIMARY KEY,
    end_time       DATETIME(3),
    laps_completed INT,
    status         ENUM('Finished', 'DNF', 'Accident') DEFAULT 'Finished',
    points         INT DEFAULT 0,
    FOREIGN KEY (entry_id) REFERENCES RACE_ENTRIES(entry_id),
    CONSTRAINT chk_laps_completed CHECK (laps_completed >= 0),
    CONSTRAINT chk_points         CHECK (points >= 0)
);

CREATE TABLE SPONSORS (
    sponsor_code VARCHAR(10)  PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    industry     VARCHAR(50),
    description  TEXT
);

CREATE TABLE TEAM_SPONSORSHIPS (
    sponsorship_id INT AUTO_INCREMENT PRIMARY KEY,
    team_code      VARCHAR(10),
    sponsor_code   VARCHAR(10),
    funding_amount DECIMAL(15,2),
    start_year     INT,
    end_year       INT,
    FOREIGN KEY (team_code)    REFERENCES TEAMS(team_code),
    FOREIGN KEY (sponsor_code) REFERENCES SPONSORS(sponsor_code)
);

CREATE TABLE PENALTIES (
    penalty_id     INT AUTO_INCREMENT PRIMARY KEY,
    entry_id       INT,
    type           VARCHAR(50),
    severity_value INT,
    reason         VARCHAR(255),
    is_applied     TINYINT DEFAULT 1,
    FOREIGN KEY (entry_id) REFERENCES RACE_ENTRIES(entry_id)
);


-- ============================================================
-- 1. TRÌNH KÍCH HOẠT (10 TRIGGERS)
-- ============================================================
DELIMITER //

-- Trigger 1: Giới hạn 2 tay đua/đội/chặng
CREATE TRIGGER trg_limit_2_riders
BEFORE INSERT ON RACE_ENTRIES
FOR EACH ROW
BEGIN
    DECLARE v_team_id VARCHAR(10);
    DECLARE v_count INT;
    SELECT team_code INTO v_team_id FROM CONTRACTS WHERE contract_id = NEW.contract_id;
    SELECT COUNT(*) INTO v_count FROM RACE_ENTRIES re
    JOIN CONTRACTS c ON re.contract_id = c.contract_id
    WHERE re.race_code = NEW.race_code AND c.team_code = v_team_id;
    IF v_count >= 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Mỗi đội chỉ được tối đa 2 tay đua tham gia mỗi chặng!';
    END IF;
END //

-- Trigger 2: Kiểm tra thời gian hoàn thành
CREATE TRIGGER trg_check_time_insert
BEFORE INSERT ON RESULTS
FOR EACH ROW
BEGIN
    DECLARE v_start_time DATETIME(3);
    IF NEW.status = 'Finished' AND NEW.end_time IS NOT NULL THEN
        SELECT r.start_time INTO v_start_time
        FROM RACE_ENTRIES re JOIN RACES r ON re.race_code = r.race_code
        WHERE re.entry_id = NEW.entry_id;
        IF NEW.end_time <= v_start_time THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Lỗi CSDL: Thời gian kết thúc phải LỚN HƠN thời gian bắt đầu chặng!';
        END IF;
    END IF;
END //

-- Trigger 3: Kiểm tra thời gian hoàn thành
CREATE TRIGGER trg_check_time_update
BEFORE UPDATE ON RESULTS
FOR EACH ROW
BEGIN
    DECLARE v_start_time DATETIME(3);
    IF NEW.status = 'Finished' AND NEW.end_time IS NOT NULL THEN
        SELECT r.start_time INTO v_start_time
        FROM RACE_ENTRIES re JOIN RACES r ON re.race_code = r.race_code
        WHERE re.entry_id = NEW.entry_id;
        IF NEW.end_time <= v_start_time THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Lỗi CSDL: Thời gian kết thúc phải LỚN HƠN thời gian bắt đầu chặng!';
        END IF;
    END IF;
END //

-- Trigger 4: Kiểm tra giới hạn vòng đua
CREATE TRIGGER trg_limit_laps_completed_insert
BEFORE INSERT ON RESULTS
FOR EACH ROW
BEGIN
    DECLARE v_max_laps INT;
    SELECT r.num_laps INTO v_max_laps
    FROM RACE_ENTRIES re JOIN RACES r ON re.race_code = r.race_code
    WHERE re.entry_id = NEW.entry_id;
    IF NEW.laps_completed > v_max_laps THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Số vòng hoàn thành không được lớn hơn tổng số vòng của chặng!';
    END IF;
END //

-- Trigger 5: Kiểm tra giới hạn vòng đua
CREATE TRIGGER trg_limit_laps_completed_update
BEFORE UPDATE ON RESULTS
FOR EACH ROW
BEGIN
    DECLARE v_max_laps INT;
    SELECT r.num_laps INTO v_max_laps
    FROM RACE_ENTRIES re JOIN RACES r ON re.race_code = r.race_code
    WHERE re.entry_id = NEW.entry_id;
    IF NEW.laps_completed > v_max_laps THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Số vòng hoàn thành không được lớn hơn tổng số vòng của chặng!';
    END IF;
END //

-- Trigger 6: Ràng buộc duy nhất 1 hợp đồng hoạt động
CREATE TRIGGER trg_single_active_contract
BEFORE INSERT ON CONTRACTS
FOR EACH ROW
BEGIN
    DECLARE v_active_count INT;
    IF NEW.is_active = 1 THEN
        SELECT COUNT(*) INTO v_active_count FROM CONTRACTS 
        WHERE driver_code = NEW.driver_code AND is_active = 1;
        IF v_active_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Lỗi CSDL: Một tay đua không thể có nhiều hơn 1 hợp đồng đang hoạt động!';
        END IF;
    END IF;
END //

-- Trigger 7: Kiểm tra giá trị phạt không âm
CREATE TRIGGER trg_validate_penalty_value
BEFORE INSERT ON PENALTIES
FOR EACH ROW
BEGIN
    IF NEW.severity_value < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Giá trị hình phạt không được là số âm!';
    END IF;
END //

-- Trigger 8: Kiểm tra ngày sinh
CREATE TRIGGER trg_check_dob_insert
BEFORE INSERT ON DRIVERS
FOR EACH ROW
BEGIN
    IF NEW.date_of_birth > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Ngày sinh không thể nằm ở tương lai!';
    END IF;
END //

-- Trigger 9: Ngăn chặn số vòng đua âm
CREATE TRIGGER trg_prevent_negative_laps_race
BEFORE INSERT ON RACES
FOR EACH ROW
BEGIN
    IF NEW.num_laps <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Số lượng vòng đua của chặng phải lớn hơn 0!';
    END IF;
END //

-- Trigger 10: Kiểm tra năm tài trợ
CREATE TRIGGER trg_check_sponsorship_years
BEFORE INSERT ON TEAM_SPONSORSHIPS
FOR EACH ROW
BEGIN
    IF NEW.start_year > NEW.end_year THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Năm bắt đầu tài trợ không được lớn hơn năm kết thúc!';
    END IF;
END //

-- Trigger 11: Kiểm tra không để trống thông tin tay đua
CREATE TRIGGER trg_check_driver_empty
BEFORE INSERT ON DRIVERS
FOR EACH ROW
BEGIN
    IF TRIM(NEW.driver_code) = '' OR NEW.driver_code IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Mã tay đua không được để trống hoặc chỉ chứa khoảng trắng!';
    END IF;
    IF TRIM(NEW.name) = '' OR NEW.name IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Tên tay đua không được để trống hoặc chỉ chứa khoảng trắng!';
    END IF;
    IF TRIM(NEW.nationality) = '' OR NEW.nationality IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Quốc tịch tay đua không được để trống hoặc chỉ chứa khoảng trắng!';
    END IF;
END //

-- Trigger 12: Kiểm tra không để trống thông tin đội đua
CREATE TRIGGER trg_check_team_empty
BEFORE INSERT ON TEAMS
FOR EACH ROW
BEGIN
    IF TRIM(NEW.team_code) = '' OR NEW.team_code IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Mã đội đua không được để trống hoặc chỉ chứa khoảng trắng!';
    END IF;
    IF TRIM(NEW.name) = '' OR NEW.name IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Tên đội đua không được để trống hoặc chỉ chứa khoảng trắng!';
    END IF;
END //

-- Trigger 13: Kiểm tra không để trống thông tin chặng đua
CREATE TRIGGER trg_check_race_empty
BEFORE INSERT ON RACES
FOR EACH ROW
BEGIN
    IF TRIM(NEW.race_code) = '' OR NEW.race_code IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Mã chặng đua không được để trống hoặc chỉ chứa khoảng trắng!';
    END IF;
    IF TRIM(NEW.name) = '' OR NEW.name IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Tên chặng đua không được để trống hoặc chỉ chứa khoảng trắng!';
    END IF;
    IF TRIM(NEW.location) = '' OR NEW.location IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Địa điểm chặng đua không được để trống hoặc chỉ chứa khoảng trắng!';
    END IF;
END //

-- Trigger 14: Kiểm tra không để trống thông tin nhà tài trợ
CREATE TRIGGER trg_check_sponsor_empty
BEFORE INSERT ON SPONSORS
FOR EACH ROW
BEGIN
    IF TRIM(NEW.sponsor_code) = '' OR NEW.sponsor_code IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Mã nhà tài trợ không được để trống hoặc chỉ chứa khoảng trắng!';
    END IF;
    IF TRIM(NEW.name) = '' OR NEW.name IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Tên nhà tài trợ không được để trống hoặc chỉ chứa khoảng trắng!';
    END IF;
END //

-- Trigger 15: Kiểm tra không để trống thông tin hình phạt
CREATE TRIGGER trg_check_penalty_empty
BEFORE INSERT ON PENALTIES
FOR EACH ROW
BEGIN
    IF TRIM(NEW.type) = '' OR NEW.type IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi CSDL: Loại hình phạt không được để trống hoặc chỉ chứa khoảng trắng!';
    END IF;
END //

DELIMITER ;


-- ============================================================
-- 2. THỦ TỤC LƯU TRỮ (10 PROCEDURES)
-- ============================================================
DELIMITER //

-- Procedure 1: Tính điểm chặng tự động
CREATE PROCEDURE sp_calculate_points(IN p_race_code VARCHAR(10))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE RESULTS res
    JOIN RACE_ENTRIES re ON res.entry_id = re.entry_id
    SET res.points = 0
    WHERE re.race_code = p_race_code;

    UPDATE RESULTS target
    JOIN (
        SELECT res.entry_id,
        RANK() OVER (ORDER BY TIMESTAMPDIFF(MICROSECOND, r.start_time, res.end_time) ASC) AS pos
        FROM RESULTS res
        JOIN RACE_ENTRIES re ON res.entry_id = re.entry_id
        JOIN RACES r ON re.race_code = r.race_code
        WHERE re.race_code = p_race_code AND res.status = 'Finished'
    ) rnk ON target.entry_id = rnk.entry_id
    SET target.points = CASE
        WHEN rnk.pos = 1  THEN 25  WHEN rnk.pos = 2  THEN 18
        WHEN rnk.pos = 3  THEN 15  WHEN rnk.pos = 4  THEN 12
        WHEN rnk.pos = 5  THEN 10  WHEN rnk.pos = 6  THEN 8
        WHEN rnk.pos = 7  THEN 6   WHEN rnk.pos = 8  THEN 4
        WHEN rnk.pos = 9  THEN 2   WHEN rnk.pos = 10 THEN 1
        ELSE 0
    END;

    COMMIT;
END //

-- Procedure 2: Thêm mới tay đua
CREATE PROCEDURE sp_add_driver(
    IN p_driver_code VARCHAR(10),
    IN p_name VARCHAR(100),
    IN p_dob DATE,
    IN p_nationality VARCHAR(50),
    IN p_biography TEXT
)
BEGIN
    IF p_dob > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Ngày sinh không thể nằm ở tương lai!';
    ELSE
        INSERT INTO DRIVERS VALUES (p_driver_code, p_name, p_dob, p_nationality, p_biography);
    END IF;
END //

-- Procedure 3: Tạo hợp đồng mới
CREATE PROCEDURE sp_create_contract(
    IN p_driver_code VARCHAR(10),
    IN p_team_code VARCHAR(10),
    IN p_is_active TINYINT
)
BEGIN
    IF p_is_active = 1 THEN
        UPDATE CONTRACTS SET is_active = 0 WHERE driver_code = p_driver_code AND is_active = 1;
    END IF;
    INSERT INTO CONTRACTS (driver_code, team_code, is_active) VALUES (p_driver_code, p_team_code, p_is_active);
END //

-- Procedure 4: Đăng ký tham gia chặng đua
CREATE PROCEDURE sp_register_race_entry(
    IN p_race_code VARCHAR(10),
    IN p_contract_id INT
)
BEGIN
    INSERT INTO RACE_ENTRIES (race_code, contract_id) VALUES (p_race_code, p_contract_id);
END //

-- Procedure 5: Thêm hình phạt
CREATE PROCEDURE sp_add_penalty(
    IN p_entry_id INT,
    IN p_type VARCHAR(50),
    IN p_severity INT,
    IN p_reason VARCHAR(255)
)
BEGIN
    INSERT INTO PENALTIES (entry_id, type, severity_value, reason, is_applied) 
    VALUES (p_entry_id, p_type, p_severity, p_reason, 1);
END //

-- Procedure 6: Thêm nhà tài trợ mới
CREATE PROCEDURE sp_add_sponsor(
    IN p_sponsor_code VARCHAR(10),
    IN p_name VARCHAR(100),
    IN p_industry VARCHAR(50),
    IN p_description TEXT
)
BEGIN
    INSERT INTO SPONSORS VALUES (p_sponsor_code, p_name, p_industry, p_description);
END //

-- Procedure 7: Lấy hiệu suất tay đua
CREATE PROCEDURE sp_get_driver_performance(IN p_driver_code VARCHAR(10))
BEGIN
    SELECT 
        d.name,
        COUNT(res.entry_id) AS total_races,
        SUM(res.points) AS total_points,
        SUM(CASE WHEN res.points = 25 THEN 1 ELSE 0 END) AS total_wins,
        SUM(CASE WHEN res.status = 'DNF' THEN 1 ELSE 0 END) AS total_dnfs
    FROM DRIVERS d
    LEFT JOIN CONTRACTS c ON d.driver_code = c.driver_code
    LEFT JOIN RACE_ENTRIES re ON c.contract_id = re.contract_id
    LEFT JOIN RESULTS res ON re.entry_id = res.entry_id
    WHERE d.driver_code = p_driver_code
    GROUP BY d.driver_code, d.name;
END //

-- Procedure 8: Lấy danh sách tay đua của đội
CREATE PROCEDURE sp_get_team_drivers(IN p_team_code VARCHAR(10))
BEGIN
    SELECT DISTINCT c.contract_id, d.driver_code, d.name, d.nationality, c.is_active
    FROM DRIVERS d
    JOIN CONTRACTS c ON d.driver_code = c.driver_code
    WHERE c.team_code = p_team_code
    ORDER BY c.is_active DESC, d.name ASC;
END //

-- Procedure 9: Chấm dứt hợp đồng hiện tại
CREATE PROCEDURE sp_terminate_active_contracts(IN p_driver_code VARCHAR(10))
BEGIN
    UPDATE CONTRACTS SET is_active = 0 WHERE driver_code = p_driver_code AND is_active = 1;
END //

-- Procedure 10: Chuyển tay đua sang đội mới
CREATE PROCEDURE sp_transfer_driver(
    IN p_driver_code VARCHAR(10),
    IN p_new_team_code VARCHAR(10)
)
BEGIN
    CALL sp_terminate_active_contracts(p_driver_code);
    CALL sp_create_contract(p_driver_code, p_new_team_code, 1);
END //

DELIMITER ;


-- ============================================================
-- 3. KHUNG NHÌN (10 VIEWS)
-- ============================================================

-- View 1: v_race_performance
CREATE VIEW v_race_performance AS
SELECT re.race_code, c.driver_code, c.team_code, res.status,
       res.laps_completed, res.points,
       TIMESTAMPDIFF(MICROSECOND, r.start_time, res.end_time) / 1000000 AS finish_time_seconds,
       r.start_time AS race_start_time,
       r.champ_code
FROM RESULTS res
JOIN RACE_ENTRIES re ON res.entry_id = re.entry_id
JOIN RACES r ON re.race_code = r.race_code
JOIN CONTRACTS c ON re.contract_id = c.contract_id;

-- View 2: v_driver_standings 
CREATE VIEW v_driver_standings AS
SELECT
    d.driver_code, d.name, d.nationality, t.name AS team_name,
    SUM(v.points) AS total_score,
    SUM(CASE WHEN v.status = 'Finished' THEN v.finish_time_seconds ELSE 0 END) AS total_season_time
FROM DRIVERS d
JOIN v_race_performance v ON v.driver_code = d.driver_code
JOIN TEAMS t ON v.team_code = t.team_code
WHERE v.champ_code = (SELECT champ_code FROM CHAMPIONSHIPS ORDER BY champ_code DESC LIMIT 1)
GROUP BY d.driver_code, d.name, d.nationality, t.name
ORDER BY total_score DESC, total_season_time ASC;

-- View 3: v_team_standings 
CREATE VIEW v_team_standings AS
SELECT
    t.team_code, t.name AS team_name, t.brand,
    SUM(v.points) AS team_total_score,
    SUM(CASE WHEN v.status = 'Finished' THEN v.finish_time_seconds ELSE 0 END) AS team_total_time
FROM TEAMS t
JOIN v_race_performance v ON v.team_code = t.team_code
WHERE v.champ_code = (SELECT champ_code FROM CHAMPIONSHIPS ORDER BY champ_code DESC LIMIT 1)
GROUP BY t.team_code, t.name, t.brand
ORDER BY team_total_score DESC, team_total_time ASC;

-- View 4: v_active_contracts 
CREATE VIEW v_active_contracts AS
SELECT c.contract_id, d.driver_code, d.name AS driver_name, t.team_code, t.name AS team_name
FROM CONTRACTS c
JOIN DRIVERS d ON c.driver_code = d.driver_code
JOIN TEAMS t ON c.team_code = t.team_code
WHERE c.is_active = 1;

-- View 5: v_race_schedule 
CREATE VIEW v_race_schedule AS
SELECT r.race_code, r.name AS race_name, ch.name AS championship_name, 
       r.location, r.start_time
FROM RACES r
JOIN CHAMPIONSHIPS ch ON r.champ_code = ch.champ_code;

-- View 6: v_team_sponsors 
CREATE VIEW v_team_sponsors AS
SELECT t.team_code, t.name AS team_name, s.name AS sponsor_name, s.industry, ts.funding_amount
FROM TEAM_SPONSORSHIPS ts
JOIN TEAMS t ON ts.team_code = t.team_code
JOIN SPONSORS s ON ts.sponsor_code = s.sponsor_code;

-- View 7: v_race_penalties 
CREATE VIEW v_race_penalties AS
SELECT r.race_code, r.name AS race_name, d.name AS driver_name, t.name AS team_name, 
       p.type AS penalty_type, p.severity_value, p.reason
FROM PENALTIES p
JOIN RACE_ENTRIES re ON p.entry_id = re.entry_id
JOIN RACES r ON re.race_code = r.race_code
JOIN CONTRACTS c ON re.contract_id = c.contract_id
JOIN DRIVERS d ON c.driver_code = d.driver_code
JOIN TEAMS t ON c.team_code = t.team_code;

-- View 8: v_driver_penalties_summary 
CREATE VIEW v_driver_penalties_summary AS
SELECT d.driver_code, d.name AS driver_name, COUNT(p.penalty_id) AS total_penalties, SUM(p.severity_value) AS total_severity
FROM PENALTIES p
JOIN RACE_ENTRIES re ON p.entry_id = re.entry_id
JOIN CONTRACTS c ON re.contract_id = c.contract_id
JOIN DRIVERS d ON c.driver_code = d.driver_code
GROUP BY d.driver_code, d.name;

-- View 9: v_driver_career_summary
CREATE VIEW v_driver_career_summary AS
SELECT d.driver_code, d.name, d.nationality, 
       COUNT(DISTINCT re.race_code) AS total_races_entered,
       SUM(res.points) AS total_career_points,
       SUM(CASE WHEN res.status = 'Finished' THEN 1 ELSE 0 END) AS total_finishes
FROM DRIVERS d
LEFT JOIN CONTRACTS c ON d.driver_code = c.driver_code
LEFT JOIN RACE_ENTRIES re ON c.contract_id = re.contract_id
LEFT JOIN RESULTS res ON re.entry_id = res.entry_id
GROUP BY d.driver_code, d.name, d.nationality;

-- View 10: v_championship_summary
CREATE VIEW v_championship_summary AS
SELECT ch.champ_code, ch.name AS championship_name,
       COUNT(DISTINCT r.race_code) AS total_races,
       COUNT(DISTINCT c.team_code) AS total_participating_teams,
       COUNT(DISTINCT c.driver_code) AS total_participating_drivers
FROM CHAMPIONSHIPS ch
LEFT JOIN RACES r ON ch.champ_code = r.champ_code
LEFT JOIN RACE_ENTRIES re ON r.race_code = re.race_code
LEFT JOIN CONTRACTS c ON re.contract_id = c.contract_id
GROUP BY ch.champ_code, ch.name;


-- ============================================================
-- 4. CHỈ MỤC (10 INDEXES)
-- ============================================================

CREATE INDEX idx_race_code            ON RACE_ENTRIES(race_code);
CREATE INDEX idx_team_code_contracts   ON CONTRACTS(team_code, driver_code);
CREATE INDEX idx_results_status_time   ON RESULTS(status, end_time);
CREATE INDEX idx_races_start_time      ON RACES(start_time);
CREATE INDEX idx_races_champ_code      ON RACES(champ_code);

CREATE INDEX idx_drivers_nationality  ON DRIVERS(nationality);
CREATE INDEX idx_contracts_is_active  ON CONTRACTS(is_active);
CREATE INDEX idx_drivers_name         ON DRIVERS(name);
CREATE INDEX idx_penalties_entry      ON PENALTIES(entry_id);
CREATE INDEX idx_team_sponsorships_yr ON TEAM_SPONSORSHIPS(start_year, end_year);


-- ============================================================
-- 5. DỮ LIỆU MẪU
-- ============================================================

-- Mùa giải
INSERT INTO CHAMPIONSHIPS VALUES
    ('F1-2025', 'Formula 1 Season 2025', NULL),
    ('F1-2026', 'Formula 1 Season 2026', NULL);

-- Đội đua
INSERT INTO TEAMS VALUES
    ('RBR', 'Red Bull Racing',   'Red Bull',  'Christian Horner', 'Đội đua xuất sắc nhất thập kỷ'),
    ('FER', 'Scuderia Ferrari',  'Ferrari',   'Fred Vasseur',     'Đội đua lâu đời nhất F1'),
    ('MER', 'Mercedes-AMG',     'Mercedes',  'Toto Wolff',       'Silver Arrows huyền thoại'),
    ('MCL', 'McLaren',           'McLaren',   'Zak Brown',        'Papaya Power'),
    ('ALP', 'Alpine F1 Team',    'Renault',   'Oliver Oakes',     'Đội đua của Pháp'),
    ('AST', 'Aston Martin',      'Mercedes',  'Lawrence Stroll',  'Đội đua xanh lá');

-- Tay đua
INSERT INTO DRIVERS VALUES
    ('VER', 'Max Verstappen',        '1997-09-30', 'Dutch',       '4x World Champion, số 1 thập kỷ'),
    ('NOR', 'Lando Norris',          '1999-11-13', 'British',     'McLaren số 1 — đang ở đỉnh phong độ'),
    ('PIA', 'Oscar Piastri',         '2001-04-06', 'Australian',  'Tài năng trẻ xuất sắc của McLaren'),
    ('LEC', 'Charles Leclerc',       '1997-10-16', 'Monegasque',  'Biểu tượng Ferrari — quê hương Monaco'),
    ('SAI', 'Carlos Sainz',          '1994-09-01', 'Spanish',     'Il Matador — chắc chắn, nhất quán'),
    ('HAM', 'Lewis Hamilton',        '1985-01-07', 'British',     '7x World Champion — huyền thoại F1'),
    ('RUS', 'George Russell',        '1998-02-15', 'British',     'Mr. Saturday — xuất sắc trong qualifying'),
    ('ALO', 'Fernando Alonso',       '1981-07-29', 'Spanish',     '2x World Champion — vẫn thi đấu ở tuổi 44'),
    ('STR', 'Lance Stroll',          '1998-10-29', 'Canadian',    'Con trai ông chủ Aston Martin'),
    ('GAS', 'Pierre Gasly',          '1996-02-07', 'French',      'Cựu tay đua Red Bull — trụ cột Alpine'),
    ('PER', 'Sergio Perez',          '1990-01-26', 'Mexican',     'Checo — Wing man hoàn hảo của Verstappen'),
    ('BEA', 'Oliver Bearman',        '2005-05-08', 'British',     'Tài năng trẻ người Anh — tương lai F1'),
    ('LAW', 'Liam Lawson',           '2002-02-11', 'New Zealander','Người thay thế Perez tại Red Bull 2026'),
    ('OWA', 'Pato O''Ward',          '1999-05-06', 'Mexican',     'Ngôi sao IndyCar chuyển sang F1 cùng Alpine'),
    ('ANT', 'Kimi Antonelli',        '2006-08-25', 'Italian',     'Người kế thừa Hamilton tại Mercedes 2025'),
    ('ZHO', 'Zhou Guanyu',           '1999-05-30', 'Chinese',     'Tay đua người Trung Quốc — reserve McLaren'),
    ('DEV', 'Jack Doohan',           '2003-01-05', 'Australian',  'Học viên Alpine — reserve Alpine 2026'),
    ('HUL', 'Nico Hulkenberg',       '1987-08-19', 'German',      'Tay đua kỳ cựu — reserve Aston Martin');

-- Hợp đồng mùa 2025
INSERT INTO CONTRACTS (driver_code, team_code, is_active) VALUES
    ('VER', 'RBR', 0), ('PER', 'RBR', 0),
    ('LEC', 'FER', 0), ('SAI', 'FER', 0),
    ('HAM', 'MER', 0), ('RUS', 'MER', 0),
    ('NOR', 'MCL', 0), ('PIA', 'MCL', 0),
    ('GAS', 'ALP', 0),
    ('ALO', 'AST', 0), ('STR', 'AST', 0);

-- Hợp đồng mùa 2026
INSERT INTO CONTRACTS (driver_code, team_code, is_active) VALUES
    ('VER', 'RBR', 1), ('LAW', 'RBR', 1), ('PER', 'RBR', 1),
    ('HAM', 'FER', 1), ('LEC', 'FER', 1), ('SAI', 'FER', 1),
    ('RUS', 'MER', 1), ('BEA', 'MER', 1), ('ANT', 'MER', 1),
    ('NOR', 'MCL', 1), ('PIA', 'MCL', 1), ('ZHO', 'MCL', 1),
    ('GAS', 'ALP', 1), ('OWA', 'ALP', 1), ('DEV', 'ALP', 1),
    ('ALO', 'AST', 1), ('STR', 'AST', 1), ('HUL', 'AST', 1);

-- Chặng đua mùa 2025
INSERT INTO RACES VALUES
    ('BHR25',    'Bahrain Grand Prix',      57, 'Sakhir, Bahrain',     '2025-03-02 15:00:00.000', 'F1-2025', 'Season Opener 2025'),
    ('JED25',    'Saudi Arabian Grand Prix',50, 'Jeddah, Saudi Arabia','2025-03-16 17:00:00.000', 'F1-2025', 'Night Race'),
    ('AUS25',    'Australian Grand Prix',   58, 'Melbourne, Australia','2025-03-30 15:00:00.000', 'F1-2025', 'Albert Park Circuit'),
    ('JAP25',    'Japanese Grand Prix',     53, 'Suzuka, Japan',       '2025-04-06 14:00:00.000', 'F1-2025', 'Suzuka Classic'),
    ('CHN25',    'Chinese Grand Prix',      56, 'Shanghai, China',     '2025-04-20 08:00:00.000', 'F1-2025', 'Shanghai International'),
    ('MIA25',    'Miami Grand Prix',        57, 'Miami, USA',          '2025-05-04 20:00:00.000', 'F1-2025', 'Hard Rock Stadium'),
    ('MONACO25', 'Monaco Grand Prix',       78, 'Monte Carlo, Monaco', '2025-05-25 15:00:00.000', 'F1-2025', 'Jewel of the Crown'),
    ('SPA25',    'Spanish Grand Prix',      66, 'Barcelona, Spain',    '2025-06-01 15:00:00.000', 'F1-2025', 'Circuit de Catalunya');

-- Chặng đua mùa 2026
INSERT INTO RACES VALUES
    ('BHR26',    'Bahrain Grand Prix',      57, 'Sakhir, Bahrain',     '2026-03-05 15:00:00.000', 'F1-2026', 'Season Opener 2026'),
    ('JED26',    'Saudi Arabian Grand Prix',50, 'Jeddah, Saudi Arabia','2026-03-19 17:00:00.000', 'F1-2026', 'Night Race 2026'),
    ('AUS26',    'Australian Grand Prix',   58, 'Melbourne, Australia','2026-04-06 15:00:00.000', 'F1-2026', 'Albert Park'),
    ('MONACO26', 'Monaco Grand Prix',       78, 'Monte Carlo, Monaco', '2026-05-24 15:00:00.000', 'F1-2026', 'Jewel of the Crown 2026'),
    ('SPA26',    'Spanish Grand Prix',      66, 'Barcelona, Spain',    '2026-06-07 15:00:00.000', 'F1-2026', 'Circuit de Catalunya');

-- Đăng ký tất cả chặng mùa 2025
INSERT INTO RACE_ENTRIES (race_code, contract_id) VALUES
    ('BHR25',1),('BHR25',2),('BHR25',3),('BHR25',4),('BHR25',5),('BHR25',6),('BHR25',7),('BHR25',8),('BHR25',9),('BHR25',10),('BHR25',11),
    ('JED25',1),('JED25',2),('JED25',3),('JED25',4),('JED25',5),('JED25',6),('JED25',7),('JED25',8),('JED25',9),('JED25',10),('JED25',11),
    ('AUS25',1),('AUS25',2),('AUS25',3),('AUS25',4),('AUS25',5),('AUS25',6),('AUS25',7),('AUS25',8),('AUS25',9),('AUS25',10),('AUS25',11),
    ('JAP25',1),('JAP25',2),('JAP25',3),('JAP25',4),('JAP25',5),('JAP25',6),('JAP25',7),('JAP25',8),('JAP25',9),('JAP25',10),('JAP25',11),
    ('CHN25',1),('CHN25',2),('CHN25',3),('CHN25',4),('CHN25',5),('CHN25',6),('CHN25',7),('CHN25',8),('CHN25',9),('CHN25',10),('CHN25',11),
    ('MIA25',1),('MIA25',2),('MIA25',3),('MIA25',4),('MIA25',5),('MIA25',6),('MIA25',7),('MIA25',8),('MIA25',9),('MIA25',10),('MIA25',11),
    ('MONACO25',1),('MONACO25',2),('MONACO25',3),('MONACO25',4),('MONACO25',5),('MONACO25',6),('MONACO25',7),('MONACO25',8),('MONACO25',9),('MONACO25',10),('MONACO25',11),
    ('SPA25',1),('SPA25',2),('SPA25',3),('SPA25',4),('SPA25',5),('SPA25',6),('SPA25',7),('SPA25',8),('SPA25',9),('SPA25',10),('SPA25',11);

-- Kết quả mùa 2025
-- BHR25: NOR P1, PIA P2, VER P3, LEC P4, HAM P5, RUS P6, SAI P7, ALO P8, STR P9 | GAS ACC, PER DNF
INSERT INTO RESULTS VALUES
( 1, '2025-03-02 16:37:12.000', 57, 'Finished', 0),
( 2, NULL,                       12, 'DNF',       0),
( 3, '2025-03-02 16:37:28.000', 57, 'Finished', 0),
( 4, '2025-03-02 16:38:02.000', 57, 'Finished', 0),
( 5, '2025-03-02 16:37:45.000', 57, 'Finished', 0),
( 6, '2025-03-02 16:37:58.000', 57, 'Finished', 0),
( 7, '2025-03-02 16:36:45.000', 57, 'Finished', 0),
( 8, '2025-03-02 16:36:58.000', 57, 'Finished', 0),
( 9, NULL,                       44, 'Accident',  0),
(10, '2025-03-02 16:38:18.000', 57, 'Finished', 0),
(11, '2025-03-02 16:38:35.000', 57, 'Finished', 0);

-- JED25: VER P1, HAM P2, NOR P3, LEC P4, PIA P5, RUS P6, SAI P7, ALO P8, STR P9 | GAS ACC, PER DNF
INSERT INTO RESULTS VALUES
(12, '2025-03-16 18:30:22.000', 50, 'Finished', 0),
(13, NULL,                       18, 'DNF',       0),
(14, '2025-03-16 18:31:12.000', 50, 'Finished', 0),
(15, '2025-03-16 18:32:02.000', 50, 'Finished', 0),
(16, '2025-03-16 18:30:38.000', 50, 'Finished', 0),
(17, '2025-03-16 18:31:45.000', 50, 'Finished', 0),
(18, '2025-03-16 18:30:55.000', 50, 'Finished', 0),
(19, '2025-03-16 18:31:28.000', 50, 'Finished', 0),
(20, NULL,                       30, 'Accident',  0),
(21, '2025-03-16 18:32:18.000', 50, 'Finished', 0),
(22, '2025-03-16 18:32:35.000', 50, 'Finished', 0);

-- AUS25: PIA P1, NOR P2, VER P3, LEC P4, HAM P5, SAI P6, RUS P7, ALO P8, GAS P9 | STR DNF, PER ACC
INSERT INTO RESULTS VALUES
(23, '2025-03-30 16:27:48.000', 58, 'Finished', 0),
(24, NULL,                       12, 'Accident',  0),
(25, '2025-03-30 16:28:05.000', 58, 'Finished', 0),
(26, '2025-03-30 16:28:38.000', 58, 'Finished', 0),
(27, '2025-03-30 16:28:22.000', 58, 'Finished', 0),
(28, '2025-03-30 16:28:55.000', 58, 'Finished', 0),
(29, '2025-03-30 16:27:32.000', 58, 'Finished', 0),
(30, '2025-03-30 16:27:15.000', 58, 'Finished', 0),
(31, '2025-03-30 16:29:28.000', 58, 'Finished', 0),
(32, '2025-03-30 16:29:12.000', 58, 'Finished', 0),
(33, NULL,                       25, 'DNF',       0);

-- JAP25: VER P1, NOR P2, PIA P3, HAM P4, LEC P5, RUS P6, SAI P7, ALO P8, GAS P9 | STR DNF, PER ACC
INSERT INTO RESULTS VALUES
(34, '2025-04-06 15:22:33.000', 53, 'Finished', 0),
(35, NULL,                        0, 'Accident',  0),
(36, '2025-04-06 15:23:40.000', 53, 'Finished', 0),
(37, '2025-04-06 15:24:13.000', 53, 'Finished', 0),
(38, '2025-04-06 15:23:23.000', 53, 'Finished', 0),
(39, '2025-04-06 15:23:57.000', 53, 'Finished', 0),
(40, '2025-04-06 15:22:50.000', 53, 'Finished', 0),
(41, '2025-04-06 15:23:07.000', 53, 'Finished', 0),
(42, '2025-04-06 15:24:47.000', 53, 'Finished', 0),
(43, '2025-04-06 15:24:30.000', 53, 'Finished', 0),
(44, NULL,                       28, 'DNF',       0);

-- CHN25: NOR P1, PIA P2, VER P3, LEC P4, SAI P5, HAM P6, RUS P7, ALO P8, STR P9 | GAS DNF, PER ACC
INSERT INTO RESULTS VALUES
(45, '2025-04-20 09:33:14.000', 56, 'Finished', 0),
(46, NULL,                        0, 'Accident',  0),
(47, '2025-04-20 09:33:31.000', 56, 'Finished', 0),
(48, '2025-04-20 09:33:48.000', 56, 'Finished', 0),
(49, '2025-04-20 09:34:04.000', 56, 'Finished', 0),
(50, '2025-04-20 09:34:21.000', 56, 'Finished', 0),
(51, '2025-04-20 09:32:41.000', 56, 'Finished', 0),
(52, '2025-04-20 09:32:58.000', 56, 'Finished', 0),
(53, NULL,                       11, 'DNF',       0),
(54, '2025-04-20 09:34:37.000', 56, 'Finished', 0),
(55, '2025-04-20 09:34:54.000', 56, 'Finished', 0);

-- MIA25: NOR P1, PIA P2, HAM P3, LEC P4, VER P5, RUS P6, SAI P7, ALO P8, GAS P9, STR P10 | PER DNF
INSERT INTO RESULTS VALUES
(56, '2025-05-04 21:33:07.000', 57, 'Finished', 0),
(57, NULL,                       22, 'DNF',       0),
(58, '2025-05-04 21:32:50.000', 57, 'Finished', 0),
(59, '2025-05-04 21:33:40.000', 57, 'Finished', 0),
(60, '2025-05-04 21:32:33.000', 57, 'Finished', 0),
(61, '2025-05-04 21:33:23.000', 57, 'Finished', 0),
(62, '2025-05-04 21:32:00.000', 57, 'Finished', 0),
(63, '2025-05-04 21:32:17.000', 57, 'Finished', 0),
(64, '2025-05-04 21:34:30.000', 57, 'Finished', 0),
(65, '2025-05-04 21:33:57.000', 57, 'Finished', 0),
(66, '2025-05-04 21:34:13.000', 57, 'Finished', 0);

-- MONACO25: LEC P1, NOR P2, VER P3, PIA P4, HAM P5, RUS P6, SAI P7, ALO P8, GAS P9 | STR DNF, PER DNF
INSERT INTO RESULTS VALUES
(67, '2025-05-25 16:47:03.000', 78, 'Finished', 0),
(68, NULL,                       22, 'DNF',       0),
(69, '2025-05-25 16:46:30.000', 78, 'Finished', 0),
(70, '2025-05-25 16:48:10.000', 78, 'Finished', 0),
(71, '2025-05-25 16:47:37.000', 78, 'Finished', 0),
(72, '2025-05-25 16:47:53.000', 78, 'Finished', 0),
(73, '2025-05-25 16:46:47.000', 78, 'Finished', 0),
(74, '2025-05-25 16:47:20.000', 78, 'Finished', 0),
(75, '2025-05-25 16:48:43.000', 78, 'Finished', 0),
(76, '2025-05-25 16:48:27.000', 78, 'Finished', 0),
(77, NULL,                       35, 'DNF',       0);

-- SPA25: NOR P1, VER P2, PIA P3, LEC P4, HAM P5, RUS P6, SAI P7, ALO P8, GAS P9 | STR DNF, PER ACC
INSERT INTO RESULTS VALUES
(78, '2025-06-01 16:34:50.000', 66, 'Finished', 0),
(79, NULL,                        8, 'Accident',  0),
(80, '2025-06-01 16:35:23.000', 66, 'Finished', 0),
(81, '2025-06-01 16:36:13.000', 66, 'Finished', 0),
(82, '2025-06-01 16:35:40.000', 66, 'Finished', 0),
(83, '2025-06-01 16:35:57.000', 66, 'Finished', 0),
(84, '2025-06-01 16:34:33.000', 66, 'Finished', 0),
(85, '2025-06-01 16:35:07.000', 66, 'Finished', 0),
(86, '2025-06-01 16:36:47.000', 66, 'Finished', 0),
(87, '2025-06-01 16:36:30.000', 66, 'Finished', 0),
(88, NULL,                       40, 'DNF',       0);

-- Nhà tài trợ (SPONSORS)
INSERT INTO SPONSORS VALUES
    ('ORACLE', 'Oracle Corporation', 'Technology', 'Cloud technology and database giant sponsoring Red Bull.'),
    ('PETRONAS', 'Petronas', 'Oil & Gas', 'Malaysian energy company sponsoring Mercedes-AMG.'),
    ('SANTANDER', 'Banco Santander', 'Banking', 'Spanish financial services group sponsoring Scuderia Ferrari.'),
    ('TAGHEUER', 'TAG Heuer', 'Luxury Goods', 'Swiss luxury watchmaker sponsoring Red Bull Racing.'),
    ('PIRELLI', 'Pirelli', 'Automotive', 'Italian multinational tyre manufacturer, sole tyre provider of F1.'),
    ('SHELL', 'Shell plc', 'Oil & Gas', 'British multinational oil and gas company sponsoring Scuderia Ferrari.');

-- Hợp đồng tài trợ đội đua (TEAM_SPONSORSHIPS)
INSERT INTO TEAM_SPONSORSHIPS (team_code, sponsor_code, funding_amount, start_year, end_year) VALUES
    ('RBR', 'ORACLE', 100000000.00, 2022, 2026),
    ('RBR', 'TAGHEUER', 30000000.00, 2016, 2026),
    ('MER', 'PETRONAS', 75000000.00, 2010, 2026),
    ('FER', 'SANTANDER', 60000000.00, 2021, 2025),
    ('FER', 'SHELL', 40000000.00, 1996, 2026);

-- Hình phạt (PENALTIES)
-- Seed một vài hình phạt mẫu cho chặng đua năm 2025
INSERT INTO PENALTIES (entry_id, type, severity_value, reason, is_applied) VALUES
    (2,  'DNF Penalty',  0, 'Unsafe release during pit stop', 1),
    (9,  'Time Penalty', 5, 'Causing a collision with Perez', 1),
    (31, 'Time Penalty', 10, 'Track limits warnings exceeded', 1);

-- Tính điểm toàn bộ mùa 2025
CALL sp_calculate_points('BHR25');
CALL sp_calculate_points('JED25');
CALL sp_calculate_points('AUS25');
CALL sp_calculate_points('JAP25');
CALL sp_calculate_points('CHN25');
CALL sp_calculate_points('MIA25');
CALL sp_calculate_points('MONACO25');
CALL sp_calculate_points('SPA25');
