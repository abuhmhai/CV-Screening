# TalentFlow — PHP 7.4, HTML và MySQL

Ứng dụng chính nằm trong `apps/php`. PHP MVC + PDO phục vụ trang HTML và API tại cùng một origin. Giao diện dùng CSS và JavaScript thuần. FastAPI giữ phần trích xuất/chấm CV; hàng đợi và thông báo dùng MySQL. Chạy bản này không cần Next.js, NestJS, Node, Redis, Celery hoặc MinIO.

## Chạy trên máy Windows hiện tại

Từ thư mục gốc:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev-php.ps1
```

Mở **http://localhost:8080**. Script dùng PHP 7.4.33, MySQL 8.4.11 và Python 3.11 trong `.tools` trên máy này; tạo database mới khi chưa có cấu hình, áp dụng migration và seed mà không đặt lại tài khoản hiện có. MySQL portable lắng nghe loopback ở cổng **33306**; AI ở **8000**. Dừng bằng Ctrl+C. Script chỉ dừng các tiến trình nó khởi động, không dừng MySQL/AI đã chạy từ trước.

| Vai trò | Email | Mật khẩu demo ban đầu |
| --- | --- | --- |
| Ứng viên | candidate@demo.local | Demo@12345 |
| Nhà tuyển dụng | recruiter@demo.local | Demo@12345 |
| Quản trị viên | admin@demo.local | Demo@12345 |

Database demo `cvscreening_php` có hồ sơ tiếng Việt, kỹ năng, kinh nghiệm, học vấn, dự án, PDF CV, CV dựng sẵn, đơn ứng tuyển, công ty, tin tuyển dụng, 36 việc làm tổng hợp và hội thoại. Đây là dữ liệu mới được tạo theo yêu cầu; không phải dữ liệu PostgreSQL cũ. Seed chỉ thêm dữ liệu thiếu. Mật khẩu thật và JWT secret nằm trong `.env` bị git bỏ qua.

`-NoAi` bỏ khởi động AI, `-NoWorker` bỏ worker; chấm điểm có fallback PHP nhưng trích xuất PDF/DOCX cần AI. Không dùng mật khẩu demo hoặc tài khoản MySQL root không mật khẩu cho máy công khai. PHP 7.4 được chọn theo yêu cầu của dự án; bản này hướng tới demo local.

## Cài bằng XAMPP hoặc máy khác

1. Cài PHP **7.4**, MySQL **8.0.16+** (đã kiểm tra bằng 8.4), Python **3.11** và Composer 2.2.
2. Bật `pdo_mysql`, `pdo_pgsql`, `mbstring`, `curl`, `fileinfo`, `openssl`, `gd`, `zip`, DOM. `pdo_pgsql` chỉ cần khi nhập dữ liệu cũ.
3. Tạo database UTF-8, copy `.env.example` thành `.env`, điền `DB_DSN`, `DB_USER`, `DB_PASSWORD`; tạo `JWT_SECRET` ngẫu nhiên tối thiểu 32 ký tự. Đặt `SEED_PASSWORD` nếu cần tài khoản demo.
4. Chạy:

```powershell
cd apps/php
composer install --no-dev
php bin/console.php migrate
php bin/console.php seed
```

5. Ở `apps/ai-service`, cài `pip install -r requirements-local.txt`, đặt `CACHE_DRIVER=file` rồi chạy `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`.
6. Từ gốc repo, chạy script trên, hoặc chạy riêng:

```powershell
php apps/php/bin/console.php worker
php -S 127.0.0.1:8080 -t apps/php/public apps/php/public/router.php
```

Với Apache, đặt DocumentRoot vào **apps/php/public**, bật mod_rewrite và AllowOverride; tham khảo `apache-vhost.example.conf`. Chỉ thư mục `public` được web truy cập trực tiếp. File upload lưu ngoài webroot trong `storage/files` và được kiểm tra quyền khi tải. `storage` phải ghi được bởi tài khoản chạy PHP. MySQL 5.7/MariaDB không được hỗ trợ bởi DDL hiện tại.

## Kiến trúc và chức năng

- `public/index.php` → router → controller → service/PDO → view HTML.
- Domain gồm **35 bảng**, giữ UUID, khóa ngoại, giá trị enum, JSON, DECIMAL, BIGINT và thời gian UTC từ Prisma. Các bảng bổ sung phục vụ session, task, presence, typing và file metadata.
- JWT access/refresh có session phía server và thu hồi khi logout; cookie HttpOnly, CSRF cho thao tác ghi, kiểm tra vai trò và thành viên công ty. Form đăng nhập có rate limit.
- Hồ sơ, kỹ năng, kinh nghiệm, học vấn, chứng nhận, dự án, ảnh, CV PDF/DOCX, chọn CV chính, gợi ý điền hồ sơ, checklist và insight.
- Công việc nội bộ, tìm kiếm/lọc/phân trang, lưu việc, công ty/follow, job alert, đơn ứng tuyển, chấm AI, lịch phỏng vấn, offer, CSV tuyển dụng và analytics.
- Feed, bình luận/reply, chín loại reaction, follow, kết nối/chặn, quyền riêng tư và quản trị báo cáo.
- Chat dùng polling 2 giây, thông báo 3 giây; cursor gồm thời gian + UUID, chống trùng, typing hết hạn, presence và trạng thái đọc. Không cần WebSocket.
- CV builder có tạo/sửa/xóa và xuất PDF Unicode bằng Dompdf. Mục tiêu, giao diện và tùy chọn thông báo dùng các khóa localStorage cũ; trang Goals có xuất/nhập JSON để chuyển sang origin mới.
- Worker có claim task bằng `FOR UPDATE SKIP LOCKED`, lease và retry tối đa ba lần; việc làm tổng hợp có crawler bốn nguồn, lịch nửa giờ và dữ liệu mẫu khi nguồn không truy cập được.

Inventory: `database/legacy-pages.json` ghi 35 đường dẫn trang cũ; `database/legacy-routes.json` ghi 125 HTTP route cũ. Kiểm tra tự động đối chiếu sự hiện diện của route; điều đó không chứng minh mọi response/UI giống bản cũ từng chi tiết. HTML đã khôi phục token thiết kế, bố cục trang và tương tác từ mã giao diện cũ; đã kiểm tra Chrome trên desktop/mobile. Chưa có so sánh ảnh từng pixel với runtime React. Xem [phạm vi và kiểm tra](../../docs/php-migration.md).

## Chuyển PostgreSQL và file cũ

Hiện chưa có PostgreSQL hoặc kho file nguồn trên máy để chuyển. Khi có dữ liệu thật:

1. Dừng ghi từ bản cũ, backup PostgreSQL, MySQL đích và kho file. Dùng database MySQL đích riêng cho lần chuyển đầu; không nhập đè dữ liệu demo nếu muốn tránh trùng username/email/slug.
2. Điền `SOURCE_PG_DSN`, `SOURCE_PG_USER`, `SOURCE_PG_PASSWORD`, `SOURCE_STORAGE_ROOT` trong `.env`; dùng tài khoản PostgreSQL chỉ đọc. Không gửi mật khẩu qua chat.
3. Chuẩn bị manifest JSON cho file; `path` là đường dẫn tuyệt đối dưới `SOURCE_STORAGE_ROOT`, `oldUrl` khớp URL cũ trong database, `key` là đường dẫn tương đối mới. CV phải PRIVATE và có `ownerId` là UUID người sở hữu:

```json
[
  {
    "oldUrl": "http://localhost:4000/api/v1/files/cv/old.pdf",
    "path": "C:/old-storage/cv/old.pdf",
    "key": "cv/user-uuid/old.pdf",
    "ownerId": "user-uuid",
    "visibility": "PRIVATE"
  }
]
```

4. Chạy `php bin/console.php import --dry-run --files=manifest.json`. Preflight thực thi ghi trong transaction MySQL rồi rollback để kiểm tra kiểu dữ liệu, khóa ngoại và khóa duy nhất. File nguồn chỉ được đọc/kiểm tra SHA-256. Xử lý mọi lỗi trước khi nhập thật.
5. Chạy `php bin/console.php import --files=manifest.json`, sau đó `php bin/console.php verify --files=manifest.json`. Import đọc snapshot PostgreSQL repeatable-read, nhập theo quan hệ với batch 250, upsert theo khóa chính, đổi URL file, giữ hash bcrypt hoặc băm mật khẩu plaintext legacy. File được copy và kiểm tra checksum, không di chuyển/xóa nguồn.
6. Đọc report trong `storage/reports`: đối chiếu số lượng, từng record theo UUID và checksum; nghiệm thu đăng nhập, hồ sơ, file riêng tư, đơn ứng tuyển và chat trước khi chuyển traffic. Khi thất bại giữa các batch, nhập lại cùng manifest hoặc khôi phục backup đích. Không có atomic transaction chung giữa filesystem và toàn bộ database.

Profile/avatar/company/post media cần đưa vào manifest khi chúng là file trên kho cũ. Kiểm tra quyền đọc file sau chuyển. Dữ liệu localStorage không nằm trong PostgreSQL; xuất JSON ở origin cũ rồi nhập ở `/goals` tại origin mới.

Nếu giao diện cũ chưa có nút xuất, mở DevTools Console tại origin cũ, chạy đoạn dưới rồi lưu nội dung clipboard thành `browser-data.json` để nhập ở `/goals`:

```javascript
copy(JSON.stringify(Object.fromEntries(
  ['cv_career_goals_data', 'cv_notification_prefs', 'cv_appearance_prefs']
    .map(key => [key, JSON.parse(localStorage.getItem(key) || 'null')])
), null, 2));
```

## Kiểm tra

Tạo database riêng `cvscreening_test`; không chạy test trên database đang dùng. Khởi động server test ở terminal thứ hai:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev-php.ps1 -TestDatabase -Port 8081 -NoWorker
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-php.ps1
```

