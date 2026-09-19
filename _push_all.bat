@echo off
cd /d D:\_drg_wt_rt
for /L %%i in (1,1,10) do (
  timeout /t 25 /nobreak >nul
  git push origin rt-fixes:main && (
    echo RT-PUSH-OK-%%i
    cd /d D:\_drg_wt_i18n
    for /L %%j in (1,1,6) do (
      timeout /t 20 /nobreak >nul
      git push origin i18n-ship:main && (
        echo I18N-PUSH-OK-%%j
        exit /b 0
      )
    )
    echo I18N-PUSH-FAILED
    exit /b 1
  )
)
echo RT-PUSH-FAILED-ALL
exit /b 1
