param([int]$Port = 3110, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$reviewWorkspace = Split-Path -Parent $PSScriptRoot
$reviewBase = "http://127.0.0.1:$Port"
$reviewHealth = $null
try { $reviewHealth = Invoke-RestMethod -Uri "$reviewBase/health" -TimeoutSec 2 } catch {}
if ($reviewHealth -and ($reviewHealth.service -ne 'sunnyfit-review-viewer' -or $reviewHealth.workspace -ne $reviewWorkspace)) {
    throw "Port $Port is used by another service. Choose a different -Port."
}
if (-not $reviewHealth) {
    $reviewNode = (Get-Command node -ErrorAction Stop).Source
    $reviewRuntime = Join-Path $reviewWorkspace 'runtime'
    New-Item -ItemType Directory -Path $reviewRuntime -Force | Out-Null
    $reviewStamp = [guid]::NewGuid().ToString('N')
    $reviewOut = Join-Path $reviewRuntime "review-viewer-$reviewStamp.out.log"
    $reviewErr = Join-Path $reviewRuntime "review-viewer-$reviewStamp.err.log"
    $env:REVIEW_PORT = [string]$Port
    $reviewProcess = Start-Process -FilePath $reviewNode -ArgumentList ('"' + (Join-Path $PSScriptRoot 'review-viewer.cjs') + '"') -WorkingDirectory $reviewWorkspace -WindowStyle Hidden -RedirectStandardOutput $reviewOut -RedirectStandardError $reviewErr -PassThru
    for ($reviewAttempt = 0; $reviewAttempt -lt 50; $reviewAttempt++) {
        if ($reviewProcess.HasExited) { throw "Preview failed to start. Check $reviewErr" }
        try { $reviewHealth = Invoke-RestMethod -Uri "$reviewBase/health" -TimeoutSec 1 } catch {}
        if ($reviewHealth) { break }
        Start-Sleep -Milliseconds 100
    }
    if (-not $reviewHealth -or $reviewHealth.service -ne 'sunnyfit-review-viewer' -or $reviewHealth.workspace -ne $reviewWorkspace) { throw 'Preview startup could not be verified.' }
    Write-Output "Preview process: $($reviewProcess.Id)"
}
Write-Output "$reviewBase/latest"
if (-not $NoBrowser) { Start-Process "$reviewBase/latest" }
