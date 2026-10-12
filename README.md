# TalentFlow — PHP 7.4, HTML và MySQL

Ứng dụng tuyển dụng hoạt động trên nền tảng **PHP 7.4 MVC + PDO/MySQL**, giao diện **HTML/CSS/JavaScript thuần**, kết hợp **Python FastAPI** phục vụ riêng cho trích xuất và chấm điểm CV AI (đồng thời hỗ trợ fallback thuần PHP khi AI offline).

Toàn bộ các mã nguồn không cần thiết trước đây (Next.js/React, NestJS, Prisma, PostgreSQL, Redis, MinIO và các packages TypeScript) đã được loại bỏ hoàn toàn để hệ thống gọn nhẹ và vận hành chuẩn mực trên PHP 7.4 và MySQL.

## Cách chạy dự án

### 1. Chạy trên Windows (PowerShell)

Từ thư mục gốc:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev-php.ps1
```

Truy cập: **http://localhost:8080**

Tài khoản demo:
- **Ứng viên**: `candidate@demo.local` / `Demo@12345`
- **Nhà tuyển dụng**: `recruiter@demo.local` / `Demo@12345`
- **Quản trị viên**: `admin@demo.local` / `Demo@12345`

### 2. Chạy với Docker Compose

```sh
docker compose up --build
```

Dịch vụ sẽ tự động khởi động:
- **web**: PHP 7.4 Apache (chạy tại http://localhost:8080)
- **mysql**: MySQL 8.4 (cổng 33306)
- **migrate**: Tự động áp dụng schema và migration database
- **worker**: PHP background queue worker xử lý tác vụ chấm CV / gửi thông báo
- **ai-service**: Python FastAPI trích xuất và chấm điểm CV (cổng 8000)

Để nạp dữ liệu mẫu ban đầu:
```sh
docker compose exec -e SEED_PASSWORD=Demo@12345 web php bin/console.php seed
```

## Kiểm tra hệ thống (Test suite)

```powershell
# Chạy toàn bộ kiểm tra tích hợp PHP
php apps/php/tests/run.php

# Chạy kiểm tra API HTTP
php apps/php/tests/http.php

# Chạy kiểm tra AI service (nếu có môi trường Python)
python -m pytest apps/ai-service/tests -q
```

## Tài liệu chi tiết

- [Hướng dẫn chi tiết, XAMPP và cấu hình](apps/php/README.md)
- [Phạm vi chuyển đổi và tính năng](docs/php-migration.md)
- [Cấu trúc cơ sở dữ liệu MySQL](docs/php-database.md)
