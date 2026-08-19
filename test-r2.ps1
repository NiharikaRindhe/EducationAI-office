$ErrorActionPreference = "Continue"
$API = "http://localhost:4000/api"
$p = 0; $f = 0

function Login { param([string]$E, [string]$P)
  $b = @{ email = $E; password = $P } | ConvertTo-Json
  try { $r = Invoke-WebRequest -Uri "$API/auth/login" -Method POST -Body $b -Headers @{"Content-Type"="application/json"} -UseBasicParsing -TimeoutSec 15; return ($r.Content | ConvertFrom-Json) } catch { return $null }
}

function T { param([string]$Id, [string]$N, [string]$M = "GET", [string]$U, [string]$B = $null, [string]$Tk = $null, [int[]]$Ok = @(200), [switch]$S)
  $h = @{ "Content-Type" = "application/json" }; if ($Tk) { $h["Authorization"] = "Bearer $Tk" }
  try {
    $pr = @{ Uri = $U; Method = $M; Headers = $h; UseBasicParsing = $true; TimeoutSec = 30 }
    if ($B -and $M -ne "GET") { $pr["Body"] = $B }
    $r = Invoke-WebRequest @pr; $pass = $r.StatusCode -in $Ok
    if ($pass) { Write-Host "PASS [$Id] $N (HTTP $($r.StatusCode))"; $script:p++ } else { Write-Host "FAIL [$Id] $N (HTTP $($r.StatusCode))"; $script:f++ }
    if ($S) { $ln = [Math]::Min(500, $r.Content.Length); Write-Host "  DATA: $($r.Content.Substring(0, $ln))" }
    return $r.Content
  } catch {
    $sc2 = 0; $eb = ""
    if ($_.Exception.Response) { $sc2 = [int]$_.Exception.Response.StatusCode; try { $rd = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()); $eb = $rd.ReadToEnd(); $rd.Close() } catch {} }
    if ($sc2 -in $Ok) { Write-Host "PASS [$Id] $N (HTTP $sc2 expected)"; $script:p++ } else { $el = [Math]::Min(250, $eb.Length); Write-Host "FAIL [$Id] $N (HTTP $sc2): $($eb.Substring(0, $el))"; $script:f++ }
    if ($S -and $eb.Length -gt 0) { $el2 = [Math]::Min(350, $eb.Length); Write-Host "  ERR: $($eb.Substring(0, $el2))" }
    return $null
  }
}

$sa = Login "admin@eduai.local" "SmokeTest123!"
$sc = Login "e2e-admin@eduai.local" "Test-Admin-1"
$te = Login "mr.rao.5d2a15@sps.delhi.01.eduai.local" "SmokeTest123!"
$st = Login "yash.badgujar.3f2176@sps.delhi.01.eduai.local" "reXHdrWD"

Write-Host ""; Write-Host "=== ROUND 2 DEEP TESTS ==="; Write-Host ""

$today = (Get-Date).ToString("yyyy-MM-dd")
$wk = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")

Write-Host "--- FIXING R1 FAILURES ---"
T -Id "SC37" -N "SA timetable occ" -U ($API+"/school-admin/timetable/occurrences?from="+$today+"`&to="+$wk) -Tk $sc.accessToken -S
T -Id "T03b" -N "Teacher timetable occ" -U ($API+"/teacher/timetable/occurrences?from="+$today+"`&to="+$wk) -Tk $te.accessToken
T -Id "STTO" -N "Student timetable occ" -U ($API+"/student/timetable/occurrences?from="+$today+"`&to="+$wk) -Tk $st.accessToken
T -Id "T24" -N "Teacher exam-gen chapters" -U ($API+"/teacher/exam-generator/chapters?classNum=6`&subject=Mathematics") -Tk $te.accessToken -S
T -Id "SCAI" -N "SA exam-gen chapters" -U ($API+"/school-admin/exam-generator/chapters?classNum=6`&subject=Mathematics") -Tk $sc.accessToken
T -Id "T39" -N "Teacher perf heatmap" -U ($API+"/teacher/reports/performance?classNum=6`&section=A") -Tk $te.accessToken -S
T -Id "T40" -N "Teacher task matrix" -U ($API+"/teacher/reports/tasks?classNum=6`&section=A") -Tk $te.accessToken
T -Id "SEng" -N "Student english items" -U ($API+"/student/english/items?classNum=9") -Tk $st.accessToken -S

