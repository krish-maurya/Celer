@echo off
echo === Celer Unified Setup ===
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Node.js not found
  pause
  exit /b 1
)
node -v
if not exist .env (
  copy .env.example .env
  echo .env created
)
echo Installing deps...
call npm install
echo Creating DB + seeding...
call npm run setup
echo.
echo Ready! Run: npm run dev
echo http://localhost:3000
echo Login: demo@celer.app / password123
pause
