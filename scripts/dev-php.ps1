param([int]$Port = 8080, [switch]$NoAi, [switch]$NoWorker, [switch]$TestDatabase)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$phpCandidates = @((Join-Path $projectRoot '.tools/php74/php.exe'), 'C:/xampp/php/php.exe')
$phpBinary = $phpCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $phpBinary) { $phpBinary = (Get-Command php -ErrorAction Stop).Source }
$pythonBinary = Join-Path $projectRoot '.tools/python311/python.exe'
if (-not $NoAi -and -not (Test-Path -LiteralPath $pythonBinary)) { $pythonBinary = (Get-Command python -ErrorAction Stop).Source }
$logRoot = Join-Path $projectRoot 'apps/php/storage/logs'
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
$children = New-Object System.Collections.Generic.List[System.Diagnostics.Process]
function Test-LocalPort([int]$number) {
    $socket = New-Object System.Net.Sockets.TcpClient
    try {
        $result = $socket.BeginConnect('127.0.0.1', $number, $null, $null)
        if (-not $result.AsyncWaitHandle.WaitOne(500)) { return $false }
        $socket.EndConnect($result)
        return $true
    } catch { return $false } finally { $socket.Close() }
}
function Start-HiddenHelper([string]$binary, [string[]]$arguments, [string]$directory) {
    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = $binary
    $info.Arguments = ($arguments | ForEach-Object { '"' + $_.Replace('"','\"') + '"' }) -join ' '
    $info.WorkingDirectory = $directory
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    # Inherit the native environment; materializing the .NET dictionary can
    # fail on Windows hosts whose environment contains both PATH and Path.
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $info
    if (-not $process.Start()) { throw 'Cannot launch local helper' }
    return $process
}
try {
    Set-Location -LiteralPath $projectRoot
    $mysqlBinary = Join-Path $projectRoot '.tools/mysql84/mysql-8.4.11-winx64/bin/mysqld.exe'
    if (Test-Path -LiteralPath $mysqlBinary) {
        $listener = Test-LocalPort 33306
        if (-not $listener) {
            $mysqlBase = Split-Path -Parent (Split-Path -Parent $mysqlBinary)
            $dataRoot = Join-Path $projectRoot '.tools/mysql-data'
            if (-not (Test-Path -LiteralPath (Join-Path $dataRoot 'mysql'))) {
                & $mysqlBinary --no-defaults --initialize-insecure "--basedir=$mysqlBase" "--datadir=$dataRoot" --console
                if ($LASTEXITCODE -ne 0) { throw 'MySQL initialization failed' }
            }
            $children.Add((Start-HiddenHelper $mysqlBinary @('--no-defaults', "--basedir=$mysqlBase", "--datadir=$dataRoot", '--port=33306', '--bind-address=127.0.0.1', '--mysqlx=OFF') $projectRoot))
            for ($attempt = 0; $attempt -lt 30; $attempt++) {
                if (Test-LocalPort 33306) { break }
                Start-Sleep -Seconds 1
            }
        }
    }
    if ($TestDatabase) {
        $env:DB_DSN = 'mysql:host=127.0.0.1;port=33306;dbname=cvscreening_test;charset=utf8mb4'
        $env:DB_USER = 'root'
        $env:DB_PASSWORD = ''
        $env:CRAWL_SCHEDULED = 'false'
        & $phpBinary apps/php/bin/setup-test.php
        if ($LASTEXITCODE -ne 0) { throw 'Test database setup failed' }
        & $phpBinary apps/php/bin/console.php migrate
        if ($LASTEXITCODE -ne 0) { throw 'Test schema migration failed' }
    } else {
        & $phpBinary apps/php/bin/setup-local.php
        if ($LASTEXITCODE -ne 0) { throw 'Cannot connect to MySQL; configure apps/php/.env and start MySQL' }
        & $phpBinary apps/php/bin/console.php migrate
        if ($LASTEXITCODE -ne 0) { throw 'Migration failed' }
        & $phpBinary apps/php/bin/console.php seed
        if ($LASTEXITCODE -ne 0) { throw 'Demo seed failed' }
    }
    if (-not $NoAi) {
        $env:CACHE_DRIVER = 'file'
        $env:CACHE_DIR = Join-Path $projectRoot 'apps/ai-service/.screening-cache'
        if (-not (Test-LocalPort 8000)) {
            $children.Add((Start-HiddenHelper $pythonBinary @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000') (Join-Path $projectRoot 'apps/ai-service')))
        }
    }
    if (-not $NoWorker) { $children.Add((Start-HiddenHelper $phpBinary @('-d',('error_log=' + (Join-Path $logRoot 'worker.log')),'apps/php/bin/console.php','worker') $projectRoot)) }
    Write-Host "TalentFlow: http://localhost:$Port - Ctrl+C to stop helpers started by this script."
    & $phpBinary -d ("error_log=" + (Join-Path $logRoot 'web.log')) -S "127.0.0.1:$Port" -t apps/php/public apps/php/public/router.php
} finally {
    foreach ($process in $children) { if (-not $process.HasExited) { $process.Kill(); $process.WaitForExit() } }
}
