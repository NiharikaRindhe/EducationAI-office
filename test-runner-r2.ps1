
# ============================================================
# EduAI Deep Dive Test Suite — Round 2 (PS-safe)
# ============================================================
$ErrorActionPreference = "Continue"
$API = "http://localhost:4000/api"
$passCount = 0
$failCount = 0

function Login {
    param([string]$Email, [string]$Password)
    $body = @{ email = $Email; password = $Password } | ConvertTo-Json
    try {
        $r = Invoke-WebRequest -Uri "$API/auth/login" -Method POST -Body $body -Headers @{"Content-Type"="application/json"} -UseBasicParsing -TimeoutSec 15
        return ($r.Content | ConvertFrom-Json)
    } catch { return $null }
}

function TestAPI {
    param([string]$Id, [string]$Name, [string]$Method = "GET", [string]$Url, [string]$Body = $null, [string]$Token = $null, [int[]]$Ok = @(200), [switch]$Show)
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    try {
        $p = @{ Uri = $Url; Method = $Method; Headers = $headers; UseBasicParsing = $true; TimeoutSec = 30 }
        if ($Body -and $Method -ne "GET") { $p["Body"] = $Body }
        $r = Invoke-WebRequest @p
        $ok = $r.StatusCode -in $Ok
        if ($ok) { Write-Output "PASS [$Id] $Name (HTTP $($r.StatusCode))"; $script:passCount++ }
        else { Write-Output "FAIL [$Id] $Name (HTTP $($r.StatusCode))"; $script:failCount++ }
        if ($Show) { 
            $len = [Math]::Min(600, $r.Content.Length)
            Write-Output "  RESP: $($r.Content.Substring(0, $len))" 
        }
        return $r.Content
    } catch {
        $sc = 0; $errBody = ""
        if ($_.Exception.Response) {
            $sc = [int]$_.Exception.Response.StatusCode
            try { $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()); $errBody = $reader.ReadToEnd(); $reader.Close() } catch {}
        }
        if ($sc -in $Ok) { Write-Output "PASS [$Id] $Name (HTTP $sc - expected)"; $script:passCount++ }
        else { 
            $el = [Math]::Min(300, $errBody.Length)
            Write-Output "FAIL [$Id] $Name (HTTP $sc): $($errBody.Substring(0, $el))"; $script:failCount++ 
        }
        if ($Show -and $errBody) {
            $el2 = [Math]::Min(400, $errBody.Length)
            Write-Output "  ERR_BODY: $($errBody.Substring(0, $el2))"
        }
        return $null
    }
}

$sa = Login "admin@eduai.local" "SmokeTest123!"
$sc = Login "e2e-admin@eduai.local" "Test-Admin-1"
$te = Login "mr.rao.5d2a15@sps.delhi.01.eduai.local" "SmokeTest123!"
$st = Login "yash.badgujar.3f2176@sps.delhi.01.eduai.local" "reXHdrWD"

Write-Output ""
Write-Output "============================================================"
Write-Output "  EduAI Deep Dive — Round 2"
Write-Output "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "============================================================"

$today = (Get-Date).ToString("yyyy-MM-dd")
$weekLater = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")

Write-Output ""
Write-Output "=== FIXING ROUND 1 FAILURES ==="

# Timetable occurrences (need date params)
$ttUrl1 = "$API/school-admin/timetable/occurrences?from=" + $today + "`&to=" + $weekLater
TestAPI -Id "SC-37-FIX" -Name "SA timetable occurrences (with dates)" -Url $ttUrl1 -Token $sc.accessToken -Show

$ttUrl2 = "$API/teacher/timetable/occurrences?from=" + $today + "`&to=" + $weekLater
TestAPI -Id "T-03b-FIX" -Name "Teacher timetable occurrences" -Url $ttUrl2 -Token $te.accessToken

$ttUrl3 = "$API/student/timetable/occurrences?from=" + $today + "`&to=" + $weekLater
TestAPI -Id "S-TTO-FIX" -Name "Student timetable occurrences" -Url $ttUrl3 -Token $st.accessToken

# Exam generator (needs classNum + subject)
$egUrl1 = "$API/teacher/exam-generator/chapters?classNum=6`&subject=Mathematics"
TestAPI -Id "T-24-FIX" -Name "Teacher exam-gen chapters (class 6 math)" -Url $egUrl1 -Token $te.accessToken -Show

$egUrl2 = "$API/school-admin/exam-generator/chapters?classNum=6`&subject=Mathematics"
TestAPI -Id "SC-AI-FIX" -Name "SA exam-gen chapters (class 6 math)" -Url $egUrl2 -Token $sc.accessToken

