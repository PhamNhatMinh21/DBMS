# 🏎️ F1 Championship Management System (F1 DBMS)

Hệ thống quản lý và giám sát giải đua Formula 1 — ứng dụng web full-stack hiệu năng cao sử dụng kiến trúc **React (Vite) + Express (Node.js) + MySQL**. Dự án được xây dựng dựa trên thiết kế thẩm mỹ cao cấp (Glassmorphism & McLaren Theme), cho phép nhập dữ liệu chặng đua, quản lý đăng ký, tính điểm tự động và giám sát chi tiết cấu trúc dữ liệu theo thời gian thực.

---

## 📋 Mục lục

- [Tổng quan hệ thống](#-tổng-quan-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt & Chạy dự án](#-hướng-dẫn-cài-đặt--chạy-dự-án)
- [Các tính năng chính](#-các-tính-năng-chính)
- [Đặc tả Kiến trúc Database (Mô hình 10x10)](#-đặc-tả-kiến-trúc-database-mô-hình-10x10)
- [Danh sách API Endpoints](#-danh-sách-api-endpoints)

---

## 🌐 Tổng quan hệ thống

Hệ thống hoạt động theo mô hình 3 lớp (3-tier Architecture) đảm bảo phân tách rõ ràng giữa giao diện, logic xử lý và lưu trữ:

```
        +---------------------------+
        |   Giao diện Người dùng    |  ← React + Vite (Cổng 5173)
        +---------------------------+
                      │  Gọi REST API (CORS enabled)
                      ▼
        +---------------------------+
        |     Bộ điều khiển API     |  ← Express Server (Cổng 5000)
        +---------------------------+
                      │  Truy vấn SQL (Connection Pool)
                      ▼
        +---------------------------+
        |    Cơ sở Dữ liệu MySQL    |  ← MySQL Server (Cổng 3306)
        +---------------------------+
```

---

## 🛠️ Công nghệ sử dụng

### 1. Frontend (Giao diện)
- **React 18** — Thư viện xây dựng giao diện người dùng dựa trên component.
- **Vite** — Công cụ build tối ưu hóa HMR (Hot Module Replacement) cho thời gian phản hồi tức thì.
- **React Router Dom** — Định tuyến và điều hướng trang mượt mà không tải lại.
- **Lucide React** — Bộ biểu tượng hiện đại và đồng bộ.
- **Vanilla CSS** — Custom styling theo ngôn ngữ thiết kế Glassmorphism (hiệu ứng kính mờ nghệ thuật) phối hợp gam màu McLaren Papaya Orange làm chủ đạo.

### 2. Backend (Máy chủ API)
- **Node.js** — Môi trường thực thi JavaScript phía máy chủ.
- **Express.js 5** — Framework định tuyến và thiết lập các RESTful API endpoints.
- **mysql2** — Driver MySQL hiệu năng cao hỗ trợ kết nối pool và Prepared Statements chống tấn công SQL Injection.
- **dotenv** — Quản lý biến môi trường bảo mật.

### 3. Database (Cơ sở dữ liệu)
- **MySQL 8.0+** hoặc **MariaDB 10.6+**.
- Kiến trúc cơ sở dữ liệu nâng cao chuẩn hóa bậc 3, gồm đúng:
  - **10 Bảng dữ liệu** (Tables)
  - **10 Khung nhìn** (Views)
  - **10 Trình kích hoạt** (Triggers)
  - **10 Thủ tục lưu trữ** (Stored Procedures)
  - **10 Chỉ mục** (Indexes)

---

## 📁 Cấu trúc thư mục dự án

```
F1ChampionshipDBMS/
│
├── 📂 backend/                       ← Máy chủ REST API (Node.js & Express)
│   ├── 📂 routes/
│   │   └── api.js                     ← Định nghĩa các API endpoints và whitelist View
│   ├── db.js                          ← Khởi tạo Connection Pool kết nối MySQL
│   ├── server.js                      ← Điểm khởi động máy chủ (Port 5000)
│   ├── .env                           ← Cấu hình thông tin kết nối DB (Chạy local)
│   └── package.json
│
├── 📂 frontend/                      ← Ứng dụng client (React + Vite)
│   ├── 📂 public/                     ← Các tệp tĩnh (ảnh nền mclaren-bg.png)
│   ├── 📂 src/
│   │   ├── 📂 pages/                  ← Các trang giao diện chính
│   │   │   ├── RegisterRacing.jsx     ← Đăng ký tay đua thi đấu chặng
│   │   │   ├── UpdateResults.jsx      ← Nhập kết quả cuộc đua chặng
│   │   │   ├── DriverStandings.jsx    ← Bảng xếp hạng tay đua toàn giải
│   │   │   ├── TeamStandings.jsx      ← Bảng xếp hạng đội đua
│   │   │   └── DatabaseInspector.jsx  ← Giám sát & preview dữ liệu DB trực tiếp
│   │   ├── App.jsx                   ← Quản lý Routing và giao diện nền
│   │   ├── main.jsx                  ← Entry point khởi tạo React
│   │   └── index.css                 ← CSS Token và Design System (McLaren Theme)
│   ├── package.json
│   └── vite.config.js
│
├── schema.sql                        ← Script thiết lập CSDL và Dữ liệu mẫu (Seed)
├── GIAI_THICH_CSDL.pdf               ← Tài liệu thuyết minh cơ sở dữ liệu
└── README.md                         ← Đặc tả tài liệu dự án
```

---

## ✅ Yêu cầu hệ thống

Trước khi tiến hành cài đặt, máy tính của bạn cần có sẵn:
- **Node.js** phiên bản **18.0.0** trở lên.
- **MySQL Server** phiên bản **8.0** trở lên (hoặc MariaDB tương đương).
- Trình duyệt web hiện đại hỗ trợ CSS Variables và Backdrop-filter (Chrome, Edge, Safari, Firefox).

---

## 🚀 Hướng dẫn cài đặt & Chạy dự án

### Bước 1 — Thiết lập Cơ sở dữ liệu MySQL

Khởi chạy cơ sở dữ liệu và dữ liệu mẫu từ tệp `schema.sql`. Bạn có thể thực hiện thông qua CLI hoặc MySQL Workbench:

**Sử dụng MySQL CLI:**
```bash
# Nhập mật khẩu root của bạn khi được yêu cầu
mysql -u root -p < schema.sql
```

**Sử dụng MySQL Workbench:**
1. Mở MySQL Workbench.
2. Vào **File** ➜ **Open SQL Script** ➜ Chọn tệp `schema.sql` ở thư mục gốc dự án.
3. Nhấp biểu tượng tia chớp (**Execute**) để chạy toàn bộ script.

> *Script này sẽ tự động tạo cơ sở dữ liệu `F1_Championship_Management`, thiết lập 10 bảng dữ liệu, nạp dữ liệu mẫu hoàn chỉnh cho mùa giải F1-2025 và dữ liệu chờ cho mùa giải F1-2026.*

### Bước 2 — Cấu hình và Chạy Backend

1. Di chuyển vào thư mục `backend/`:
   ```bash
   cd backend
   ```
2. Tạo tệp cấu hình môi trường `.env` bằng cách sao chép tệp mẫu hoặc tự tạo mới với nội dung sau:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=F1_Championship_Management
   DB_PORT=3306
   PORT=5000
   ```
   *Lưu ý: Thay `your_mysql_password` bằng mật khẩu tài khoản MySQL thực tế của bạn.*
3. Cài đặt các gói phụ thuộc và khởi động server:
   ```bash
   npm install
   npm run dev
   ```
   *Khi thành công, terminal sẽ thông báo: `Server is running on port 5000` và `MySQL Connected Successfully`.*

### Bước 3 — Cài đặt và Chạy Frontend

1. Mở một cửa sổ Terminal mới (giữ nguyên Terminal Backend đang chạy).
2. Di chuyển vào thư mục `frontend/`:
   ```bash
   cd ../frontend
   ```
3. Cài đặt các thư viện liên quan và khởi động Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
4. Truy cập liên kết hiển thị trên màn hình: **http://localhost:5173** để mở ứng dụng.

---

## 🎯 Các tính năng chính

### 1. Đồng bộ chọn đa mùa giải (Multi-Season Sync)
Sidebar cho phép lựa chọn linh hoạt giữa các mùa giải (VD: `F1-2025`, `F1-2026`). Việc thay đổi mùa giải sẽ tự động cập nhật lịch trình chặng đua, danh sách hợp đồng tay đua hoạt động, và dữ liệu điểm số xếp hạng hiển thị tương ứng trên toàn bộ ứng dụng.

### 2. Đăng ký đua chặng & Ràng buộc nghiệp vụ (Sync Registration)
Trang đăng ký thi đấu của mỗi chặng kiểm soát chặt chẽ quy định giải đua:
- Mỗi đội đua có tối đa 3 tay đua ký hợp đồng, nhưng chỉ được chọn **tối đa 2 tay đua** thi đấu chính thức cho mỗi chặng.
- Quy tắc này được ràng buộc cứng ở tầng cơ sở dữ liệu bằng **MySQL Trigger**, ngăn chặn mọi hành vi gian lận dữ liệu từ API bên ngoài.

### 3. Nhập kết quả & Tự động tính điểm xếp hạng (Formula 1 Points System)
- Hỗ trợ nhập hàng loạt trạng thái thi đấu của tay đua (`Finished` - Hoàn thành, `DNF` - Lỗi xe bỏ cuộc, `Accident` - Tai nạn), số vòng hoàn thành và thời gian chạy.
- Ngay khi lưu kết quả, hệ thống sẽ tự động gọi **Stored Procedure** để xếp thứ hạng chặng đua dựa trên thời gian thực tế và phân bổ điểm số F1 chuẩn xác (từ hạng 1 đến 10 nhận lần lượt: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1 điểm).

### 4. Giám sát cấu trúc Cơ sở dữ liệu (Database Inspector)
Trang giám sát chuyên sâu cung cấp cái nhìn trực quan về bên trong CSDL:
- **Thống kê tổng số lượng**: Hiển thị chính xác số lượng của 5 nhóm thực thể chính (10 Bảng, 10 Khung nhìn, 10 Kích hoạt, 10 Thủ tục, 10 Chỉ mục) bằng giao diện Glassmorphism trực quan.
- **Combo Box chọn View & Xem trước Dữ liệu**: Người dùng có thể chọn bất kỳ Khung nhìn (View) nào từ một hộp chọn thả xuống (có ghi kèm tên giải thích tiếng Việt). Dữ liệu thực tế của view đó (tối đa 50 dòng mới nhất) sẽ lập tức được tải lên và hiển thị dưới dạng bảng dữ liệu cuộn ngang/dọc bên dưới.
- **Việt hóa & Đồng bộ Phông chữ**: Toàn bộ nhãn kỹ thuật đều đi kèm diễn giải tiếng Việt thân thiện trong ngoặc đơn, đồng thời sử dụng thống nhất phông chữ Sans-serif hệ thống (`Inter`) mang lại vẻ ngoài cao cấp và đồng bộ.

---

## 🗄️ Đặc tả Kiến trúc Database (Mô hình 10x10)

Hệ thống được thiết kế với số lượng thực thể cốt lõi cân bằng ở con số 10 nhằm tối ưu hóa hiệu năng và phục vụ kiểm thử:

### 1. Danh sách 10 Bảng dữ liệu (Tables)
1. `CHAMPIONSHIPS`: Quản lý các mùa giải thi đấu.
2. `TEAMS`: Thông tin các đội đua tham gia.
3. `DRIVERS`: Hồ sơ chi tiết của các tay đua F1.
4. `CONTRACTS`: Quản lý hợp đồng chuyển nhượng giữa tay đua và đội đua.
5. `RACES`: Danh sách các chặng đua của mùa giải.
6. `RACE_ENTRIES`: Lượt đăng ký tham gia chặng đua cụ thể của các tay đua.
7. `RESULTS`: Lưu trữ kết quả thi đấu, trạng thái và điểm số của từng chặng.
8. `SPONSORS`: Danh mục các tập đoàn tài trợ.
9. `TEAM_SPONSORSHIPS`: Chi tiết tài trợ tài chính của các nhà tài trợ cho các đội đua.
10. `PENALTIES`: Danh sách ghi nhận các hình phạt/lỗi vi phạm trong cuộc đua.

### 2. Danh sách 10 Khung nhìn (Views)
1. `v_race_performance`: Chi tiết hiệu suất chạy chặng (thời gian chạy, điểm số, vòng hoàn thành).
2. `v_driver_standings`: Bảng xếp hạng tay đua toàn giải đấu theo điểm số lũy kế.
3. `v_team_standings`: Bảng xếp hạng đội đua (cộng dồn điểm của các tay đua thuộc đội).
4. `v_active_contracts`: Danh sách các hợp đồng tay đua đang có hiệu lực.
5. `v_race_schedule`: Lịch thi đấu chi tiết của các chặng đua kết hợp thông tin mùa giải.
6. `v_team_sponsors`: Thống kê chi tiết các nhà tài trợ và tổng kinh phí của các đội đua.
7. `v_race_penalties`: Chi tiết các hình phạt được áp dụng trong chặng đua.
8. `v_driver_penalties_summary`: Tổng hợp số lần phạt và tổng điểm phạt lũy kế của mỗi tay đua.
9. `v_driver_career_summary`: Thống kê tổng số chặng đua, điểm số sự nghiệp của các tay đua.
10. `v_championship_summary`: Thống kê tổng quan số chặng, số đội đua và tay đua tham dự mỗi mùa giải.

### 3. Danh sách 10 Trình kích hoạt (Triggers)
1. `trg_limit_2_riders`: Giới hạn tối đa 2 tay đua chính thức cho mỗi đội ở một chặng.
2. `trg_check_time_insert`: Đảm bảo thời gian kết thúc phải lớn hơn thời gian xuất phát khi thêm kết quả.
3. `trg_check_time_update`: Đảm bảo thời gian kết thúc phải lớn hơn thời gian xuất phát khi sửa kết quả.
4. `trg_limit_laps_completed_insert`: Ngăn chặn số vòng đua hoàn thành vượt quá số vòng tối đa của chặng khi thêm.
5. `trg_limit_laps_completed_update`: Ngăn chặn số vòng đua hoàn thành vượt quá số vòng tối đa của chặng khi sửa.
6. `trg_single_active_contract`: Ràng buộc một tay đua chỉ được phép có duy nhất 1 hợp đồng kích hoạt tại một thời điểm.
7. `trg_validate_penalty_value`: Đảm bảo điểm phạt vi phạm không được phép là số âm.
8. `trg_check_dob_insert`: Kiểm tra ngày sinh của tay đua đăng ký mới không được ở tương lai.
9. `trg_prevent_negative_laps_race`: Ràng buộc số vòng đua của một chặng được tạo mới phải lớn hơn 0.
10. `trg_check_sponsorship_years`: Đảm bảo năm bắt đầu tài trợ phải nhỏ hơn hoặc bằng năm kết thúc.

### 4. Danh sách 10 Thủ tục lưu trữ (Stored Procedures)
1. `sp_calculate_points`: Tự động tính điểm xếp hạng F1 cho các tay đua hoàn thành chặng.
2. `sp_add_driver`: Thêm mới tay đua kèm kiểm tra tính hợp lệ của ngày sinh.
3. `sp_create_contract`: Tạo mới hợp đồng tay đua và tự động giải phóng hợp đồng cũ đang hoạt động.
4. `sp_register_race_entry`: Đăng ký lượt tham gia chặng đua cho tay đua.
5. `sp_add_penalty`: Ghi nhận hình phạt chặng cho tay đua.
6. `sp_add_sponsor`: Thêm nhà tài trợ mới vào hệ thống.
7. `sp_get_driver_performance`: Thống kê tổng hợp số chặng đã tham gia, số lần thắng, số lần DNF của một tay đua.
8. `sp_get_team_drivers`: Lấy danh sách toàn bộ tay đua đã và đang ký hợp đồng của một đội đua cụ thể.
9. `sp_terminate_active_contracts`: Chấm dứt nhanh toàn bộ hợp đồng đang hoạt động của một tay đua.
10. `sp_transfer_driver`: Thực hiện nghiệp vụ chuyển nhượng tay đua sang đội mới (gọi liên đới procedure 9 và procedure 3).

### 5. Danh sách 10 Chỉ mục (Indexes)
1. `idx_race_code`: Trên bảng `RACE_ENTRIES(race_code)` giúp tăng tốc lọc đăng ký theo chặng.
2. `idx_team_code_contracts`: Trên bảng `CONTRACTS(team_code, driver_code)` tối ưu hóa truy vấn chuyển nhượng.
3. `idx_results_status_time`: Trên bảng `RESULTS(status, end_time)` hỗ trợ xếp hạng chặng nhanh chóng.
4. `idx_races_start_time`: Trên bảng `RACES(start_time)` tăng tốc sắp xếp lịch thi đấu chặng.
5. `idx_races_champ_code`: Trên bảng `RACES(champ_code)` tối ưu bộ lọc chặng đua theo mùa giải.
6. `idx_drivers_nationality`: Trên bảng `DRIVERS(nationality)` tăng tốc độ tìm kiếm tay đua theo quốc gia.
7. `idx_contracts_is_active`: Trên bảng `CONTRACTS(is_active)` tối ưu hóa truy vấn lọc các hợp đồng đang hiệu lực.
8. `idx_drivers_name`: Trên bảng `DRIVERS(name)` hỗ trợ tìm kiếm nhanh hồ sơ tay đua theo tên.
9. `idx_penalties_entry`: Trên bảng `PENALTIES(entry_id)` tối ưu tìm lỗi phạt của tay đua trong chặng.
10. `idx_team_sponsorships_yr`: Trên bảng `TEAM_SPONSORSHIPS(start_year, end_year)` tối ưu lọc nhà tài trợ theo năm hoạt động.

---

## 🌐 Danh sách API Endpoints

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| **GET** | `/api/db-metadata` | Lấy toàn bộ danh sách cấu trúc metadata (10 tables, 10 views, 10 triggers, 10 procedures, 10 indexes). |
| **GET** | `/api/db-view/:view_name` | Truy vấn lấy tối đa 50 bản ghi dữ liệu thực tế của một Khung nhìn cụ thể (có kiểm tra whitelist). |
| **GET** | `/api/championships` | Lấy danh sách các mùa giải F1 hiện có. |
| **GET** | `/api/teams` | Lấy danh sách các đội đua tham gia. |
| **GET** | `/api/races` | Lấy danh sách các chặng đua (hỗ trợ lọc theo `champ_code`). |
| **GET** | `/api/standings/drivers` | Lấy bảng xếp hạng tay đua lũy kế (hỗ trợ lọc theo chặng `stage` hoặc mùa giải `champ_code`). |
| **GET** | `/api/standings/teams` | Lấy bảng xếp hạng đội đua tương ứng. |
| **GET** | `/api/drivers/:driver_code/results` | Lấy lịch sử chi tiết thành tích các chặng đua đã tham gia của một tay đua. |
| **POST** | `/api/races/results` | Lưu trữ kết quả thi đấu hàng loạt cho một chặng đua và kích hoạt procedure tính điểm xếp hạng. |

---

*Dự án thuộc học phần Hệ Quản Trị Cơ Sở Dữ Liệu — Nhóm 6 — Học viện Công nghệ Bưu chính Viễn thông (PTIT)*
