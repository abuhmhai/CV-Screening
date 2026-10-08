param([string]$AppUrl = 'http://127.0.0.1:8081')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$phpBinary = Join-Path $projectRoot '.tools/php74/php.exe'
if (-not (Test-Path -LiteralPath $phpBinary)) { $phpBinary = (Get-Command php).Source }
if (-not $env:TEST_DB_DSN) { $env:TEST_DB_DSN = 'mysql:host=127.0.0.1;port=33306;dbname=cvscreening_test;charset=utf8mb4' }
$env:DB_DSN = $env:TEST_DB_DSN
$env:DB_USER = if ($env:TEST_DB_USER) { $env:TEST_DB_USER } else { 'root' }
$env:DB_PASSWORD = if ($env:TEST_DB_PASSWORD) { $env:TEST_DB_PASSWORD } else { '' }
$env:TEST_APP_URL = $AppUrl
$env:CRAWL_SCHEDULED = 'false'
& $phpBinary apps/php/bin/setup-test.php
if ($LASTEXITCODE -ne 0) { throw 'Cannot create test database; configure TEST_DB_DSN/TEST_DB_USER/TEST_DB_PASSWORD' }
& $phpBinary apps/php/bin/console.php migrate
if ($LASTEXITCODE -ne 0) { throw 'Migration check failed' }
$phpFiles = Get-ChildItem apps/php -Recurse -Filter '*.php' | Where-Object FullName -NotMatch '[\\/]vendor[\\/]|[\\/]storage[\\/]'
foreach ($file in $phpFiles) { & $phpBinary -l $file.FullName | Out-Null; if ($LASTEXITCODE -ne 0) { throw "PHP syntax error: $($file.FullName)" } }
& $phpBinary apps/php/tests/run.php
if ($LASTEXITCODE -ne 0) { throw 'PHP integration checks failed' }
& $phpBinary apps/php/tests/http.php
if ($LASTEXITCODE -ne 0) { throw 'HTTP checks failed; start dev-php.ps1 -TestDatabase -Port 8081 -NoWorker first' }
$pythonBinary = Join-Path $projectRoot '.tools/python311/python.exe'
if (Test-Path -LiteralPath $pythonBinary) { & $pythonBinary -m pytest apps/ai-service/tests -q; if ($LASTEXITCODE -ne 0) { throw 'AI checks failed' } }
