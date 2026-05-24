# Start Expo for a physical iPhone on the same LAN.
# Run from repo root:  powershell -ExecutionPolicy Bypass -File scripts/start-expo-phone.ps1

$ip = (
  Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike '127.*' -and
    $_.PrefixOrigin -ne 'WellKnown'
  } |
  Select-Object -First 1 -ExpandProperty IPAddress
)

if (-not $ip) {
  Write-Host 'Could not detect LAN IP. Check Wi-Fi is connected.' -ForegroundColor Red
  exit 1
}

Write-Host ''
Write-Host '=== STEMM Lab — iPhone (Expo Go) ===' -ForegroundColor Cyan
Write-Host "LAN IP:  $ip"
Write-Host "URL:     exp://$ip`:8081"
Write-Host ''
Write-Host 'On iPhone:' -ForegroundColor Yellow
Write-Host '  1. Same Wi-Fi as this PC (not guest Wi-Fi)'
Write-Host "  2. Safari test:  http://${ip}:8081  (must load, not timeout)"
Write-Host "  3. Expo Go → Enter URL manually → paste exp://${ip}:8081"
Write-Host ''
Write-Host 'If Safari times out, fix Windows Firewall (Admin PowerShell):' -ForegroundColor Yellow
Write-Host '  netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081 profile=private'
Write-Host '  Or: Settings → Network → Wi-Fi → your network → Private'
Write-Host ''

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
Set-Location (Split-Path $PSScriptRoot -Parent)
npx expo start --lan --clear
