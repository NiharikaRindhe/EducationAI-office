$API = "http://localhost:4000/api"

$te = (Invoke-WebRequest -Uri "$API/auth/login" -Method POST -Body '{"email":"mr.rao.5d2a15@sps.delhi.01.eduai.local","password":"SmokeTest123!"}' -Headers @{"Content-Type"="application/json"} -UseBasicParsing).Content | ConvertFrom-Json

Write-Host "=== Testing Task Creation for Class 7-B ==="
$taskBody = '{"title":"Science Ch1 Homework","subject":"Science","assignTo":{"mode":"class","classNum":7,"section":"B"}}'
try { 
    $r = Invoke-WebRequest -Uri "$API/teacher/tasks" -Method POST -Body $taskBody -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $($te.accessToken)"} -UseBasicParsing
    Write-Host "PASS Task Creation: HTTP $($r.StatusCode) | $($r.Content)"
} catch { 
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $errBody = $reader.ReadToEnd()
    $reader.Close()
    Write-Host "Task Error ($([int]$_.Exception.Response.StatusCode)): $errBody"
}

Write-Host ""
Write-Host "=== Testing Performance & Task Reports for Class 7-B ==="
try { 
    $r = Invoke-WebRequest -Uri "$API/teacher/reports/performance?classNum=7&section=B" -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $($te.accessToken)"} -UseBasicParsing
    Write-Host "PASS Performance Report 7-B: HTTP $($r.StatusCode) | $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))"
} catch { 
    Write-Host "FAIL Performance Report 7-B: HTTP $([int]$_.Exception.Response.StatusCode)" 
}

try { 
    $r = Invoke-WebRequest -Uri "$API/teacher/reports/tasks?classNum=7&section=B" -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $($te.accessToken)"} -UseBasicParsing
    Write-Host "PASS Task Report 7-B: HTTP $($r.StatusCode) | $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))"
} catch { 
    Write-Host "FAIL Task Report 7-B: HTTP $([int]$_.Exception.Response.StatusCode)" 
}