Script kiểm tra cú pháp PHP 7.4, unit/MySQL integration, HTTP end-to-end và pytest. HTTP test tạo rồi dọn tài khoản/công ty/file test. Browser smoke dùng Chrome đã cài và Python `playwright`, chạy `python apps/php/tests/browser.py`; nó đăng nhập demo và gửi tin nhắn test, ảnh chụp nằm trong `storage/reports`.

OAuth Google/LinkedIn cần client ID/secret và callback URI đúng, chưa nghiệm thu với tài khoản provider thật. Email thật chưa được cấu hình; demo hiển thị token xác minh như luồng cũ. NLP embedding/LLM nâng cao cần dependency/API key riêng; bản local đã kiểm tra scorer nhẹ và fallback PHP. Crawler phụ thuộc HTML/chống bot của bên thứ ba nên có thể trả dữ liệu fallback. Import chưa được chạy với database PostgreSQL thật. Docker Compose mới được cung cấp riêng, chưa được build/nghiệm thu trên máy này.

## Docker tùy chọn

Copy `.env.php.example` ở gốc thành `.env.php`, điền ba secret rồi chạy:

```sh
docker compose --env-file .env.php -f docker-compose.php.yml up --build
```

Migrate chạy một lần trước web/worker. Volume MySQL, upload và AI cache được lưu riêng. Seed bằng `docker compose --env-file .env.php -f docker-compose.php.yml exec -e SEED_PASSWORD=your-demo-password web php bin/console.php seed`. Không chạy stack cũ đồng thời trên cùng cổng.

## Tiếp tục refactor giao diện và chức năng

[Báo cáo đối chiếu bản cũ, thay đổi và kiểm tra ngày 09/10/2026](../../docs/php-parity-audit.md). Browser audit hiện đối chiếu đủ 35 đường dẫn, desktop/mobile và light/dark; kiểm tra riêng bình luận, reaction, pagination, mạng lưới, theo dõi và thao tác đơn ứng tuyển không reload.
