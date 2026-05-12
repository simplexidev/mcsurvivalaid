@echo off
setlocal enableextensions

rem ===== Configurable variables =====
set "BEHAVIOR_PACK_NAME=SurvivalAid_BP"
set "RESOURCE_PACK_NAME=SurvivalAid_RP"

set "SCRIPT_DIR=%~dp0"
set "BEHAVIOR_PACK_SOURCE=%SCRIPT_DIR%behaviors"
set "RESOURCE_PACK_SOURCE=%SCRIPT_DIR%resources"

set "MINECRAFT_MOJANG_DIR=%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang"
set "DEV_BP_ROOT=%MINECRAFT_MOJANG_DIR%\development_behavior_packs"
set "DEV_RP_ROOT=%MINECRAFT_MOJANG_DIR%\development_resource_packs"

set "BEHAVIOR_PACK_TARGET=%DEV_BP_ROOT%\%BEHAVIOR_PACK_NAME%"
set "RESOURCE_PACK_TARGET=%DEV_RP_ROOT%\%RESOURCE_PACK_NAME%"

echo [1/4] Building TypeScript to behavior scripts...
call npm run build
if errorlevel 1 (
  echo ERROR: Build failed. Deployment aborted.
  exit /b 1
)

echo [2/4] Verifying source pack folders...
if not exist "%BEHAVIOR_PACK_SOURCE%\manifest.json" (
  echo ERROR: Behavior pack source missing manifest: "%BEHAVIOR_PACK_SOURCE%\manifest.json"
  exit /b 1
)
if not exist "%RESOURCE_PACK_SOURCE%\manifest.json" (
  echo ERROR: Resource pack source missing manifest: "%RESOURCE_PACK_SOURCE%\manifest.json"
  exit /b 1
)

echo [3/4] Copying behavior pack to "%BEHAVIOR_PACK_TARGET%"...
robocopy "%BEHAVIOR_PACK_SOURCE%" "%BEHAVIOR_PACK_TARGET%" /MIR /R:2 /W:2
set "ROBO_BP_CODE=%ERRORLEVEL%"
if %ROBO_BP_CODE% GEQ 8 (
  echo ERROR: Behavior pack copy failed with robocopy exit code %ROBO_BP_CODE%.
  exit /b 1
)

echo [4/4] Copying resource pack to "%RESOURCE_PACK_TARGET%"...
robocopy "%RESOURCE_PACK_SOURCE%" "%RESOURCE_PACK_TARGET%" /MIR /R:2 /W:2
set "ROBO_RP_CODE=%ERRORLEVEL%"
if %ROBO_RP_CODE% GEQ 8 (
  echo ERROR: Resource pack copy failed with robocopy exit code %ROBO_RP_CODE%.
  exit /b 1
)

echo Deployment successful.
echo Behavior pack: "%BEHAVIOR_PACK_TARGET%"
echo Resource pack: "%RESOURCE_PACK_TARGET%"
exit /b 0
