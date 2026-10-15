param([int]$Port = 3012, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$demoWorkspace = Split-Path -Parent $PSScriptRoot
$demoDatabase = Join-Path $demoWorkspace 'runtime\optimized-demo.sqlite'
$demoBase = "http://127.0.0.1:$Port"
$demoHealth = $null
try { $demoHealth = Invoke-RestMethod -Uri "$demoBase/api/health" -TimeoutSec 2 } catch {}
if ($demoHealth -and $demoHealth.data.demo.database -ne $demoDatabase) { throw "Port $Port belongs to another Demo. Choose a different -Port." }
if (-not $demoHealth) {
    $demoNode = (Get-Command node -ErrorAction Stop).Source
    $demoRuntime = Join-Path $demoWorkspace 'runtime'
    New-Item -ItemType Directory -Path $demoRuntime -Force | Out-Null
    $demoStamp = [guid]::NewGuid().ToString('N')
    $env:API_PORT = [string]$Port
    $env:DEMO_DB_PATH = $demoDatabase
    $demoProcess = Start-Process -FilePath $demoNode -ArgumentList ('"' + (Join-Path $demoWorkspace 'server\index.cjs') + '"') -WorkingDirectory $demoWorkspace -WindowStyle Hidden -RedirectStandardOutput (Join-Path $demoRuntime "optimized-demo-$demoStamp.out.log") -RedirectStandardError (Join-Path $demoRuntime "optimized-demo-$demoStamp.err.log") -PassThru
    for ($demoAttempt=0; $demoAttempt -lt 50; $demoAttempt++) {
        if ($demoProcess.HasExited) { throw 'The optimized Demo failed to start.' }
        try { $demoHealth = Invoke-RestMethod -Uri "$demoBase/api/health" -TimeoutSec 1 } catch {}
        if ($demoHealth) { break }
        Start-Sleep -Milliseconds 100
    }
    if (-not $demoHealth -or $demoHealth.data.demo.database -ne $demoDatabase) { throw 'Demo startup could not be verified.' }
    Write-Output "Demo process: $($demoProcess.Id)"
}
$demoUrl = "$demoBase/#/app/home?user=DEMO-2002&review=0"
Write-Output $demoUrl
Write-Output "$demoBase/#/commercialization/overview"
if (-not $NoBrowser) { Start-Process $demoUrl }
