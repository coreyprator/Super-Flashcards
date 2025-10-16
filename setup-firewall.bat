@echo off
echo ================================================
echo   Sprint 5 Cross-Device Testing Setup
echo   Fixing Windows Firewall for iPhone Access
echo ================================================
echo.

echo 1. Adding Windows Firewall rules...
netsh advfirewall firewall add rule name="Super-Flashcards-Frontend" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="Super-Flashcards-Backend" dir=in action=allow protocol=TCP localport=8080 >nul 2>&1

echo    ✓ Port 3000 (Frontend) allowed
echo    ✓ Port 8080 (Backend) allowed
echo.

echo 2. Your network configuration:
ipconfig | findstr "IPv4"

echo.
echo 3. Testing local access...
curl -s -o nul -w "Frontend (localhost:3000): %%{http_code}\n" http://localhost:3000 2>nul || echo Frontend (localhost:3000): NOT ACCESSIBLE

echo.
echo 4. iPhone Access URLs:
echo    Frontend: http://172.20.2.203:3000
echo    Backend:  http://172.20.2.203:8080
echo.

echo 5. Next steps:
echo    - Test http://localhost:3000 in your browser first
echo    - Then test http://172.20.2.203:3000 on iPhone Safari
echo    - If still blocked, check Windows Defender settings
echo.
pause