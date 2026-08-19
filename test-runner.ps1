
# ============================================================
# EduAI Production-Level Test Runner
# ============================================================
$ErrorActionPreference = "Continue"
$API = "http://localhost:4000/api"
$results = @()
$passCount = 0
$failCount = 0
$warnCount = 0

function Test-API {
    param(
        [string]$Id,
        [string]$Name,
        [string]$Method = "GET",
        [string]$Url,
        [string]$Body = $null,
        [string]$Token = $null,
        [int[]]$ExpectedStatus = @(200),
        [string]$ExpectContains = $null,
        [string]$ExpectNotContains = $null,
        [switch]$ReturnBody
    )
    
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            UseBasicParsing = $true
            TimeoutSec = 30
        }
        if ($Body -and $Method -ne "GET") { $params["Body"] = $Body }
        
        $response = Invoke-WebRequest @params
        $status = $response.StatusCode
        $content = $response.Content
        
        $pass = $status -in $ExpectedStatus
        if ($pass -and $ExpectContains) {
            $pass = $content -like "*$ExpectContains*"
        }
        if ($pass -and $ExpectNotContains) {
            $pass = $content -notlike "*$ExpectNotContains*"
        }
        
        if ($pass) {
            Write-Output "PASS [$Id] $Name (HTTP $status)"
            $script:passCount++
        } else {
            Write-Output "FAIL [$Id] $Name (HTTP $status, expected $($ExpectedStatus -join '/'))"
            $script:failCount++
        }
        
        if ($ReturnBody) { return $content }
        
    } catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        if ($statusCode -in $ExpectedStatus) {
            Write-Output "PASS [$Id] $Name (HTTP $statusCode - expected error)"
            $script:passCount++
        } else {
            $errMsg = $_.Exception.Message
            if ($statusCode -gt 0) {
                # Try to read response body for error details
                try {
                    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                    $errBody = $reader.ReadToEnd()
                    $reader.Close()
                    Write-Output "FAIL [$Id] $Name (HTTP $statusCode): $errBody"
                } catch {
                    Write-Output "FAIL [$Id] $Name (HTTP $statusCode): $errMsg"
                }
            } else {
                Write-Output "FAIL [$Id] $Name : $errMsg"
            }
            $script:failCount++
        }
        if ($ReturnBody -and $statusCode -in $ExpectedStatus) { return "" }
    }
}

function Login {
    param([string]$Email, [string]$Password)
    $body = @{ email = $Email; password = $Password } | ConvertTo-Json
    try {
        $r = Invoke-WebRequest -Uri "$API/auth/login" -Method POST -Body $body -Headers @{"Content-Type"="application/json"} -UseBasicParsing -TimeoutSec 15
        $data = $r.Content | ConvertFrom-Json
        return $data
    } catch {
        $statusCode = 0
        if ($_.Exception.Response) { $statusCode = [int]$_.Exception.Response.StatusCode }
        Write-Output "LOGIN_FAILED($statusCode): $($_.Exception.Message)"
        return $null
    }
}

Write-Output ""
Write-Output "============================================================"
Write-Output "  EduAI Production Test Suite"
Write-Output "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "============================================================"
Write-Output ""

# ──────────────────────────────────────────────────────────────
#  SECTION 1: AUTHENTICATION TESTS
# ──────────────────────────────────────────────────────────────
Write-Output "═══ SECTION 1: AUTHENTICATION & SESSIONS ═══"
Write-Output ""

# A-01: Super Admin Login
Write-Output "--- A-01: Super Admin Login ---"
$superAdmin = Login -Email "admin@eduai.local" -Password "SmokeTest123!"
if ($superAdmin -and $superAdmin.accessToken) {
    Write-Output "PASS [A-01] Super Admin login successful (role: $($superAdmin.role), redirect: $($superAdmin.redirectPath))"
    $saToken = $superAdmin.accessToken
    $passCount++
    if ($superAdmin.role -ne "super_admin") { Write-Output "WARN [A-01] Role mismatch: expected super_admin, got $($superAdmin.role)"; $warnCount++ }
} else {
    Write-Output "FAIL [A-01] Super Admin login failed"
    $saToken = $null
    $failCount++
}

