@echo off
rem Masaustune "Aninda Cozum" kisayolu ekler. Bir kez calistirmak yeterli.
rem Kisayol siteyi Edge (yoksa Chrome) ile adres cubugu olmadan acar.
setlocal
set "SITE=https://KULLANICI.github.io/DEPO/"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $d=Join-Path $env:LOCALAPPDATA 'AnindaCozum'; New-Item -ItemType Directory -Force $d | Out-Null; $ico=Join-Path $d 'ikon.ico'; Invoke-WebRequest ($env:SITE+'favicon.ico') -OutFile $ico -UseBasicParsing; $tarayici=@((${env:ProgramFiles(x86)}+'\Microsoft\Edge\Application\msedge.exe'),($env:ProgramFiles+'\Microsoft\Edge\Application\msedge.exe'),($env:ProgramFiles+'\Google\Chrome\Application\chrome.exe')) | Where-Object { Test-Path $_ } | Select-Object -First 1; if (-not $tarayici) { throw 'Edge veya Chrome bulunamadi.' }; $ad='An'+[char]0x131+'nda '+[char]0xC7+[char]0xF6+'z'+[char]0xFC+'m'; $k=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) ($ad+'.lnk'))); $k.TargetPath=$tarayici; $k.Arguments='--app='+$env:SITE; $k.IconLocation=$ico; $k.Description=$ad; $k.Save()"

if errorlevel 1 (
  echo.
  echo Kisayol olusturulamadi. Internet baglantisini kontrol edip yeniden dene.
  pause
  exit /b 1
)
echo Masaustune "Aninda Cozum" kisayolu eklendi.
pause
