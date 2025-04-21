$deployPath = "C:\Deploy\nudrasil-live"
$source = "$PSScriptRoot\.."
$build = "$source\.next\standalone"

Write-Host ">> Stop old app (if running)..."
pm2 stop nudrasil-app

Write-Host ">> Clean and copy new build..."
if (Test-Path $deployPath) {
  Remove-Item "$deployPath\*" -Recurse -Force
} else {
  New-Item -ItemType Directory -Path $deployPath | Out-Null
}
Copy-Item "$build\*" -Destination $deployPath -Recurse -Force
Copy-Item "$source\.next\static" -Destination "$deployPath\.next\static" -Recurse -Force
Copy-Item "$source\public" -Destination "$deployPath\public" -Recurse -Force
Copy-Item "$source\ecosystem.config.js" -Destination $deployPath -Force

Write-Host ">> Start new version with PM2..."
Set-Location $deployPath
pm2 start ecosystem.config.js --only nudrasil-app
pm2 save

Write-Host "✅ New version is now live!"
