param([int]$Port = 3012, [switch]$Components, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'open-demo.ps1') -Port $Port -NoBrowser | Out-Null
$labUrl = "http://127.0.0.1:$Port/#/demo/lab"
if ($Components) { $labUrl += '?tab=components' }
Write-Output $labUrl
if (-not $NoBrowser) { Start-Process $labUrl }