# A-02: School Admin Login
Write-Output "--- A-02: School Admin Login ---"
$schoolAdmin = Login -Email "e2e-admin@eduai.local" -Password "Test-Admin-1"
if ($schoolAdmin -and $schoolAdmin.accessToken) {
    Write-Output "PASS [A-02] School Admin login successful (role: $($schoolAdmin.role), redirect: $($schoolAdmin.redirectPath))"
    $scToken = $schoolAdmin.accessToken
    $passCount++
} else {
    Write-Output "FAIL [A-02] School Admin login failed"
    $scToken = $null
    $failCount++
}

# A-03: Teacher Login
Write-Output "--- A-03: Teacher Login ---"
$teacher = Login -Email "mr.rao.5d2a15@sps.delhi.01.eduai.local" -Password "SmokeTest123!"
if ($teacher -and $teacher.accessToken) {
    Write-Output "PASS [A-03] Teacher login successful (role: $($teacher.role), redirect: $($teacher.redirectPath))"
    $tToken = $teacher.accessToken
    $passCount++
} else {
    Write-Output "FAIL [A-03] Teacher login failed"
    $tToken = $null
    $failCount++
}

# A-04: Student Login
Write-Output "--- A-04: Student Login ---"
$student = Login -Email "yash.badgujar.3f2176@sps.delhi.01.eduai.local" -Password "reXHdrWD"
if ($student -and $student.accessToken) {
    Write-Output "PASS [A-04] Student login successful (role: $($student.role), redirect: $($student.redirectPath))"
    $stToken = $student.accessToken
    $passCount++
} else {
    Write-Output "FAIL [A-04] Student login failed"
    $stToken = $null
    $failCount++
}

# A-05: Wrong password
Write-Output "--- A-05: Wrong Password ---"
$wrongPwd = Login -Email "admin@eduai.local" -Password "WrongPassword123"
if (-not $wrongPwd -or -not $wrongPwd.accessToken) {
    Write-Output "PASS [A-05] Wrong password correctly rejected"
    $passCount++
} else {
    Write-Output "FAIL [A-05] Wrong password was accepted!"
    $failCount++
}

# A-06: Non-existent email
Write-Output "--- A-06: Non-existent Email ---"
$wrongEmail = Login -Email "nonexistent@eduai.local" -Password "SmokeTest123!"
if (-not $wrongEmail -or -not $wrongEmail.accessToken) {
    Write-Output "PASS [A-06] Non-existent email correctly rejected"
    $passCount++
} else {
    Write-Output "FAIL [A-06] Non-existent email was accepted!"
    $failCount++
}

# A-17: Token validation (/me endpoint)
Write-Output "--- A-17: Token Validation (GET /auth/me) ---"
if ($saToken) {
    Test-API -Id "A-17" -Name "GET /auth/me with valid token" -Url "$API/auth/me" -Token $saToken -ExpectContains "role"
}

# A-21: Invalid token
Write-Output "--- A-21: Invalid Token ---"
Test-API -Id "A-21" -Name "GET /auth/me with invalid token" -Url "$API/auth/me" -Token "invalid_token_123" -ExpectedStatus @(401)

# A-28-31: RBAC Tests
Write-Output ""
Write-Output "--- RBAC Tests ---"
if ($stToken) {
    Test-API -Id "A-28" -Name "Student cannot access teacher routes" -Url "$API/teacher/dashboard" -Token $stToken -ExpectedStatus @(403)
}
if ($tToken) {
    Test-API -Id "A-29" -Name "Teacher cannot access school-admin routes" -Url "$API/school-admin/students" -Token $tToken -ExpectedStatus @(403)
}
if ($scToken) {
    Test-API -Id "A-30" -Name "School Admin cannot access super-admin routes" -Url "$API/super-admin/schools" -Token $scToken -ExpectedStatus @(403)
}

# ──────────────────────────────────────────────────────────────
#  SECTION 2: SUPER ADMIN TESTS
# ──────────────────────────────────────────────────────────────
Write-Output ""
Write-Output "═══ SECTION 2: SUPER ADMIN PORTAL ═══"
Write-Output ""

