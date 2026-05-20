
$ErrorActionPreference = "Stop"

function Get-TunnelUrl($filePath) {
    Write-Host "Waiting for URL in $filePath..."
    for ($i = 0; $i -lt 15; $i++) {
        if (Test-Path $filePath) {
            $content = Get-Content $filePath | Select-String "your url is:" | Select-Object -First 1
            if ($content) {
                return $content.ToString().Replace("your url is: ", "").Trim()
            }
        }
        Start-Sleep -Seconds 2
    }
    throw "Timeout waiting for URL in $filePath"
}

echo "------------------------------------------------"
echo "🚀 Starting TestFlow Fully (Local + Public)..."
echo "------------------------------------------------"

# 1. Kill existing processes
echo "[1/5] Cleaning up old processes..."
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*uvicorn*" } | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Start Backend
echo "[2/5] Launching Backend Server on port 8080..."
$backendCwd = "c:\Users\ANIKET\Documents\crm-test-platform\backend"
Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8080" -WorkingDirectory $backendCwd -WindowStyle Hidden
Start-Sleep -Seconds 2

# 3. Start Frontend
echo "[3/5] Launching Frontend Interface on port 5173..."
$frontendCwd = "c:\Users\ANIKET\Documents\crm-test-platform\frontend"
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev -- --host --port 5173" -WorkingDirectory $frontendCwd -WindowStyle Hidden
Start-Sleep -Seconds 2

# 4. Start Tunnels
echo "[4/5] Establishing Public Tunnels..."
$rootCwd = "c:\Users\ANIKET\Documents\crm-test-platform"
$backendTunnelFile = Join-Path $rootCwd "backend_tunnel_latest.txt"
$frontendTunnelFile = Join-Path $rootCwd "frontend_tunnel_latest.txt"

Remove-Item $backendTunnelFile -ErrorAction SilentlyContinue
Remove-Item $frontendTunnelFile -ErrorAction SilentlyContinue

Start-Process -FilePath "npx.cmd" -ArgumentList "localtunnel --port 8080" -RedirectStandardOutput $backendTunnelFile -WorkingDirectory $rootCwd -WindowStyle Hidden
Start-Process -FilePath "npx.cmd" -ArgumentList "localtunnel --port 5173" -RedirectStandardOutput $frontendTunnelFile -WorkingDirectory $rootCwd -WindowStyle Hidden

$backendUrl = Get-TunnelUrl $backendTunnelFile
$frontendUrl = Get-TunnelUrl $frontendTunnelFile

# 5. Update axios.js
echo "[5/5] Updating Frontend Configuration..."
$axiosFile = "c:\Users\ANIKET\Documents\crm-test-platform\frontend\src\api\axios.js"
$axiosContent = Get-Content $axiosFile
$newAxiosContent = $axiosContent -replace "https://.*\.loca\.lt/api/v1", "$backendUrl/api/v1"
$newAxiosContent | Set-Content $axiosFile

echo "------------------------------------------------"
echo "✅ SUCCESS! TestFlow is running fully."
echo "------------------------------------------------"
echo "Public App URL:    $frontendUrl"
echo "Public API URL:    $backendUrl"
echo "Local App URL:     http://localhost:5173"
echo "Local API URL:     http://localhost:8080"
echo "------------------------------------------------"
