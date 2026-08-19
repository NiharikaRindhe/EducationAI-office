$API = "http://localhost:4000/api"

Write-Host "--- Fresh Logins ---"
$te = (Invoke-WebRequest -Uri "$API/auth/login" -Method POST -Body '{"email":"mr.rao.5d2a15@sps.delhi.01.eduai.local","password":"SmokeTest123!"}' -Headers @{"Content-Type"="application/json"} -UseBasicParsing).Content | ConvertFrom-Json
$sc = (Invoke-WebRequest -Uri "$API/auth/login" -Method POST -Body '{"email":"e2e-admin@eduai.local","password":"Test-Admin-1"}' -Headers @{"Content-Type"="application/json"} -UseBasicParsing).Content | ConvertFrom-Json

# T-47 FIX: Ticket requires category, subject, body
Write-Host "--- Ticket with correct schema ---"
$tktBody = '{"category":"technical","subject":"Test Bug Report","body":"Testing ticket creation with correct schema"}'
try { 
    $r = Invoke-WebRequest -Uri "$API/tickets" -Method POST -Body $tktBody -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $($te.accessToken)"} -UseBasicParsing
    Write-Host "PASS Ticket: HTTP $($r.StatusCode) | $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))"
} catch { 
    Write-Host "FAIL Ticket: HTTP $([int]$_.Exception.Response.StatusCode)" 
}

# T-11 FIX: Task requires assignTo discriminated union
Write-Host "--- Task with correct schema ---"
$taskBody = '{"title":"Test Homework","subject":"English","assignTo":{"mode":"class","classNum":2,"section":"A"}}'
try { 
    $r = Invoke-WebRequest -Uri "$API/teacher/tasks" -Method POST -Body $taskBody -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $($te.accessToken)"} -UseBasicParsing
    Write-Host "PASS Task: HTTP $($r.StatusCode) | $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))"
} catch { 
    Write-Host "FAIL Task: HTTP $([int]$_.Exception.Response.StatusCode)" 
}

# SC-15 FIX: Teacher add with classesTaught as array
Write-Host "--- Teacher add with correct schema ---"
$tBody = '{"fullName":"Correct Teacher 123","employeeId":"EMP999","specialization":"Science","classesTaught":[6,7,8]}'
try { 
    $r = Invoke-WebRequest -Uri "$API/school-admin/teachers" -Method POST -Body $tBody -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $($sc.accessToken)"} -UseBasicParsing
    Write-Host "PASS Teacher: HTTP $($r.StatusCode) | $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))"
} catch { 
    Write-Host "FAIL Teacher: HTTP $([int]$_.Exception.Response.StatusCode)" 
}

# T-39 FIX: Reports with correct class (Mr. Rao teaches 2,3,7)
Write-Host "--- Teacher reports for assigned class (Class 7-A) ---"
try { 
    $r = Invoke-WebRequest -Uri "$API/teacher/reports/performance?classNum=7&section=A" -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $($te.accessToken)"} -UseBasicParsing
    Write-Host "PASS Perf Report: HTTP $($r.StatusCode)"
} catch { 
    Write-Host "FAIL Perf Report: HTTP $([int]$_.Exception.Response.StatusCode)" 
}

try { 
    $r = Invoke-WebRequest -Uri "$API/teacher/reports/tasks?classNum=7&section=A" -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $($te.accessToken)"} -UseBasicParsing
    Write-Host "PASS Task Report: HTTP $($r.StatusCode)"
} catch { 
    Write-Host "FAIL Task Report: HTTP $([int]$_.Exception.Response.StatusCode)" 
}

# T-24 FIX: Exam generator for assigned class
Write-Host "--- Exam generator for assigned class 7 ---"
try { 
    $r = Invoke-WebRequest -Uri "$API/teacher/exam-generator/chapters?classNum=7&subject=Science" -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $($te.accessToken)"} -UseBasicParsing
    Write-Host "PASS ExamGen: HTTP $($r.StatusCode) | $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))"
} catch { 
    Write-Host "FAIL ExamGen: HTTP $([int]$_.Exception.Response.StatusCode)" 
}

# Check Ollama
Write-Host "--- Ollama Check ---"
try { 
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:11434" -UseBasicParsing -TimeoutSec 3
    Write-Host "Ollama UP: $($r.Content)"
} catch { 
    Write-Host "Ollama status: $($_.Exception.Message)"
}
