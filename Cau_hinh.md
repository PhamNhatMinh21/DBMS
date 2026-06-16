# 🚀 HƯỚNG DẪN CẤU HÌNH & TỐI ƯU HÓA HỆ QUẢN TRỊ CSDL MYSQL SERVER

Tài liệu này hướng dẫn chi tiết cách cấu hình nâng cao hệ thống MySQL Server phục vụ cho các bài toán kiểm thử chịu tải lớn (Load Testing), tối ưu hóa phần cứng và thiết lập cơ chế tự động hóa bảo trì.

---

## 📂 MỤC LỤC
1. [Cấu Hình RAM & Kết Nối (Bộ Não Hệ Thống)](#1-cấu-hình-ram--kết-nối-bộ-não-hệ-thống)
2. [Kích Hoạt Sức Mạnh Phần Cứng (CPU & SSD)](#2-kích-hoạt-sức-mạnh-phần-cứng-cpu--ssd)
3. [Nhật Ký (Logging) & Tự Động Dọn Dẹp Rác](#3-nhật-ký-logging--tự-động-dọn-dẹp-rác)
4. [Chiến Lược Sao Lưu Tự Động (Backup Autopilot)](#4-chiến-lược-sao-lưu-tự-động-backup-autopilot)
5. [Hướng Dẫn Giả Lập Chịu Tải Cao (Load Testing)](#5-hướng-dẫn-giả-lập-chịu-tải-cao-load-testing)

---

## 1. Cấu Hình RAM & Kết Nối (Bộ Não Hệ Thống)

### 📌 `innodb_buffer_pool_size` (Vùng Đệm Dữ Liệu)
* **Công dụng là gì:** Ép MySQL load toàn bộ các bảng dữ liệu và chỉ mục (Index) từ ổ cứng lên RAM để xử lý với tốc độ ánh sáng, giảm thiểu tối đa việc đọc/ghi ổ đĩa chậm chạp.
* **Mặc định có gì:** `128M` (Mức tối thiểu an toàn cho máy cấu hình yếu).
* **Cách setup:** Mở file `my.ini` (`C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`), sửa dòng:
  ```ini
  innodb_buffer_pool_size = 10G
  ```
* **Cách test và xem ở đâu:** Mở MySQL Workbench, chạy câu lệnh SQL để xem kết quả thực tế trên RAM:
  ```sql
  SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
  ```
  -- Kết quả mong đợi: 10737418240 (tương đương 10GB tính bằng Byte)

### 📌 `max_connections` (Giới Hạn Kết Nối)
* **Công dụng là gì:** Quy định số lượng cổng/slot tối đa cho phép các ứng dụng Backend kết nối vào MySQL tại cùng một thời điểm.
* **Mặc định có gì:** 151 (Trong đó 150 slot cho ứng dụng, 1 slot dự phòng cho quyền root vào cứu hộ khi nghẽn mạch).
* **Cách setup:** Sửa hoặc thêm vào file my.ini:
  ```ini
  max_connections = 1000
  ```
* **Cách test và xem ở đâu:** Vào MySQL Workbench chạy câu lệnh:
  ```sql
  SHOW VARIABLES LIKE 'max_connections';
  ```
  -- Kết quả mong đợi: 1000

---

## 2. Kích Hoạt Sức Mạnh Phần Cứng (CPU & SSD)

### 📌 `innodb_buffer_pool_instances` (Phân Vùng Bộ Nhớ Đệm)
* **Công dụng là gì:** Chia nhỏ vùng RAM đệm 10GB ở trên thành 8 phần độc lập để các nhân CPU của máy tính lao vào xử lý song song, tránh tình trạng tranh chấp tài nguyên bộ nhớ.
* **Mặc định có gì:** 1 (Mọi luồng xử lý phải xếp hàng chung một hàng đợi RAM).
* **Cách setup:** Thêm vào file my.ini:
  ```ini
  innodb_buffer_pool_instances = 8
  ```
* **Cách test và xem ở đâu:** Vào MySQL Workbench chạy câu lệnh:
  ```sql
  SHOW VARIABLES LIKE 'innodb_buffer_pool_instances';
  ```
  -- Kết quả mong đợi: 8

### 📌 `innodb_io_capacity` & `innodb_io_capacity_max` (Băng Thông SSD)
* **Công dụng là gì:** Mở rộng hạn mức tốc độ đọc ghi dữ liệu ngẫu nhiên (IOPS) xuống ổ đĩa, tận dụng tối đa sức mạnh của ổ cứng thể rắn SSD.
* **Mặc định có gì:** 200 (Bị giới hạn ở tốc độ quay của ổ cứng HDD cơ học thời cổ đại).
* **Cách setup:** Thêm vào file my.ini:
  ```ini
  innodb_io_capacity = 2000
  innodb_io_capacity_max = 4000
  ```
* **Cách test và xem ở đâu:** Vào MySQL Workbench chạy câu lệnh:
  ```sql
  SHOW VARIABLES LIKE 'innodb_io_capacity%';
  ```
  -- Kết quả mong đợi: Dòng capacity hiện 2000, dòng max hiện 4000

---

## 3. Nhật Ký (Logging) & Tự Động Dọn Dẹp Rác

### 📌 `general_log` (Nhật Ký Kết Nối Toàn Diện)
* **Công dụng là gì:** Ghi lại mọi lịch sử hành vi truy cập hệ thống (Ai kết nối, lúc nào, chạy câu lệnh gì) để phục vụ debug và giám sát an ninh.
* **Mặc định có gì:** OFF (Tắt để tiết kiệm dung lượng đĩa).
* **Cách setup:** Sửa hoặc thêm vào file my.ini:
  ```ini
  general-log = 1
  general_log_file = "ASUSVIVOBOOK14X.log"
  ```
* **Cách test và xem ở đâu:**
  1. Chạy lệnh kiểm tra trạng thái:
     ```sql
     SHOW VARIABLES LIKE 'general_log';
     ```
     -> Kết quả báo ON.
  2. Xem log ở đâu: Vào thư mục `C:\ProgramData\MySQL\MySQL Server 8.0\Data\`, tìm mở file văn bản tên là `ASUSVIVOBOOK14X.log` để xem lịch sử gõ lệnh.

### 📌 `slow_query_log` (Nhật Ký Bắt Quả Tang Câu Lệnh Chậm)
* **Công dụng là gì:** Tự động gom toàn bộ những câu lệnh truy vấn chạy tốn thời gian vượt quá hạn mức quy định vào một file riêng để lập trình viên tối ưu Index.
* **Mặc định có gì:** OFF (Hạn mức mặc định nếu bật là 10 giây).
* **Cách setup:** Thêm vào file my.ini để ép hạn mức xuống còn 2 giây:
  ```ini
  slow-query-log = 1
  slow_query_log_file = "ASUSVIVOBOOK14X-slow.log"
  long_query_time = 2
  ```
* **Cách test và xem ở đâu:**
  1. Chạy lệnh kiểm tra:
     ```sql
     SHOW VARIABLES LIKE 'slow_query_log';
     ```
     -> Kết quả báo ON.
  2. Xem log ở đâu: Thử chạy một lệnh nặng hoặc đợi ứng dụng chạy, vào thư mục Data mở file `ASUSVIVOBOOK14X-slow.log`. Nếu file trống trơn nghĩa là không có câu lệnh nào chạy quá 2 giây (Hệ thống tối ưu tốt).

### 📌 `wait_timeout` (Tự Động Đuổi Kết Nối Treo)
* **Công dụng là gì:** Tự động ngắt các kết nối từ Backend mở ra xong để đấy không làm gì (trạng thái Sleep), giải phóng slot cho người khác, tránh nghẽn rác bộ nhớ.
* **Mặc định có gì:** 28800 giây (Tương đương 8 tiếng - quá lâu).
* **Cách setup:** Thêm vào file my.ini để hạ thời gian chờ xuống 2 phút:
  ```ini
  wait_timeout = 120
  interactive_timeout = 120
  ```
* **Cách test và xem ở đâu:** Chạy lệnh kiểm tra:
  ```sql
  SHOW VARIABLES LIKE 'wait_timeout';
  ```
  -- Kết quả mong đợi: 120

---

## 4. Chiến Lược Sao Lưu Tự Động (Backup Autopilot)

### 📌 `mysqldump` & Lên Lịch Tự Động Bằng Windows
* **Công dụng là gì:** Xuất toàn bộ cấu trúc bảng và dữ liệu thành một file .sql sao lưu dự phòng. Nếu code lỗi phá hỏng DB hoặc máy sập nguồn, bạn dùng file này để khôi phục (Restore) lại nguyên vẹn dữ liệu.
* **Mặc định có gì:** Không có lịch tự động, lập trình viên phải tự gõ tay bằng lệnh CMD.
* **Cách setup:**
  1. Tạo thư mục `C:\MySQL_Backups`.
  2. Mở Notepad, dán đoạn mã lệnh Script dưới đây vào (Thay MậtKhẩu và TênDB của bạn):
     ```bat
     @echo off
     set backup_name=db_backup_%date:~10,4%-%date:~4,2%-%date:~7,2%.sql
     "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u root -pMậtKhẩu TênDB > "C:\MySQL_Backups\%backup_name%"
     forfiles /p "C:\MySQL_Backups" /s /m *.sql /d -7 /c "cmd /c del @path"
     ```
  3. Lưu file với tên `auto_backup.bat` bỏ vào thư mục `C:\MySQL_Backups`.
  4. Mở phần mềm Windows Task Scheduler của Windows lên, đặt một lịch hẹn giờ kích hoạt file .bat này chạy hàng ngày vào lúc 2:00 AM đêm.
* **Cách test và xem ở đâu:**
  1. Vào thư mục `C:\MySQL_Backups`, click đúp chuột trái chạy trực tiếp file `auto_backup.bat`.
  2. Xem kết quả ở đâu: Thư mục sẽ ngay lập tức đẻ ra một file mới dạng `db_backup_2026-06-16.sql` có dung lượng lớn hơn 0 KB. Qua ngày thứ 8, file của ngày thứ 1 sẽ tự biến mất để dọn đĩa.

---

## 5. Hướng Dẫn Giả Lập Chịu Tải Cao (Load Testing)

Để kiểm định sức mạnh tổng hợp của toàn bộ các cấu hình "khủng" (10GB RAM, 1000 Connections, 8 Instances) vừa thiết lập, chúng ta tiến hành giả lập hàng nghìn lượt truy cập bằng công cụ Artillery.

### 🛠️ Các bước thực hiện:
1. Mở Command Prompt (CMD), gõ lệnh cài đặt công cụ:
   ```bash
   npm install -g artillery
   ```
2. Tạo file kịch bản `test-tai.yml` bằng Notepad với nội dung gửi request liên tục trong 1 phút xuống API Backend:
   ```yaml
   config:
     target: "http://localhost:8080" # Đường dẫn API Backend của bạn
     phases:
       - duration: 60
         arrivalRate: 20             # Mỗi giây thả thêm 20 người dùng mới vào phá trận
   scenarios:
     - name: "Khách hàng truy vấn dữ liệu"
       flow:
         - get:
             url: "/api/products"    # API có gọi kết nối xuống MySQL
   ```
3. Chạy lệnh bắn tải từ CMD:
   ```bash
   artillery run test-tai.yml
   ```

### 🔍 Kết Quả Mong Đợi (Kiểm tra ở đâu?):
* **Kiểm tra kết nối trực tiếp:** Trong lúc tool đang chạy bắn tải, mở một tab query trong MySQL Workbench và chạy lệnh:
  ```sql
  SHOW STATUS LIKE 'Threads_connected';
  ```
  *Kết quả mong đợi:* Con số nhảy vọt lên hàng trăm kết nối đồng thời nhưng MySQL hoạt động cực kỳ vững vàng, không bị treo hay sập nguồn.
* **Kiểm tra báo cáo lỗi:** Khi Artillery kết thúc bài test 60 giây, nhìn vào màn hình CMD dòng tổng kết `Errors: 0` và tất cả HTTP Response trả về đều là mã thành công `2xx`.
* **Kiểm tra file Slow Log:** Mở file `ASUSVIVOBOOK14X-slow.log` ra xem. Nếu file trống trơn, chứng tỏ nhờ có vùng đệm 10GB RAM gánh tải, tất cả hàng nghìn câu lệnh truy cập dồn dập đều được tính toán xong xuôi trong tích tắc dưới 2 giây!