if ($saToken) {
    # SA-01: Overview Dashboard
    Test-API -Id "SA-01" -Name "GET /super-admin/overview" -Url "$API/super-admin/overview" -Token $saToken -ExpectContains "school"
    
    # SA-03: List Schools
    $schoolsJson = Test-API -Id "SA-03" -Name "GET /super-admin/schools" -Url "$API/super-admin/schools" -Token $saToken -ReturnBody
    if ($schoolsJson) {
        try {
            $schools = $schoolsJson | ConvertFrom-Json
            $schoolCount = if ($schools -is [array]) { $schools.Count } else { 1 }
            Write-Output "  INFO: $schoolCount school(s) found"
            if ($schools -is [array] -and $schools.Count -gt 0) {
                $firstSchool = $schools[0]
                $testSchoolId = $firstSchool.id
                Write-Output "  INFO: First school: $($firstSchool.name) (code: $($firstSchool.code), id: $testSchoolId)"
            }
        } catch { Write-Output "  WARN: Could not parse schools response" }
    }
    
    # SA-07: School Detail
    if ($testSchoolId) {
        Test-API -Id "SA-07" -Name "GET /super-admin/schools/:id" -Url "$API/super-admin/schools/$testSchoolId" -Token $saToken -ExpectContains "name"
    }
    
    # SA-26: Class-Subject Whitelist
    Test-API -Id "SA-26" -Name "GET /super-admin/class-subjects" -Url "$API/super-admin/class-subjects" -Token $saToken -ExpectContains "subject"
    
    # SA-29: AI Settings
    Test-API -Id "SA-29" -Name "GET /super-admin/ai/settings" -Url "$API/super-admin/ai/settings" -Token $saToken
    
    # SA-31: AI Usage
    Test-API -Id "SA-31" -Name "GET /super-admin/ai/usage" -Url "$API/super-admin/ai/usage" -Token $saToken
    
    # SA-32: Global Question Bank
    Test-API -Id "SA-32" -Name "GET /super-admin/question-bank" -Url "$API/super-admin/question-bank" -Token $saToken
    
    # SA-35: Cross-School Student Directory
    Test-API -Id "SA-35" -Name "GET /super-admin/students" -Url "$API/super-admin/students" -Token $saToken
    
    # SA-38: Audit Log
    Test-API -Id "SA-38" -Name "GET /super-admin/audit-log" -Url "$API/super-admin/audit-log" -Token $saToken
    
    # SA-14/15: NCERT Ingestion Jobs
    Test-API -Id "SA-14" -Name "GET /super-admin/ncert/jobs" -Url "$API/super-admin/ncert/jobs" -Token $saToken

    # SA-04: Create a test school
    Write-Output "--- SA-04: Create New School ---"
    $newSchoolBody = @{
        name = "Test Academy $(Get-Random -Minimum 1000 -Maximum 9999)"
        code = "TEST-$(Get-Random -Minimum 100 -Maximum 999)"
        board = "CBSE"
        city = "Mumbai"
        state = "Maharashtra"
        plan = "starter"
        createAdmin = $true
    } | ConvertTo-Json
    $createResult = Test-API -Id "SA-04" -Name "POST /super-admin/schools (create school)" -Url "$API/super-admin/schools" -Method POST -Body $newSchoolBody -Token $saToken -ExpectedStatus @(200,201) -ReturnBody
    if ($createResult) {
        try {
            $created = $createResult | ConvertFrom-Json
            Write-Output "  INFO: Created school: $($created.school.name) (code: $($created.school.code))"
            if ($created.admin) {
                Write-Output "  INFO: Admin email: $($created.admin.email)"
                Write-Output "  INFO: Admin password provided: $($created.admin.password -ne $null)"
            }
            $newSchoolId = $created.school.id
        } catch { Write-Output "  WARN: Could not parse create response" }
    }
    
    # SA-05: Duplicate school code test
    if ($schools -is [array] -and $schools.Count -gt 0) {
        Write-Output "--- SA-05: Duplicate School Code ---"
        $dupBody = @{
            name = "Duplicate Test"
            code = $schools[0].code
            board = "CBSE"
            city = "Delhi"
            state = "Delhi"
        } | ConvertTo-Json
        Test-API -Id "SA-05" -Name "POST /super-admin/schools (duplicate code)" -Url "$API/super-admin/schools" -Method POST -Body $dupBody -Token $saToken -ExpectedStatus @(400,409,422)
    }
    
    # SA-09: Deactivate school (use newly created school)
    if ($newSchoolId) {
        Write-Output "--- SA-09: Toggle School Active ---"
        $deactivateBody = @{ isActive = $false } | ConvertTo-Json
        Test-API -Id "SA-09" -Name "PATCH /super-admin/schools/:id/active (deactivate)" -Url "$API/super-admin/schools/$newSchoolId/active" -Method PATCH -Body $deactivateBody -Token $saToken
        
        # SA-10: Reactivate
        $reactivateBody = @{ isActive = $true } | ConvertTo-Json
        Test-API -Id "SA-10" -Name "PATCH /super-admin/schools/:id/active (reactivate)" -Url "$API/super-admin/schools/$newSchoolId/active" -Method PATCH -Body $reactivateBody -Token $saToken
    }
    
} else {
    Write-Output "SKIP: Super Admin tests skipped (no token)"
}

