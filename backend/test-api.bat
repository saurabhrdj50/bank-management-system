@echo off
REM Bank Management System - API Test Script (Windows)

set BASE_URL=http://localhost:5000/api
set TOKEN=

echo ==================================
echo Bank Management System API Tests
echo ==================================
echo.

echo 1. Testing Health Check
curl -s "%BASE_URL%/health"
echo.
echo.

echo 2. Testing User Login
curl -s -X POST "%BASE_URL%/auth/login" -H "Content-Type: application/json" -d "{\"email\": \"user@bank.com\", \"password\": \"password\"}"
echo.
echo.

echo ==================================
echo Tests Complete
echo ==================================

pause