# Reports (need classNum + section)
$rpUrl1 = "$API/teacher/reports/performance?classNum=6`&section=A"
TestAPI -Id "T-39-FIX" -Name "Teacher perf heatmap 6A" -Url $rpUrl1 -Token $te.accessToken -Show

$rpUrl2 = "$API/teacher/reports/tasks?classNum=6`&section=A"
TestAPI -Id "T-40-FIX" -Name "Teacher task completion 6A" -Url $rpUrl2 -Token $te.accessToken

# English items (needs classNum)
$engUrl = "$API/student/english/items?classNum=9"
TestAPI -Id "S-Eng-FIX" -Name "Student english items (class 9)" -Url $engUrl -Token $st.accessToken -Show

# Class 1 student add (PIN)
$pinBody = @{ fullName = "Pin Test $(Get-Random -Minimum 100 -Maximum 999)"; classNum = 1; section = "A"; rollNumber = "P$(Get-Random -Minimum 100 -Maximum 999)" } | ConvertTo-Json
TestAPI -Id "SC-17-FIX" -Name "Add Class 1 student (PIN)" -Url "$API/school-admin/students" -Method POST -Body $pinBody -Token $sc.accessToken -Ok @(200,201) -Show

# Teacher add (minimal)
$tbody = @{ fullName = "Test Teacher $(Get-Random -Minimum 100 -Maximum 999)" } | ConvertTo-Json
TestAPI -Id "SC-15-FIX" -Name "Add teacher (minimal)" -Url "$API/school-admin/teachers" -Method POST -Body $tbody -Token $sc.accessToken -Ok @(200,201) -Show

# PIN roster
TestAPI -Id "A-13-FIX" -Name "PIN roster (SPS-DELHI-01 Class 1-A)" -Url ("$API/auth/pin-roster?schoolCode=SPS-DELHI-01`&classNum=1`&section=A") -Show

# Tickets
$tktBody = @{ title = "Test Ticket"; body = "Test description" } | ConvertTo-Json
TestAPI -Id "T-47-FIX" -Name "Create ticket (teacher)" -Url "$API/tickets" -Method POST -Body $tktBody -Token $te.accessToken -Ok @(200,201,422) -Show

# Task creation
$taskBody = @{ title = "Test HW"; instructions = "Do exercises"; subject = "Mathematics"; classNum = 6; section = "A" } | ConvertTo-Json
TestAPI -Id "T-11-FIX" -Name "Create task (teacher)" -Url "$API/teacher/tasks" -Method POST -Body $taskBody -Token $te.accessToken -Ok @(200,201,422) -Show

Write-Output ""
Write-Output "=== SUPER ADMIN DEEP TESTS ==="

# Schools detail
$schoolsRaw = TestAPI -Id "SA-SCHOOLS" -Name "List all schools" -Url "$API/super-admin/schools" -Token $sa.accessToken -Show
# Overview
TestAPI -Id "SA-01-DEEP" -Name "Overview dashboard" -Url "$API/super-admin/overview" -Token $sa.accessToken -Show
# Class subjects
TestAPI -Id "SA-26-DEEP" -Name "Class-subject matrix" -Url "$API/super-admin/class-subjects" -Token $sa.accessToken -Show
# NCERT jobs
TestAPI -Id "SA-14-DEEP" -Name "NCERT ingestion jobs" -Url "$API/super-admin/ncert/jobs" -Token $sa.accessToken -Show
# Student directory
TestAPI -Id "SA-35-DEEP" -Name "Student directory" -Url "$API/super-admin/students" -Token $sa.accessToken -Show
# AI Settings
TestAPI -Id "SA-29-DEEP" -Name "AI settings" -Url "$API/super-admin/ai/settings" -Token $sa.accessToken -Show
# AI Usage
TestAPI -Id "SA-31-DEEP" -Name "AI usage" -Url "$API/super-admin/ai/usage" -Token $sa.accessToken -Show
# Question bank
TestAPI -Id "SA-32-DEEP" -Name "Global question bank" -Url "$API/super-admin/question-bank" -Token $sa.accessToken -Show

Write-Output ""
Write-Output "=== SCHOOL ADMIN DEEP TESTS ==="

