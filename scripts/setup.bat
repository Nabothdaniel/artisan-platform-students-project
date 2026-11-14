@echo off
setlocal
rem ArtisanHub setup for Windows cmd/PowerShell (Git Bash users can run: bash scripts/setup.sh)
where node >nul 2>nul || (echo ERROR: Install Node 18+ from https://nodejs.org & exit /b 1)
cd /d "%~dp0..\mobile" || exit /b 1
if not exist .env (copy .env.example .env >nul & echo Created mobile\.env)
call npm install || exit /b 1
call npm run typecheck || exit /b 1
call npm run seed || exit /b 1
echo.
echo Setup complete. Start the app with: npm start