# ──────────────────────────────────────────────────────────────
#  SECTION 3: SCHOOL ADMIN TESTS
# ──────────────────────────────────────────────────────────────
Write-Output ""
Write-Output "═══ SECTION 3: SCHOOL ADMIN PORTAL ═══"
Write-Output ""

if ($scToken) {
    # SC-01: Dashboard activity
    Test-API -Id "SC-01a" -Name "GET /school-admin/activity" -Url "$API/school-admin/activity" -Token $scToken
    
    # SC-03: Class Sections
    $sectionsJson = Test-API -Id "SC-03" -Name "GET /school-admin/class-sections" -Url "$API/school-admin/class-sections" -Token $scToken -ReturnBody
    if ($sectionsJson) {
        try {
            $sections = $sectionsJson | ConvertFrom-Json
            $sectionCount = if ($sections -is [array]) { $sections.Count } else { 1 }
            Write-Output "  INFO: $sectionCount class-section(s) found"
        } catch {}
    }
    
    # SC-19: Student Directory
    $studentsJson = Test-API -Id "SC-19" -Name "GET /school-admin/students/directory" -Url "$API/school-admin/students/directory" -Token $scToken -ReturnBody
    if ($studentsJson) {
        try {
            $studData = $studentsJson | ConvertFrom-Json
            Write-Output "  INFO: Student directory loaded, total: $($studData.total)"
        } catch {}
    }
    
    # SC-83: Legacy student list
    $legacyStudents = Test-API -Id "SC-83" -Name "GET /school-admin/students" -Url "$API/school-admin/students" -Token $scToken -ReturnBody
    if ($legacyStudents) {
        try {
            $ls = $legacyStudents | ConvertFrom-Json
            $lsCount = if ($ls -is [array]) { $ls.Count } else { 1 }
            Write-Output "  INFO: Legacy students endpoint: $lsCount student(s)"
        } catch {}
    }
    
    # SC-88: Teacher list
    $teachersJson = Test-API -Id "SC-88" -Name "GET /school-admin/teachers" -Url "$API/school-admin/teachers" -Token $scToken -ReturnBody
    if ($teachersJson) {
        try {
            $teachers = $teachersJson | ConvertFrom-Json
            $tCount = if ($teachers -is [array]) { $teachers.Count } else { 1 }
            Write-Output "  INFO: $tCount teacher(s) found"
        } catch {}
    }
    
    # SC-26: Teaching Assignments
    Test-API -Id "SC-26" -Name "GET /school-admin/teaching-assignments" -Url "$API/school-admin/teaching-assignments" -Token $scToken
    
    # SC-97: Subjects
    Test-API -Id "SC-97" -Name "GET /school-admin/subjects" -Url "$API/school-admin/subjects" -Token $scToken
    
    # SC-30: Timetable
    Test-API -Id "SC-30" -Name "GET /school-admin/timetable" -Url "$API/school-admin/timetable" -Token $scToken
    
    # SC-37: Timetable Occurrences
    Test-API -Id "SC-37" -Name "GET /school-admin/timetable/occurrences" -Url "$API/school-admin/timetable/occurrences" -Token $scToken
    
    # SC-50: Feature Toggles
    Test-API -Id "SC-50" -Name "GET /school-admin/features" -Url "$API/school-admin/features" -Token $scToken
    
    # SC-51: Principal Report
    Test-API -Id "SC-51" -Name "GET /school-admin/reports/principal" -Url "$API/school-admin/reports/principal" -Token $scToken
    
    # SC-52: Labs
    Test-API -Id "SC-52" -Name "GET /school-admin/labs" -Url "$API/school-admin/labs" -Token $scToken
    
    # SC-53: Lab In-charges
    Test-API -Id "SC-53" -Name "GET /school-admin/lab-incharges" -Url "$API/school-admin/lab-incharges" -Token $scToken
    
    # SC-38: Promotion Preview
    Test-API -Id "SC-38" -Name "GET /school-admin/promotion/preview" -Url "$API/school-admin/promotion/preview" -Token $scToken
    
    # SC-49: Content Library
    Test-API -Id "SC-49" -Name "GET /school-admin/ncert/jobs" -Url "$API/school-admin/ncert/jobs" -Token $scToken
    
    # SC-16: Add Single Student (mid-year)
    Write-Output "--- SC-16: Add Single Student ---"
    $addStudentBody = @{
        fullName = "Test Student $(Get-Random -Minimum 100 -Maximum 999)"
        classNum = 6
        section = "A"
        rollNumber = "T$(Get-Random -Minimum 100 -Maximum 999)"
    } | ConvertTo-Json
    $addStudentResult = Test-API -Id "SC-16" -Name "POST /school-admin/students (add single student Class 6)" -Url "$API/school-admin/students" -Method POST -Body $addStudentBody -Token $scToken -ExpectedStatus @(200,201) -ReturnBody
    if ($addStudentResult) {
        try {
            $newStudent = $addStudentResult | ConvertFrom-Json
            Write-Output "  INFO: Student created - email: $($newStudent.email), password provided: $($newStudent.password -ne $null)"
            $testStudentId = $newStudent.userId
        } catch { Write-Output "  INFO: Response: $addStudentResult" }
    }
    
    # SC-17: Add Class 1 Student (should get PIN)
    Write-Output "--- SC-17: Add Class 1 Student (PIN login) ---"
    $addPinStudentBody = @{
        fullName = "Little Test $(Get-Random -Minimum 100 -Maximum 999)"
        classNum = 1
        section = "A"
        rollNumber = "P$(Get-Random -Minimum 100 -Maximum 999)"
    } | ConvertTo-Json
    $addPinResult = Test-API -Id "SC-17" -Name "POST /school-admin/students (add Class 1 - expects PIN)" -Url "$API/school-admin/students" -Method POST -Body $addPinStudentBody -Token $scToken -ExpectedStatus @(200,201) -ReturnBody
    if ($addPinResult) {
        try {
            $pinStudent = $addPinResult | ConvertFrom-Json
            $hasPin = $pinStudent.pin -ne $null
            Write-Output "  INFO: Class 1 student - has PIN: $hasPin"
            if ($hasPin) { Write-Output "PASS [SC-17b] Class 1 student correctly received PIN"; $passCount++ }
            else { Write-Output "FAIL [SC-17b] Class 1 student did NOT receive PIN"; $failCount++ }
            $testPinStudentId = $pinStudent.userId
        } catch {}
    }
    
    # SC-15: Add Single Teacher
    Write-Output "--- SC-15: Add Single Teacher ---"
    $addTeacherBody = @{
        fullName = "Test Teacher $(Get-Random -Minimum 100 -Maximum 999)"
        employeeId = "EMP$(Get-Random -Minimum 1000 -Maximum 9999)"
        specialization = "Mathematics"
        classesTaught = "6,7,8"
    } | ConvertTo-Json
    $addTeacherResult = Test-API -Id "SC-15" -Name "POST /school-admin/teachers (add single teacher)" -Url "$API/school-admin/teachers" -Method POST -Body $addTeacherBody -Token $scToken -ExpectedStatus @(200,201) -ReturnBody
    if ($addTeacherResult) {
        try {
            $newTeacher = $addTeacherResult | ConvertFrom-Json
            Write-Output "  INFO: Teacher created - email: $($newTeacher.email), password provided: $($newTeacher.password -ne $null)"
            $testTeacherId = $newTeacher.userId
        } catch { Write-Output "  INFO: Response: $addTeacherResult" }
    }
    
    # SC-24: Reset student credential
    if ($testStudentId) {
        Write-Output "--- A-24: Reset Student Credential ---"
        Test-API -Id "A-24" -Name "POST /school-admin/students/:id/reset-credentials" -Url "$API/school-admin/students/$testStudentId/reset-credentials" -Method POST -Token $scToken -ExpectContains "password"
    }
    
    # SC-25: Reset teacher password
    if ($testTeacherId) {
        Write-Output "--- A-25: Reset Teacher Password ---"
        Test-API -Id "A-25" -Name "POST /school-admin/teachers/:id/reset-password" -Url "$API/school-admin/teachers/$testTeacherId/reset-password" -Method POST -Token $scToken
    }
    
    # SC-25: Export student directory
    Write-Output "--- SC-25: Export Student CSV ---"
    Test-API -Id "SC-25" -Name "GET /school-admin/students/directory/export" -Url "$API/school-admin/students/directory/export" -Token $scToken
    
    # AI Exam Generator (school admin can also use)
    Test-API -Id "SC-AI" -Name "GET /school-admin/exam-generator/chapters" -Url "$API/school-admin/exam-generator/chapters" -Token $scToken
    
} else {
    Write-Output "SKIP: School Admin tests skipped (no token)"
}