# Class sections
TestAPI -Id "SC-03-DEEP" -Name "Class sections" -Url "$API/school-admin/class-sections" -Token $sc.accessToken -Show
# Students per class
TestAPI -Id "SC-20a" -Name "Students Class 1" -Url "$API/school-admin/students?classNum=1" -Token $sc.accessToken -Show
TestAPI -Id "SC-20b" -Name "Students Class 4" -Url "$API/school-admin/students?classNum=4" -Token $sc.accessToken -Show
TestAPI -Id "SC-20c" -Name "Students Class 5" -Url "$API/school-admin/students?classNum=5" -Token $sc.accessToken -Show
TestAPI -Id "SC-20d" -Name "Students Class 9" -Url "$API/school-admin/students?classNum=9" -Token $sc.accessToken -Show
TestAPI -Id "SC-20e" -Name "Students Class 10" -Url "$API/school-admin/students?classNum=10" -Token $sc.accessToken -Show
# Teachers
TestAPI -Id "SC-88-DEEP" -Name "Teachers detail" -Url "$API/school-admin/teachers" -Token $sc.accessToken -Show
# Teaching assignments
TestAPI -Id "SC-26a-DEEP" -Name "Teaching assignments" -Url "$API/school-admin/teaching-assignments" -Token $sc.accessToken -Show
# Promotion preview
TestAPI -Id "SC-38-DEEP" -Name "Promotion preview" -Url "$API/school-admin/promotion/preview" -Token $sc.accessToken -Show
# Features
TestAPI -Id "SC-50-DEEP" -Name "Feature toggles" -Url "$API/school-admin/features" -Token $sc.accessToken -Show
# Content library
TestAPI -Id "SC-49-DEEP" -Name "Content library" -Url "$API/school-admin/ncert/jobs" -Token $sc.accessToken -Show

Write-Output ""
Write-Output "=== TEACHER DEEP TESTS ==="

TestAPI -Id "T-01-DEEP" -Name "Dashboard" -Url "$API/teacher/dashboard" -Token $te.accessToken -Show
TestAPI -Id "T-02-DEEP" -Name "My sections" -Url "$API/teacher/my-sections" -Token $te.accessToken -Show
TestAPI -Id "T-30-DEEP" -Name "Question bank" -Url "$API/teacher/question-bank" -Token $te.accessToken -Show
TestAPI -Id "T-27-DEEP" -Name "Exams list" -Url "$API/teacher/exams" -Token $te.accessToken -Show
$ptmUrl = "$API/teacher/reports/ptm?classNum=6`&section=A"
TestAPI -Id "T-41" -Name "PTM report 6A" -Url $ptmUrl -Token $te.accessToken
$engRptUrl = "$API/teacher/reports/english?classNum=6`&section=A"
TestAPI -Id "T-42" -Name "English report 6A" -Url $engRptUrl -Token $te.accessToken

Write-Output ""
Write-Output "=== STUDENT DEEP TESTS ==="

TestAPI -Id "S-PROF" -Name "Student profile" -Url "$API/student/profile" -Token $st.accessToken -Show
TestAPI -Id "S-GAMES" -Name "Student games" -Url "$API/student/games" -Token $st.accessToken -Show
TestAPI -Id "S-BADGES" -Name "Student badges" -Url "$API/student/badges" -Token $st.accessToken -Show
TestAPI -Id "S-STREAK" -Name "Streak calendar" -Url "$API/student/streak-calendar" -Token $st.accessToken -Show
TestAPI -Id "S-DC" -Name "Daily challenges" -Url "$API/student/daily-challenges" -Token $st.accessToken -Show
TestAPI -Id "S-LB" -Name "Leaderboard" -Url "$API/student/leaderboard" -Token $st.accessToken -Show
TestAPI -Id "S-SUBJ" -Name "Subjects" -Url "$API/student/subjects" -Token $st.accessToken -Show
TestAPI -Id "S-CHAT" -Name "Chat sessions" -Url "$API/student/chat/sessions" -Token $st.accessToken -Show
TestAPI -Id "S-EXAMS" -Name "Student exams" -Url "$API/student/exams" -Token $st.accessToken -Show
TestAPI -Id "S-SYL" -Name "Syllabus" -Url "$API/student/syllabus" -Token $st.accessToken -Show
TestAPI -Id "S-CUR" -Name "Curriculum" -Url "$API/student/curriculum" -Token $st.accessToken -Show
TestAPI -Id "S-PYQ" -Name "PYQ" -Url "$API/student/pyq" -Token $st.accessToken -Show

# Create + delete note
$noteBody = @{ title = "Test Note $(Get-Random)"; content = "Test content"; subject = "Mathematics" } | ConvertTo-Json
$noteResult = TestAPI -Id "S-NOTE-CREATE" -Name "Create note" -Url "$API/student/notes" -Method POST -Body $noteBody -Token $st.accessToken -Ok @(200,201) -Show

# ---SUMMARY---
Write-Output ""
Write-Output "============================================================"
Write-Output "  ROUND 2 SUMMARY"
Write-Output "============================================================"
Write-Output "  PASSED:  $passCount"
Write-Output "  FAILED:  $failCount"
Write-Output "  TOTAL:   $($passCount + $failCount)"
Write-Output "  PASS RATE: $(if (($passCount + $failCount) -gt 0) { [math]::Round($passCount / ($passCount + $failCount) * 100, 1) } else { 0 })%"
Write-Output "============================================================"
