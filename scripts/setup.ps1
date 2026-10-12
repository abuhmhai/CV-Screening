$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "==> TalentFlow (PHP 7.4 + MySQL) - Setup" -ForegroundColor Cyan

function Copy-EnvIfMissing($relPath, $examplePath) {
  $target = Join-Path $Root $relPath
  $example = Join-Path $Root $examplePath
  if (-not (Test-Path $target) -and (Test-Path $example)) {
    Copy-Item $example $target
    Write-Host "  Đã tạo $relPath từ $examplePath" -ForegroundColor Green
  }
}

Write-Host "==> Khởi tạo file cấu hình môi trường (.env)..."
Copy-EnvIfMissing ".env" ".env.example"
Copy-EnvIfMissing "apps\php\.env" "apps\php\.env.example"

Write-Host ""
Write-Host "Cài đặt hoàn tất!" -ForegroundColor Green
Write-Host ""
Write-Host "Để khởi chạy hệ thống, hãy dùng một trong hai cách sau:"
Write-Host "  1. Chạy PowerShell trực tiếp trên máy:"
Write-Host "     powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev-php.ps1"
Write-Host ""
Write-Host "  2. Hoặc chạy bằng Docker Compose:"
Write-Host "     docker compose up --build"
Write-Host ""
Write-Host "Truy cập ứng dụng tại: http://localhost:8080"
