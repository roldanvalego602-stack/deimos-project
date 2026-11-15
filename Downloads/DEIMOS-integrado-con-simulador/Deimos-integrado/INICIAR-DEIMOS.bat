@echo off
cd /d "%~dp0"
echo DEIMOS PROJECT - Local web server
echo Open http://localhost:8000/ in Chrome.
python -m http.server 8000
pause