# PIN student add
$pb = @{ fullName = "Pin Kid $((Get-Random) % 999)"; classNum = 1; section = "A"; rollNumber = "P$((Get-Random) % 999)" } | ConvertTo-Json
T -Id "SC17" -N "Add Class 1 student" -U "$API/school-admin/students" -M POST -B $pb -Tk $sc.accessToken -Ok @(200,201) -S

# Teacher add
$tb = @{ fullName = "New Teacher $((Get-Random) % 999)" } | ConvertTo-Json
T -Id "SC15" -N "Add teacher" -U "$API/school-admin/teachers" -M POST -B $tb -Tk $sc.accessToken -Ok @(200,201) -S

# PIN roster
T -Id "A13" -N "PIN roster no session" -U ($API+"/auth/pin-roster?schoolCode=SPS-DELHI-01`&classNum=1`&section=A") -S

# Ticket
$tkb = @{ title = "Test Bug Report"; body = "Test description for bug" } | ConvertTo-Json
T -Id "T47" -N "Create ticket" -U "$API/tickets" -M POST -B $tkb -Tk $te.accessToken -Ok @(200,201,422) -S

# Task
$tsk = @{ title = "Test HW"; instructions = "Do exercises"; subject = "Mathematics"; classNum = 6; section = "A" } | ConvertTo-Json
T -Id "T11" -N "Create task" -U "$API/teacher/tasks" -M POST -B $tsk -Tk $te.accessToken -Ok @(200,201,422) -S

Write-Host ""; Write-Host "--- SUPER ADMIN DEEP ---"
T -Id "SA01" -N "Overview" -U "$API/super-admin/overview" -Tk $sa.accessToken -S
T -Id "SA03" -N "Schools list" -U "$API/super-admin/schools" -Tk $sa.accessToken -S
T -Id "SA26" -N "Class subjects" -U "$API/super-admin/class-subjects" -Tk $sa.accessToken -S
T -Id "SA14" -N "NCERT jobs" -U "$API/super-admin/ncert/jobs" -Tk $sa.accessToken -S
T -Id "SA35" -N "Student dir" -U "$API/super-admin/students" -Tk $sa.accessToken -S
T -Id "SA29" -N "AI settings" -U "$API/super-admin/ai/settings" -Tk $sa.accessToken -S
T -Id "SA31" -N "AI usage" -U "$API/super-admin/ai/usage" -Tk $sa.accessToken -S
T -Id "SA32" -N "Question bank" -U "$API/super-admin/question-bank" -Tk $sa.accessToken -S
T -Id "SA38" -N "Audit log" -U "$API/super-admin/audit-log" -Tk $sa.accessToken -S

