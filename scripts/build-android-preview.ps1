# Queue an Android APK build on Expo EAS (cloud). Returns immediately; build continues online.
# Run from repo root:  powershell -ExecutionPolicy Bypass -File scripts/build-android-preview.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$log = Join-Path $root 'build-android-preview.log'

Write-Host ''
Write-Host '=== Ocupulse — Android preview APK (EAS cloud) ===' -ForegroundColor Cyan
Write-Host "Log file: $log"
Write-Host ''

if (-not (Test-Path (Join-Path $root 'node_modules\eas-cli'))) {
  Write-Host 'Installing dependencies (first time)...' -ForegroundColor Yellow
  npm install
}

Write-Host 'Checking Expo login...' -ForegroundColor Yellow
npm run eas:auth-check
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host 'Sign in first, then re-run this script:' -ForegroundColor Red
  Write-Host '  npm run eas:login' -ForegroundColor Cyan
  exit $LASTEXITCODE
}

Write-Host 'Submitting build (does not wait for APK to finish)...' -ForegroundColor Green
"=== $(Get-Date -Format o) ===" | Out-File -FilePath $log -Encoding utf8
npm run build:android:preview 2>&1 | Tee-Object -FilePath $log -Append

if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host 'Build submit failed. Common fixes:' -ForegroundColor Red
  Write-Host '  1. npm run eas:login'
  Write-Host '  2. First Android build only (creates signing keystore):'
  Write-Host '       npm run build:android:preview:setup' -ForegroundColor Cyan
  Write-Host '     When prompted, choose to let Expo generate credentials.'
  Write-Host '  3. Later builds: npm run build:android:preview'
  Write-Host "  4. Read log: $log"
  exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Build queued on Expo servers. Track progress at https://expo.dev' -ForegroundColor Green
Write-Host "Full log: $log"
Write-Host 'When finished, download the APK from the build page (profile: preview).' -ForegroundColor Yellow
Write-Host ''
