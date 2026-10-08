# Phạm vi chuyển sang PHP

## Bản chạy mới

PHP 7.4 + PDO/MySQL, HTML/CSS/JavaScript thuần, Python FastAPI cho AI. Không dùng TypeScript/React trong runtime PHP. `apps/web`, `apps/api` và Compose cũ được giữ để đối chiếu và rollback, chưa xóa mã nguồn cũ. [Hướng dẫn chạy](../apps/php/README.md).

| Nhóm | Đã triển khai | Bằng chứng kiểm tra |
| --- | --- | --- |
| Schema | 35 bảng domain, FK/index/UUID/JSON/DECIMAL/BIGINT/UTC, migration checksum | Migrate trên MySQL 8.4.11; round-trip UTF-8/emoji/JSON/BIGINT |
| Auth | Register/login, refresh rotation, session revocation, CSRF, roles, OAuth adapter | Cookie login, CSRF rejection, logout, session JWT, role rejection |
| Hồ sơ/CV | Hồ sơ, child CRUD, skills, avatar/cover, PDF/DOCX, primary CV, autofill, insights | PDF upload/private download; HTML profile; AI DOCX extraction |
| Tuyển dụng | Công ty/member, job CRUD/search/facets/save, application, queue, interview/offer/export/alerts | Apply → worker → HR_REVIEW → interview → offer → HIRED; duplicate/outsider rejection |
| Social | Visibility, comment/reply, reactions, follow, connection/block, reports | Private feed and blocked messaging; HTML feed/network |
| Chat | Membership, send/history, polling cursor, read/typing/presence | HTTP send/receive/cursor/outsider checks; browser sends Vietnamese message |
| CV builder | Structured CV CRUD and Dompdf export | PDF begins with `%PDF-`; HTML builder |
| Browser state | Goals/milestones, appearance/notification keys, JSON import/export | Browser goal CRUD/completion, persisted theme |
| External jobs | Four-source crawler, seed fallback, list/save/summary/screen, scheduled task | UTF-8 parser rejects foreign hosts; seeded list HTML |
| Import | Read-only PG snapshot, preflight rollback, ordered upsert, password conversion, file copy/verify/report | Code and schema mapping reviewed; real PG source unavailable |

## Acceptance trên máy này

- PHP chính xác 7.4.33; database MySQL 8.4.11.
- 18 PHP/unit/integration checks và 64 HTTP checks đã qua tại thời điểm viết tài liệu; test suite có thể tăng khi bổ sung kiểm tra.
- 8 Python tests đã qua (scoring, cache file, extraction API).
- Chrome smoke đã qua login, profile, chat, goals, theme, mobile width và không có JavaScript exception.
- Demo target và test database riêng, nguồn cũ không bị sửa.

Route inventory kiểm tra có handler cho 125 đường dẫn HTTP cũ. UI map đủ 35 đường dẫn trang sang view PHP. Đây là coverage đường dẫn, không phải nghiệm thu mọi biến thể logic/pixel. Chức năng third-party OAuth, gửi email, crawling live, Docker và import PostgreSQL thật cần nghiệm thu trong môi trường có credential/source phù hợp. Crawler mới dùng HTML parser; các scraper chi tiết/Algolia trong bản NestJS không được sao chép nguyên vẹn. Analytics đã có biểu đồ cột, funnel, tỷ lệ tuyển dụng và thang điểm AI bằng HTML/CSS. Chưa chạy so sánh ảnh từng pixel với runtime React cũ.

## Nghiệm thu dữ liệu thật và chuyển traffic

1. Backup nguồn và đích, dừng writer/worker cũ.
2. Preflight import trên đích sạch, sửa lỗi file/constraint.
3. Import và verify UUID, record, count, SHA-256; kiểm tra dữ liệu localStorage riêng.
4. Kiểm tra bằng tài khoản thật các vai trò và quyền download CV.
5. Chuyển DocumentRoot/traffic sang PHP, chỉ khởi động worker PHP.
6. Theo dõi task FAILED/log và lỗi ứng dụng. Khi cần rollback, dừng writer mới, khôi phục backup thích hợp và bật lại stack cũ; không dùng lệnh reset database để rollback dữ liệu.

## Khôi phục giao diện cũ

Runtime vẫn là PHP 7.4 + HTML/CSS/JavaScript thuần + MySQL. `public/assets/original-tokens.css` lấy font, màu, chủ đề và token từ `apps/web/app/globals.css`; `restored-ui.css` và `restored-ui.js` chuyển bố cục và tương tác sang HTML. Mã React cũ được dùng để đối chiếu.

Đã phục hồi trang chủ AI, thanh điều hướng/dropdown/menu điện thoại, đăng nhập demo, bộ lọc và thẻ việc làm, panel xem tin/chấm CV, ảnh bìa và trình sửa hồ sơ, bảng tin ba cột, chat hai cột, các trang cài đặt riêng, thống kê ứng tuyển, CV thêm/xóa mục và xem trước trực tiếp, mục tiêu dạng dialog, bộ lọc ứng viên và bảy giai đoạn pipeline. Biểu đồ dùng số liệu thật từ MySQL.

Chrome kiểm tra ba vai trò, các trang ứng viên, dialog, sửa hồ sơ, CV preview, chat, mục tiêu, giao diện lưu qua reload và menu/bộ lọc điện thoại. Ảnh kiểm tra lưu trong `apps/php/storage/reports`. Chưa có nghiệm thu so sánh ảnh React/PHP từng pixel; không coi route coverage là bằng chứng pixel parity.