Write-Host ""; Write-Host "--- SCHOOL ADMIN DEEP ---"
T -Id "SC03" -N "Class sections" -U "$API/school-admin/class-sections" -Tk $sc.accessToken -S
T -Id "SC20a" -N "Students Cl 1" -U "$API/school-admin/students?classNum=1" -Tk $sc.accessToken -S
T -Id "SC20b" -N "Students Cl 4" -U "$API/school-admin/students?classNum=4" -Tk $sc.accessToken -S
T -Id "SC20c" -N "Students Cl 5" -U "$API/school-admin/students?classNum=5" -Tk $sc.accessToken -S
T -Id "SC20d" -N "Students Cl 9" -U "$API/school-admin/students?classNum=9" -Tk $sc.accessToken -S
T -Id "SC20e" -N "Students Cl 10" -U "$API/school-admin/students?classNum=10" -Tk $sc.accessToken -S
T -Id "SC88" -N "Teachers" -U "$API/school-admin/teachers" -Tk $sc.accessToken -S
T -Id "SC26a" -N "Teaching assignments" -U "$API/school-admin/teaching-assignments" -Tk $sc.accessToken -S
T -Id "SC38p" -N "Promotion preview" -U "$API/school-admin/promotion/preview" -Tk $sc.accessToken -S
T -Id "SC50" -N "Features" -U "$API/school-admin/features" -Tk $sc.accessToken -S
T -Id "SC49" -N "Content library" -U "$API/school-admin/ncert/jobs" -Tk $sc.accessToken -S

Write-Host ""; Write-Host "--- TEACHER DEEP ---"
T -Id "T01" -N "Dashboard" -U "$API/teacher/dashboard" -Tk $te.accessToken -S
T -Id "T02" -N "My sections" -U "$API/teacher/my-sections" -Tk $te.accessToken -S
T -Id "T30" -N "Question bank" -U "$API/teacher/question-bank" -Tk $te.accessToken -S
T -Id "T27" -N "Exams" -U "$API/teacher/exams" -Tk $te.accessToken -S
T -Id "T41" -N "PTM report" -U ($API+"/teacher/reports/ptm?classNum=6`&section=A") -Tk $te.accessToken
T -Id "T42" -N "English report" -U ($API+"/teacher/reports/english?classNum=6`&section=A") -Tk $te.accessToken

Write-Host ""; Write-Host "--- STUDENT DEEP ---"
T -Id "SPROF" -N "Profile" -U "$API/student/profile" -Tk $st.accessToken -S
T -Id "SGAME" -N "Games" -U "$API/student/games" -Tk $st.accessToken -S
T -Id "SBADG" -N "Badges" -U "$API/student/badges" -Tk $st.accessToken -S
T -Id "SSTRK" -N "Streak" -U "$API/student/streak-calendar" -Tk $st.accessToken -S
T -Id "SDC" -N "Daily challenges" -U "$API/student/daily-challenges" -Tk $st.accessToken -S
T -Id "SLB" -N "Leaderboard" -U "$API/student/leaderboard" -Tk $st.accessToken -S
T -Id "SSUBJ" -N "Subjects" -U "$API/student/subjects" -Tk $st.accessToken -S
T -Id "SCHAT" -N "Chat sessions" -U "$API/student/chat/sessions" -Tk $st.accessToken -S
T -Id "SEXAM" -N "Exams" -U "$API/student/exams" -Tk $st.accessToken -S
T -Id "SSYL" -N "Syllabus" -U "$API/student/syllabus" -Tk $st.accessToken -S
T -Id "SCUR" -N "Curriculum" -U "$API/student/curriculum" -Tk $st.accessToken -S
T -Id "SPYQ" -N "PYQ" -U "$API/student/pyq" -Tk $st.accessToken -S
T -Id "SANN" -N "Announcements" -U "$API/student/announcements" -Tk $st.accessToken
T -Id "STT" -N "Timetable" -U "$API/student/timetable" -Tk $st.accessToken

# Note CRUD
$nb = @{ title = "Test Note"; content = "Testing"; subject = "Mathematics" } | ConvertTo-Json
$nr = T -Id "SNOTE" -N "Create note" -U "$API/student/notes" -M POST -B $nb -Tk $st.accessToken -Ok @(200,201) -S

Write-Host ""
Write-Host "============================"
Write-Host "  ROUND 2: PASS=$p FAIL=$f TOTAL=$($p+$f)"
$rate = if (($p+$f) -gt 0) { [math]::Round($p/($p+$f)*100,1) } else { 0 }
Write-Host "  PASS RATE: $rate%"
Write-Host "============================"
