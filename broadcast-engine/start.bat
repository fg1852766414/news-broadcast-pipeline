@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [错误] 未找到虚拟环境，请先运行: uv sync
    pause
    exit /b 1
)

:: 直接运行（默认今天日期、中文）
echo [Broadcast Engine] 生成口播稿...
call .venv\Scripts\python.exe -X utf8 -m src.cli %*

endlocal
pause