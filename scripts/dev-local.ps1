$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$env:Path = "C:\Program Files\nodejs;" + $env:Path

Set-Location $Root
Write-Host "==> CV Screening - Local dev (no Docker)" -ForegroundColor Cyan

# 1) Require local PostgreSQL on 5432 (skip embedded-postgres)
$dbRunning = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if (-not $dbRunning) {
  Write-Host "ERROR: PostgreSQL is not listening on port 5432." -ForegroundColor Red
  Write-Host "Start PostgreSQL service, then run this script again."
  exit 1
}
Write-Host "==> Using existing PostgreSQL on port 5432"

# Load apps/api/.env into process env for scripts
$envFile = Join-Path $Root "apps\api\.env"
if (-not (Test-Path $envFile)) {
  Write-Host "ERROR: Missing apps/api/.env" -ForegroundColor Red
  exit 1
}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()
    Set-Item -Path "env:$name" -Value $value
  }
}

if ([string]::IsNullOrWhiteSpace($env:PGPASSWORD)) {
  Write-Host ""
  Write-Host "ERROR: PGPASSWORD is empty in apps/api/.env" -ForegroundColor Red
  Write-Host "Set your DataGrip password for user 'root', for example:"
  Write-Host "  PGPASSWORD=your_password"
  Write-Host "  DATABASE_URL=postgresql://root:your_password@127.0.0.1:5432/cvscreening"
  exit 1
}

# 2) Ensure cvscreening database exists
Write-Host "==> Ensuring database cvscreening exists..."
node apps/api/scripts/ensure-db.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 3) Prisma setup
Write-Host "==> Prisma generate + migrate + seed..."
npm run prisma:generate -w apps/api
npm run prisma:deploy -w apps/api
npm run prisma:seed -w apps/api

# 4) Start API (background)
$apiRunning = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue
if (-not $apiRunning) {
  Write-Host "==> Starting API on http://localhost:4000 ..."
  Start-Process -FilePath "npm" -ArgumentList "run","dev","-w","apps/api" -WindowStyle Hidden
  Start-Sleep -Seconds 6
} else {
  Write-Host "==> API already running on port 4000"
}

# 5) Start Web (background if not already on 3000)
$webRunning = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if (-not $webRunning) {
  Write-Host "==> Starting Web on http://localhost:3000 ..."
  Start-Process -FilePath "npm" -ArgumentList "run","dev","-w","apps/web" -WindowStyle Hidden
  Start-Sleep -Seconds 5
} else {
  Write-Host "==> Web already running on port 3000"
}

Write-Host ""
Write-Host "Local stack ready:" -ForegroundColor Green
Write-Host "  Web:  http://localhost:3000"
Write-Host "  API:  http://localhost:4000/api/v1/health"
Write-Host ""
Write-Host "DATABASE_URL in use: $env:DATABASE_URL"
