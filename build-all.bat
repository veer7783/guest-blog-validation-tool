@echo off
REM Guest Blog Validation Tool - Build Script for Windows
REM This script builds both frontend and backend for production

echo.
echo ========================================
echo   Guest Blog Validation Tool - Build
echo ========================================
echo.

REM Build Backend
echo [1/2] Building Backend...
echo.
cd backend

echo Installing dependencies...
call npm install
if errorlevel 1 goto error

echo Generating Prisma Client...
call npx prisma generate
if errorlevel 1 goto error

echo Building TypeScript...
call npm run build
if errorlevel 1 goto error

echo Backend build complete!
echo.

REM Build Frontend
echo [2/2] Building Frontend...
echo.
cd ..\frontend

echo Installing dependencies...
call npm install
if errorlevel 1 goto error

echo Building React app...
call npm run build
if errorlevel 1 goto error

echo Frontend build complete!
echo.

REM Success
cd ..
echo.
echo ========================================
echo   Build Complete Successfully!
echo ========================================
echo.
echo Build Output:
echo   Backend:  backend\dist\
echo   Frontend: frontend\build\
echo.
echo Next Steps:
echo   1. Setup database: cd backend ^&^& npx prisma migrate deploy
echo   2. Start backend:  cd backend ^&^& npm start
echo   3. Serve frontend: cd frontend ^&^& npx serve -s build
echo.
goto end

:error
echo.
echo ========================================
echo   Build Failed!
echo ========================================
echo.
echo Please check the error messages above.
exit /b 1

:end