# ──────────────────────────────────────────────────────────────
#  SECTION 4: TEACHER TESTS
# ──────────────────────────────────────────────────────────────
Write-Output ""
Write-Output "═══ SECTION 4: TEACHER PORTAL ═══"
Write-Output ""

if ($tToken) {
    # T-01: Dashboard
    Test-API -Id "T-01" -Name "GET /teacher/dashboard" -Url "$API/teacher/dashboard" -Token $tToken
    
    # T-02: My Sections
    $mySections = Test-API -Id "T-02" -Name "GET /teacher/my-sections" -Url "$API/teacher/my-sections" -Token $tToken -ReturnBody
    if ($mySections) {
        try {
            $secs = $mySections | ConvertFrom-Json
            $secCount = if ($secs -is [array]) { $secs.Count } else { 1 }
            Write-Output "  INFO: Teacher has $secCount assigned section(s)"
        } catch {}
    }
    
    # T-03: Timetable
    Test-API -Id "T-03" -Name "GET /teacher/timetable" -Url "$API/teacher/timetable" -Token $tToken
    
    # T-43: Student List
    Test-API -Id "T-43" -Name "GET /teacher/students" -Url "$API/teacher/students" -Token $tToken
    
    # T-43b: Student Directory
    Test-API -Id "T-43b" -Name "GET /teacher/students/directory" -Url "$API/teacher/students/directory" -Token $tToken
    
    # T-45: At-risk students
    Test-API -Id "T-45" -Name "GET /teacher/at-risk" -Url "$API/teacher/at-risk" -Token $tToken
    
    # T-06: Check active session
    Test-API -Id "T-06a" -Name "GET /teacher/sessions/active" -Url "$API/teacher/sessions/active" -Token $tToken
    
    # T-12: Task list
    Test-API -Id "T-12" -Name "GET /teacher/tasks" -Url "$API/teacher/tasks" -Token $tToken
    
    # T-30: Question Bank
    Test-API -Id "T-30" -Name "GET /teacher/question-bank" -Url "$API/teacher/question-bank" -Token $tToken
    
    # T-27: Exam List
    $examsJson = Test-API -Id "T-27" -Name "GET /teacher/exams" -Url "$API/teacher/exams" -Token $tToken -ReturnBody
    if ($examsJson) {
        try {
            $exams = $examsJson | ConvertFrom-Json
            $examCount = if ($exams -is [array]) { $exams.Count } else { 1 }
            Write-Output "  INFO: $examCount exam(s) found"
        } catch {}
    }
    
    # T-38: Pending Reviews
    Test-API -Id "T-38" -Name "GET /teacher/pending-reviews" -Url "$API/teacher/pending-reviews" -Token $tToken
    
    # T-24: AI Exam Generator - list chapters
    Test-API -Id "T-24" -Name "GET /teacher/exam-generator/chapters" -Url "$API/teacher/exam-generator/chapters" -Token $tToken
    
    # T-39: Reports - Performance Heatmap
    Test-API -Id "T-39" -Name "GET /teacher/reports/performance" -Url "$API/teacher/reports/performance" -Token $tToken
    
    # T-40: Reports - Task Completion
    Test-API -Id "T-40" -Name "GET /teacher/reports/tasks" -Url "$API/teacher/reports/tasks" -Token $tToken
    
    # T-03b: Teacher Timetable Occurrences
    Test-API -Id "T-03b" -Name "GET /teacher/timetable/occurrences" -Url "$API/teacher/timetable/occurrences" -Token $tToken
    
    # T-Labs: Labs view
    Test-API -Id "T-Labs" -Name "GET /teacher/labs" -Url "$API/teacher/labs" -Token $tToken
    
    # T-06: Start Live Session
    Write-Output "--- T-06: Live Session Test ---"
    if ($mySections) {
        try {
            $secs = $mySections | ConvertFrom-Json
            if ($secs -is [array] -and $secs.Count -gt 0) {
                $firstSec = $secs[0]
                $sessionBody = @{
                    classNum = $firstSec.class_num
                    section = $firstSec.section_label
                    subject = if ($firstSec.subject) { $firstSec.subject } else { "Mathematics" }
                } | ConvertTo-Json
                $sessionResult = Test-API -Id "T-06" -Name "POST /teacher/sessions/start" -Url "$API/teacher/sessions/start" -Method POST -Body $sessionBody -Token $tToken -ExpectedStatus @(200,201) -ReturnBody
                if ($sessionResult) {
                    try {
                        $session = $sessionResult | ConvertFrom-Json
                        $sessionId = $session.id
                        Write-Output "  INFO: Live session started (id: $sessionId) for Class $($firstSec.class_num)-$($firstSec.section_label)"
                    } catch {}
                }
            }
        } catch {}
    }
    
    # T-09: End session
    if ($sessionId) {
        Start-Sleep -Seconds 2
        Test-API -Id "T-09" -Name "POST /teacher/sessions/:id/end" -Url "$API/teacher/sessions/$sessionId/end" -Method POST -Token $tToken
    }
    
    # T-11: Create task
    Write-Output "--- T-11: Create Task ---"
    $taskBody = @{
        title = "Test Homework Assignment"
        subject = "Mathematics"
        instructions = "Complete exercises 1-5 from Chapter 3"
        classNum = 6
        section = "A"
        dueDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
    } | ConvertTo-Json
    Test-API -Id "T-11" -Name "POST /teacher/tasks (create task)" -Url "$API/teacher/tasks" -Method POST -Body $taskBody -Token $tToken -ExpectedStatus @(200,201)
    
} else {
    Write-Output "SKIP: Teacher tests skipped (no token)"
}

