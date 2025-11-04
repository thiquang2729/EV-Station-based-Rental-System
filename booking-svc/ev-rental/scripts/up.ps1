Param(
  [switch]$Build = $true,
  [switch]$NoTest = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "[ OK ] $msg" -ForegroundColor Green }
function Write-Err($msg)  { Write-Host "[FAIL] $msg" -ForegroundColor Red }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Err "Docker is not installed or not in PATH."
  exit 1
}

if (-not (Test-Path "docker-compose.yml")) {
  Write-Err "docker-compose.yml not found in current directory."
  exit 1
}

$composeArgs = @('compose','up','-d')
if ($Build) { $composeArgs += '--build' }

Write-Info "Running: docker $($composeArgs -join ' ')"
docker @composeArgs

Write-Info "Waiting for containers to report healthy endpoints"
& "$PSScriptRoot/smoke-test.ps1" -WaitReady -TimeoutSec 180 -RequestTimeoutSec 8 | Out-Null
$code = $LASTEXITCODE
if ($code -ne 0) {
  Write-Err "Some critical health checks failed (exit $code)."
  exit $code
}

if (-not $NoTest) {
  Write-Info "Running API smoke tests"
  & "$PSScriptRoot/smoke-test.ps1" -WaitReady:$false -RequestTimeoutSec 8
  exit $LASTEXITCODE
}

Write-Ok "Services are up. Skipped smoke tests by request."
exit 0

