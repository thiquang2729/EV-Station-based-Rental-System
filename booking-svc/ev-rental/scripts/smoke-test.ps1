Param(
  [switch]$WaitReady = $true,
  [int]$TimeoutSec = 120,
  [int]$RequestTimeoutSec = 8
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "[ OK ] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[FAIL] $msg" -ForegroundColor Red }

function Test-TcpPort {
  Param([string]$TargetHost, [int]$Port, [int]$TimeoutMs = 3000)
  try {
    $client = [System.Net.Sockets.TcpClient]::new()
    $iar = $client.BeginConnect($TargetHost, $Port, $null, $null)
    if (-not $iar.AsyncWaitHandle.WaitOne($TimeoutMs)) { $client.Close(); return $false }
    $client.EndConnect($iar) | Out-Null
    $client.Close()
    return $true
  } catch { return $false }
}

function Get-Http($url, $timeoutSec) {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $resp = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec $timeoutSec -UseBasicParsing
    $sw.Stop()
    return @{ ok=$true; status=$resp.StatusCode; ms=$sw.ElapsedMilliseconds; body=$resp.Content }
  } catch {
    $sw.Stop()
    return @{ ok=$false; status=0; ms=$sw.ElapsedMilliseconds; body=$_.Exception.Message }
  }
}

# Base URL for the gateway (single public port)
$GatewayBase = 'http://localhost:4000'

# Define services and endpoints to check
$checks = @(
  @{ name='mysql';            kind='tcp'; url='localhost:3307';  critical=$true },
  @{ name='adminer';          kind='http'; url='http://localhost:8080'; critical=$false },
  @{ name='gateway/admin';    kind='http'; url=($GatewayBase + '/admin/health');  critical=$true },
  @{ name='gateway/rental';   kind='http'; url=($GatewayBase + '/rental/health'); critical=$true },
  @{ name='gateway/fleet';    kind='http'; url=($GatewayBase + '/fleet/health');  critical=$true }
)

$smoke = @(
  # rental-svc via gateway
  @{ name='rental: stations'; url=($GatewayBase + '/rental/api/v1/stations') },
  @{ name='rental: vehicles'; url=($GatewayBase + '/rental/api/v1/vehicles') },
  @{ name='rental: bookings'; url=($GatewayBase + '/rental/api/v1/bookings') },
  # fleet-svc via gateway
  @{ name='fleet: vehicles';  url=($GatewayBase + '/fleet/api/v1/vehicles') },
  @{ name='fleet: overview';  url=($GatewayBase + '/fleet/api/v1/overview') },
  # admin-svc via gateway (service exposes /admin/*)
  @{ name='admin: vehicles';  url=($GatewayBase + '/admin/vehicles') },
  @{ name='admin: reports';   url=($GatewayBase + '/admin/reports') }
)

if ($WaitReady) {
  Write-Info "Waiting for core services to be ready (up to $TimeoutSec s)"
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  $remaining = $true
  do {
    $allUp = $true
    foreach ($c in $checks) {
      if ($c.kind -eq 'tcp') {
        $tcpHost,$port = $c.url.Split(':')
        $portNum = [int]::Parse($port)
        $ok = Test-TcpPort -TargetHost $tcpHost -Port $portNum -TimeoutMs 1500
      } else {
        $res = Get-Http -url $c.url -timeoutSec 3
        $ok = $res.ok -and $res.status -ge 200 -and $res.status -lt 500
      }
      if (-not $ok) { $allUp = $false; break }
    }
    if ($allUp) { break }
    Start-Sleep -Seconds 2
    $remaining = (Get-Date) -lt $deadline
  } while ($remaining)

  if (-not $allUp) {
    Write-Warn "Timeout waiting for services. Will still run checks..."
  } else {
    Write-Ok "Core health endpoints are responding"
  }
}

# Health checks
Write-Info "Running health checks"
$results = @()
foreach ($c in $checks) {
  if ($c.kind -eq 'tcp') {
    $tcpHost,$port = $c.url.Split(':')
    $portNum = [int]::Parse($port)
    $ok = Test-TcpPort -TargetHost $tcpHost -Port $portNum -TimeoutMs 2000
    $r = @{ name=$c.name; url=$c.url; ok=$ok; status= if($ok){200}else{0}; ms=0; critical=$c.critical }
  } else {
    $r = Get-Http -url $c.url -timeoutSec $RequestTimeoutSec
    $r.name = $c.name; $r.url = $c.url; $r.critical = $c.critical
  }
  $results += $r
  if ($r.ok) { Write-Ok   ("{0} ({1}) {2}ms" -f $r.name,$r.status,$r.ms) }
  else       { Write-Err  ("{0} FAILED ({1}) {2}" -f $r.name,$r.status,$r.body) }
}

$criticalFailed = $results | Where-Object { -not $_.ok -and $_.critical }

# Smoke tests (non-critical)
Write-Info "Running API smoke tests"
$smokeResults = @()
foreach ($s in $smoke) {
  $r = Get-Http -url $s.url -timeoutSec $RequestTimeoutSec
  $r.name = $s.name; $r.url = $s.url
  $smokeResults += $r
  if ($r.ok) { Write-Ok   ("{0} ({1}) {2}ms" -f $r.name,$r.status,$r.ms) }
  else       { Write-Warn ("{0} unavailable ({1}) {2}" -f $r.name,$r.status,$r.body) }
}

# Summary
Write-Host ""; Write-Host "==== Summary ====" -ForegroundColor White
$healthOk = @($results | Where-Object {$_.ok}).Count
$healthFail = @($results | Where-Object {-not $_.ok}).Count
$criticalFailedCount = @($results | Where-Object { -not $_.ok -and $_.critical }).Count
$smokeOk = @($smokeResults | Where-Object {$_.ok}).Count
$smokeWarn = @($smokeResults | Where-Object {-not $_.ok}).Count
Write-Host ("Health: {0} OK, {1} FAILED ({2} critical)" -f $healthOk, $healthFail, $criticalFailedCount)
Write-Host ("Smoke:  {0} OK, {1} WARN" -f $smokeOk, $smokeWarn)

if ($criticalFailedCount -gt 0) { exit 2 } else { exit 0 }