# ──────────────────────────────────────────────────────────────
#  SECTION 5: STUDENT TESTS
# ──────────────────────────────────────────────────────────────
Write-Output ""
Write-Output "═══ SECTION 5: STUDENT PORTAL ═══"
Write-Output ""

if ($stToken) {
    # Profile & Gamification
    Test-API -Id "S-01" -Name "GET /student/profile" -Url "$API/student/profile" -Token $stToken -ExpectContains "class_num"
    Test-API -Id "S-02" -Name "GET /student/badges" -Url "$API/student/badges" -Token $stToken
    Test-API -Id "S-03" -Name "GET /student/streak-calendar" -Url "$API/student/streak-calendar" -Token $stToken
    Test-API -Id "S-04" -Name "GET /student/daily-challenges" -Url "$API/student/daily-challenges" -Token $stToken
    Test-API -Id "S-05" -Name "GET /student/leaderboard" -Url "$API/student/leaderboard" -Token $stToken
    
    # Games
    $gamesJson = Test-API -Id "S1-04" -Name "GET /student/games" -Url "$API/student/games" -Token $stToken -ReturnBody
    if ($gamesJson) {
        try {
            $games = $gamesJson | ConvertFrom-Json
            $gCount = if ($games -is [array]) { $games.Count } else { 0 }
            Write-Output "  INFO: $gCount game(s) available for this student"
        } catch {}
    }
    
    # Exams
    Test-API -Id "S2-03" -Name "GET /student/exams" -Url "$API/student/exams" -Token $stToken
    
    # Tasks
    Test-API -Id "S2-27" -Name "GET /student/tasks" -Url "$API/student/tasks" -Token $stToken
    
    # Announcements
    Test-API -Id "S-Ann" -Name "GET /student/announcements" -Url "$API/student/announcements" -Token $stToken
    
    # Subjects
    Test-API -Id "S-Sub" -Name "GET /student/subjects" -Url "$API/student/subjects" -Token $stToken
    
    # Curriculum
    Test-API -Id "S-Cur" -Name "GET /student/curriculum" -Url "$API/student/curriculum" -Token $stToken
    
    # Syllabus
    Test-API -Id "S-Syl" -Name "GET /student/syllabus" -Url "$API/student/syllabus" -Token $stToken
    
    # Timetable
    Test-API -Id "S-TT" -Name "GET /student/timetable" -Url "$API/student/timetable" -Token $stToken
    Test-API -Id "S-TTO" -Name "GET /student/timetable/occurrences" -Url "$API/student/timetable/occurrences" -Token $stToken
    
    # Notes
    Test-API -Id "S2-17" -Name "GET /student/notes" -Url "$API/student/notes" -Token $stToken
    
    # PYQ
    Test-API -Id "S2-26" -Name "GET /student/pyq" -Url "$API/student/pyq" -Token $stToken
    
    # Chat sessions
    Test-API -Id "S2-09" -Name "GET /student/chat/sessions" -Url "$API/student/chat/sessions" -Token $stToken
    
    # Live session (student side)
    Test-API -Id "S-Live" -Name "GET /student/sessions/active" -Url "$API/student/sessions/active" -Token $stToken
    
    # English assessment
    Test-API -Id "S-Eng" -Name "GET /student/english/items" -Url "$API/student/english/items" -Token $stToken
    Test-API -Id "S-EngP" -Name "GET /student/english/progress" -Url "$API/student/english/progress" -Token $stToken
    
    # Create a note
    Write-Output "--- S2-17: Create Note ---"
    $noteBody = @{
        title = "Test Note $(Get-Random)"
        content = "This is a test note created during production testing"
        subject = "Mathematics"
    } | ConvertTo-Json
    $noteResult = Test-API -Id "S2-17b" -Name "POST /student/notes (create note)" -Url "$API/student/notes" -Method POST -Body $noteBody -Token $stToken -ExpectedStatus @(200,201) -ReturnBody
    if ($noteResult) {
        try {
            $note = $noteResult | ConvertFrom-Json
            $testNoteId = $note.id
            Write-Output "  INFO: Note created (id: $testNoteId)"
        } catch {}
    }
    
    # Delete the note
    if ($testNoteId) {
        Test-API -Id "S2-19" -Name "DELETE /student/notes/:id" -Url "$API/student/notes/$testNoteId" -Method DELETE -Token $stToken
    }
    
} else {
    Write-Output "SKIP: Student tests skipped (no token)"
}

