$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Ensure-Node {
  $nodeDir = Join-Path $Root ".tools\node"
  $npmCmd = Join-Path $nodeDir "npm.cmd"
  if (Test-Path $npmCmd) {
    $env:Path = "$nodeDir;" + $env:Path
    return
  }

  New-Item -ItemType Directory -Force -Path (Join-Path $Root ".tools") | Out-Null
  $zip = Join-Path $env:TEMP "node-win-x64.zip"
  $url = "https://nodejs.org/dist/v20.18.1/node-v20.18.1-win-x64.zip"
  Write-Host "==> Downloading Node.js 20 (portable)..." -ForegroundColor Cyan
  Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
  Expand-Archive -Path $zip -DestinationPath (Join-Path $Root ".tools") -Force
  $extracted = Get-ChildItem (Join-Path $Root ".tools") -Directory | Where-Object { $_.Name -like "node-v*" } | Select-Object -First 1
  if ($extracted) {
    if (Test-Path $nodeDir) { Remove-Item $nodeDir -Recurse -Force }
    Rename-Item $extracted.FullName $nodeDir
  }
  Remove-Item $zip -Force -ErrorAction SilentlyContinue
  $env:Path = "$nodeDir;" + $env:Path
}

function Copy-EnvIfMissing($relPath, $examplePath) {
  $target = Join-Path $Root $relPath
  $example = Join-Path $Root $examplePath
  if (-not (Test-Path $target) -and (Test-Path $example)) {
    Copy-Item $example $target
    Write-Host "  Created $relPath from example"
  }
}

Write-Host "==> CV Screening - Project setup" -ForegroundColor Cyan
Ensure-Node
Write-Host "==> Node $(node -v), npm $(npm -v)"

Write-Host "==> Ensuring .env files..."
Copy-EnvIfMissing "apps\web\.env" "apps\web\.env.example"
if (-not (Test-Path (Join-Path $Root "apps\api\.env"))) {
  if (Test-Path (Join-Path $Root "apps\api\.env.local.example")) {
    Copy-Item (Join-Path $Root "apps\api\.env.local.example") (Join-Path $Root "apps\api\.env")
    Write-Host "  Created apps/api/.env from .env.local.example — set PGPASSWORD and DATABASE_URL"
  } else {
    Copy-EnvIfMissing "apps\api\.env" "apps\api\.env.example"
  }
}
Copy-EnvIfMissing "apps\ai-service\.env" "apps\ai-service\.env.example"

Write-Host "==> npm install (monorepo)..."
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Edit apps/api/.env — set PGPASSWORD and DATABASE_URL for your PostgreSQL user"
Write-Host "  2. Local dev (web + api):  npm run dev:local"
Write-Host "  3. Or with Docker:         docker compose up --build"
Write-Host ""
Write-Host "URLs after dev:local:"
Write-Host "  Web:  http://localhost:3000"
Write-Host "  API:  http://localhost:4000/api/v1/health"
