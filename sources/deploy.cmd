@echo off
setlocal

set "MINECRAFT_DIR=%APPDATA%\Minecraft Bedrock\Users\Shared\games\com.mojang"

set "SRC_BP=%~dp0behaviors"
set "SRC_RP=%~dp0resources"

set "DEST_BP=%MINECRAFT_DIR%\development_behavior_packs\SurvivalAid_BP"
set "DEST_RP=%MINECRAFT_DIR%\development_resource_packs\SurvivalAid_RP"

echo Cleaning existing SurvivalAid behavior pack...
if exist "%DEST_BP%" (
    rmdir /s /q "%DEST_BP%"
    echo Removed: %DEST_BP%
) else (
    echo Not found, skipping: %DEST_BP%
)

echo.
echo Cleaning existing SurvivalAid resource pack...
if exist "%DEST_RP%" (
    rmdir /s /q "%DEST_RP%"
    echo Removed: %DEST_RP%
) else (
    echo Not found, skipping: %DEST_RP%
)

echo.
echo Copying SurvivalAid behavior pack...
robocopy "%SRC_BP%" "%DEST_BP%" /E
if errorlevel 8 (
    echo ERROR: Failed to copy behavior pack.
    pause
    exit /b 1
)

echo.
echo Copying SurvivalAid resource pack...
robocopy "%SRC_RP%" "%DEST_RP%" /E
if errorlevel 8 (
    echo ERROR: Failed to copy resource pack.
    pause
    exit /b 1
)

echo.
echo Deploy complete.
pause
exit /b 0
