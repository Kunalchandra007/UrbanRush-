@echo off
REM QuickCart AI - Automated Test Suite (Windows)

echo ==================================
echo QuickCart AI - Test Suite
echo ==================================
echo.

set PASSED=0
set FAILED=0

REM Test 1: Backend Health Check
echo Test 1: Backend Health Check...
curl -s http://localhost:8000/health > temp_response.txt
findstr /C:"ok" temp_response.txt >nul
if %errorlevel%==0 (
    echo [PASSED] Backend is healthy
    set /a PASSED+=1
) else (
    echo [FAILED] Backend health check failed
    set /a FAILED+=1
)

REM Test 2: Intent Extraction - Party Scenario
echo Test 2: Intent Extraction (Party)...
curl -s -X POST http://localhost:8000/intent/extract -H "Content-Type: application/json" -d "{\"user_input\": \"I have guests coming in 30 minutes\"}" > temp_response.txt
findstr /C:"party" temp_response.txt >nul
if %errorlevel%==0 (
    echo [PASSED] Party intent extracted
    set /a PASSED+=1
) else (
    echo [FAILED] Party intent extraction failed
    set /a FAILED+=1
)

REM Test 3: Cart Building
echo Test 3: Cart Building...
curl -s -X POST http://localhost:8000/intent/extract -H "Content-Type: application/json" -d "{\"user_input\": \"Movie night for 5 people\"}" > temp_response.txt
findstr /C:"item_count" temp_response.txt >nul
if %errorlevel%==0 (
    echo [PASSED] Cart building works
    set /a PASSED+=1
) else (
    echo [FAILED] Cart building failed
    set /a FAILED+=1
)

REM Test 4: Movie Night Scenario
echo Test 4: Scenario - Movie night...
curl -s -X POST http://localhost:8000/intent/extract -H "Content-Type: application/json" -d "{\"user_input\": \"Movie night for 5 people\"}" > temp_response.txt
findstr /C:"cart" temp_response.txt >nul
if %errorlevel%==0 (
    echo [PASSED] Movie night scenario
    set /a PASSED+=1
) else (
    echo [FAILED] Movie night scenario
    set /a FAILED+=1
)

REM Test 5: Baby Care Scenario
echo Test 5: Scenario - Baby fever...
curl -s -X POST http://localhost:8000/intent/extract -H "Content-Type: application/json" -d "{\"user_input\": \"My baby has fever\"}" > temp_response.txt
findstr /C:"cart" temp_response.txt >nul
if %errorlevel%==0 (
    echo [PASSED] Baby fever scenario
    set /a PASSED+=1
) else (
    echo [FAILED] Baby fever scenario
    set /a FAILED+=1
)

REM Test 6: Exam Scenario
echo Test 6: Scenario - Exam tomorrow...
curl -s -X POST http://localhost:8000/intent/extract -H "Content-Type: application/json" -d "{\"user_input\": \"Exam tomorrow morning\"}" > temp_response.txt
findstr /C:"cart" temp_response.txt >nul
if %errorlevel%==0 (
    echo [PASSED] Exam scenario
    set /a PASSED+=1
) else (
    echo [FAILED] Exam scenario
    set /a FAILED+=1
)

REM Test 7: Power Cut Scenario
echo Test 7: Scenario - Power cut...
curl -s -X POST http://localhost:8000/intent/extract -H "Content-Type: application/json" -d "{\"user_input\": \"Power cut at home\"}" > temp_response.txt
findstr /C:"cart" temp_response.txt >nul
if %errorlevel%==0 (
    echo [PASSED] Power cut scenario
    set /a PASSED+=1
) else (
    echo [FAILED] Power cut scenario
    set /a FAILED+=1
)

REM Test 8: Breakfast Scenario
echo Test 8: Scenario - Breakfast...
curl -s -X POST http://localhost:8000/intent/extract -H "Content-Type: application/json" -d "{\"user_input\": \"Breakfast for 4 people\"}" > temp_response.txt
findstr /C:"cart" temp_response.txt >nul
if %errorlevel%==0 (
    echo [PASSED] Breakfast scenario
    set /a PASSED+=1
) else (
    echo [FAILED] Breakfast scenario
    set /a FAILED+=1
)

REM Cleanup
del temp_response.txt

echo.
echo ==================================
echo Test Results
echo ==================================
echo Passed: %PASSED%
echo Failed: %FAILED%
echo.

if %FAILED%==0 (
    echo [SUCCESS] ALL TESTS PASSED!
    echo Your QuickCart AI is ready for demo!
) else (
    echo [WARNING] SOME TESTS FAILED
    echo Please review the errors above.
)

pause