# ──────────────────────────────────────────────────────────────
#  SECTION 6: PIN LOGIN TESTS
# ──────────────────────────────────────────────────────────────
Write-Output ""
Write-Output "═══ SECTION 6: PIN LOGIN (CLASS 1-4) ═══"
Write-Output ""

# A-13: PIN roster without active session
Test-API -Id "A-13" -Name "GET /auth/pin-roster (no active session)" -Url "$API/auth/pin-roster?schoolCode=SPS-DELHI-01&classNum=1&section=A" -ExpectedStatus @(200,400,404)

# A-16: Invalid school code
Test-API -Id "A-16" -Name "GET /auth/pin-roster (invalid school code)" -Url "$API/auth/pin-roster?schoolCode=INVALID-999&classNum=1&section=A" -ExpectedStatus @(200,400,404)

# ──────────────────────────────────────────────────────────────
#  SECTION 7: TICKET SYSTEM
# ──────────────────────────────────────────────────────────────
Write-Output ""
Write-Output "═══ SECTION 7: SUPPORT TICKETS ═══"
Write-Output ""

if ($tToken) {
    # T-47: Create ticket (as teacher)
    $ticketBody = @{
        subject = "Test Ticket - Feature Request"
        message = "This is a test support ticket created during production testing"
        category = "bug"
    } | ConvertTo-Json
    Test-API -Id "T-47" -Name "POST /tickets (create as teacher)" -Url "$API/tickets" -Method POST -Body $ticketBody -Token $tToken -ExpectedStatus @(200,201)
}

# ──────────────────────────────────────────────────────────────
#  SUMMARY
# ──────────────────────────────────────────────────────────────
Write-Output ""
Write-Output "============================================================"
Write-Output "  TEST SUMMARY"
Write-Output "============================================================"
Write-Output "  PASSED:  $passCount"
Write-Output "  FAILED:  $failCount"
Write-Output "  WARNINGS: $warnCount"
Write-Output "  TOTAL:   $($passCount + $failCount)"
Write-Output "  PASS RATE: $(if (($passCount + $failCount) -gt 0) { [math]::Round($passCount / ($passCount + $failCount) * 100, 1) } else { 0 })%"
Write-Output "============================================================"
Write-Output "  Completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "============================================================"
