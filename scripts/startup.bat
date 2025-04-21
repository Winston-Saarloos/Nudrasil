@echo off

REM --- Start GitHub Actions Runner ---
start "GitHub Runner" cmd /k "cd /d C:\GitHubRunners\actions-runner && run.cmd"

REM --- Start Cloudflare Tunnel ---
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel run Nudrasil_App_001"

REM --- Start PM2 and restore processes ---
start "PM2 Restore" cmd /k "pm2 resurrect"
