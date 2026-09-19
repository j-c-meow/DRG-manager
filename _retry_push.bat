@echo off
cd /d D:\_drg_wt_rt
for /L %%i in (1,1,8) do (
  timeout /t 25 /nobreak >nul
  git push origin rt-fixes:main && (
    echo PUSH-OK-AT-ATTEMPT-%%i
    exit /b 0
  )
)
echo PUSH-FAILED-ALL
exit /b 1
