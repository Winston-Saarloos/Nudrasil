# deploy.ps1

$deployPath = "C:\Deploy\nudrasil-live"
$source = "$PSScriptRoot\.."
$build = "$source\.next\standalone"

Write-Host ">> Stopping PM2 processes..."
pm2 delete all
pm2 kill

Write-Host ">> Cleaning old deployment folder..."
if (Test-Path $deployPath) {
  Remove-Item -Recurse -Force "$deployPath\*"
} else {
  New-Item -ItemType Directory -Path $deployPath | Out-Null
}

Write-Host ">> Copying build files..."
Copy-Item "$build\*" -Destination $deployPath -Recurse -Force
Copy-Item "$source\.next\static" -Destination "$deployPath\.next\static" -Recurse -Force
Copy-Item "$source\public" -Destination "$deployPath\public" -Recurse -Force
Copy-Item "$source\ecosystem.config.js" -Destination $deployPath -Force

Write-Host ">> Starting PM2 process..."
Set-Location $deployPath
pm2 start ecosystem.config.js
pm2 save
