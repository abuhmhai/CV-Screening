# TalentFlow — PHP 7.4, HTML và MySQL

Ứng dụng tuyển dụng đã có runtime PHP MVC + PDO/MySQL tại `apps/php`, giao diện HTML/CSS/JavaScript thuần và Python FastAPI cho trích xuất/chấm CV.

## Chạy local trên máy Windows hiện tại

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev-php.ps1
```

Mở **http://localhost:8080**. Tài khoản demo: `candidate@demo.local`, `recruiter@demo.local`, `admin@demo.local`; mật khẩu ban đầu **Demo@12345**. Database/file demo được tạo mới theo yêu cầu, không phải dữ liệu PostgreSQL cũ.

- [Cài đặt, XAMPP, tài khoản, import dữ liệu và kiểm tra](apps/php/README.md)
- [Phạm vi chuyển đổi và nghiệm thu](docs/php-migration.md)
- [Sơ đồ và ánh xạ database](docs/php-database.md)
- [Cấu hình Docker mới](docker-compose.php.yml)

Runtime mới không cần Node, NestJS, Next.js, Redis, Celery hoặc MinIO. MySQL và Python AI chạy local; worker PHP dùng queue trong MySQL. Chat và thông báo dùng polling.

## Kiểm tra trên database riêng

```powershell
# Terminal 1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev-php.ps1 -TestDatabase -Port 8081 -NoWorker
# Terminal 2
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-php.ps1
```

## Mã nguồn cũ

`apps/web` (Next.js/React/TypeScript), `apps/api` (NestJS/Prisma/PostgreSQL), các package dùng chung và `docker-compose.yml` vẫn được giữ để đối chiếu/rollback. [Hướng dẫn stack cũ](docs/legacy-setup.md). Không chạy hai worker/stack trên cùng dữ liệu khi chuyển traffic.
