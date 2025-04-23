$deployPath = "C:\Deploy\nudrasil-live"
$source = "$PSScriptRoot\.."
$build = "$source\.next\standalone"
$envSource = "C:\Deploy\.env.production"
$envDest = "$deployPath\.env"

Write-Host ">> Stop old app (if running)..."
pm2 stop nextjs-app

Write-Host ">> Clean and copy new build..."
if (Test-Path $deployPath) {
  Remove-Item "$deployPath\*" -Recurse -Force
} else {
  New-Item -ItemType Directory -Path $deployPath | Out-Null
}

# Copy all necessary files
Copy-Item "$build\*" -Destination $deployPath -Recurse -Force
Copy-Item "$build\node_modules" -Destination "$deployPath\node_modules" -Recurse -Force
Copy-Item "$source\.next\static" -Destination "$deployPath\.next\static" -Recurse -Force
Copy-Item "$source\public" -Destination "$deployPath\public" -Recurse -Force
Copy-Item "$source\ecosystem.config.cjs" -Destination $deployPath -Force

# copy environment file into place
Write-Host ">> Copying environment config (.env.production -> .env)..."
Copy-Item -Path $envSource -Destination $envDest -Force

Write-Host ">> Start new version with PM2..."
pm2 start ecosystem.config.cjs --only nextjs-app
pm2 save

Write-Host "New version is now live!"
