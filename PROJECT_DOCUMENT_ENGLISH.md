# TestFlow — Enterprise Project Document (English)

---

## 1. WHAT IS THIS PROJECT

TestFlow is an online test platform that companies will use to conduct tests for their job candidates.

- You are the **SuperAdmin** — the owner of the platform
- Companies (Enterprises) will purchase the product
- Each company will have **HR users** inside it
- HR users will manage and test **Candidates**

---

## 2. WHO WILL BE IN THE SYSTEM

### SuperAdmin (You)
- Complete owner of the platform
- Adds/removes companies
- Can view all data across all companies
- Controls platform-level settings

### Enterprise (Client Company — e.g. Infosys, TCS)
- Purchases your product
- Creates and manages their own HR users
- Can only see their own data — not other companies

### HR (Employee inside the Enterprise)
- Adds candidates
- Creates tests
- Assigns tests to candidates
- Schedules interviews
- Posts job openings
- Can only see their own company's data

### Candidate (Job Applicant)
- Only takes tests
- Can view their own result
- No other access

---

## 3. SUPERADMIN DASHBOARD — WHAT WILL BE VISIBLE

### Screen 1 — Stats (Overview)
```
Total Companies    : 5
Total HRs          : 12
Total Candidates   : 150
Total Tests Given  : 430
```

### Screen 2 — Companies List
```
Company Name    | Industry  | Plan    | Status
Infosys         | IT        | Pro     | Active
TCS             | IT        | Basic   | Active
Wipro           | IT        | Pro     | Inactive
```

### Screen 3 — Add / Edit Company Form
```
Company Name      : (required)
GST Number        : (required)
Logo              : (image upload)
Address           : (required)
City              : (required)
State             : (required)
Phone             : (required)
Email             : (required)
Website           : (optional)
Industry Type     : IT / Finance / Manufacturing / Other
Subscription Plan : Basic / Pro / Enterprise
Status            : Active / Inactive
```

### Screen 4 — Company Detail View
```
Click on any company to see:
- Complete company details
- All HRs of that company
- All Candidates of that company
- All Tests of that company
- All Results of that company
```

---

## 4. ENTERPRISE DASHBOARD — WHAT WILL BE VISIBLE

### Screen 1 — Company Profile
```
Logo, Company Name, GST Number
Address, Phone, Email, Website
Industry, Subscription Plan
(Can edit their own profile)
```

### Screen 2 — HR Management
```
HR List:
Name         | Employee ID | Department  | Status
Priya Sharma | INF-HR-001  | HR Dept     | Active
Rahul Gupta  | INF-HR-002  | Recruitment | Active

HR Add / Edit Form:
Full Name     : (required)
Employee ID   : (optional)
Department    : (required)
Phone         : (required)
Email         : (required)
Username      : (for login - required)
Password      : (required)
Status        : Active / Inactive
```

### Screen 3 — Stats
```
Total HRs          : 3
Total Candidates   : 45
Total Tests        : 8
Total Tests Given  : 120
```

---

## 5. HR DASHBOARD — WHAT WILL BE VISIBLE

### Tab 1 — Tests
```
Test List (only this company's tests):
- Test name, Description
- Question count, Duration
- Active / Inactive
- PDF Upload (auto-extract questions)
- Edit / Delete

Test Add Form:
Title         : (required)
Description   : (required)
Duration      : (in minutes - required)
Category      : Technical / Aptitude / HR Round
Passing Score : (in % - required)
Time per Q    : (in seconds)
Status        : Active / Inactive
```

### Tab 2 — Candidates
```
Candidate List (only this company's candidates):
- Name, Email, Phone
- College/Company, Experience, Skills
- Assign Test button
- Edit / Delete

Candidate Add Form:
Full Name        : (required)
Email            : (required)
Phone            : (required)
College/Company  : (required)
Experience       : Fresher / 1-3 yr / 3-5 yr / 5+ yr
Skills           : (comma separated - Java, Python)
Applied For Job  : (select from Job list - optional)
Username         : (for login - required)
Password         : (required)
Status           : Active / Inactive

Assign Test:
- Select Candidate
- Select Test
- Login Start Time (optional)
- Login End Time (optional)
```

### Tab 3 — Results
```
Candidate-wise results (only this company's):
- Candidate name
- Test name
- Score, Accuracy %
- Correct / Wrong answers
- Date & Time
- Detail view
```

### Tab 4 — Interviews
```
Interview List (only this company's):
- Candidate name
- Interviewer name
- Date & Time
- Meeting URL
- Status: Pending / Attended / Shortlisted / Rejected / Absent

Interview Schedule Form:
Candidate      : (select from list)
Interviewer    : (type name)
Date & Time    : (date picker)
Meeting URL    : (Zoom/Meet link)
Notes          : (optional)
```

### Tab 5 — Job Openings
```
Job List (only this company's):
- Job Title, Department, Location
- Experience Required, Salary
- Status: Open / Closed / On Hold
- Skills Required

Job Add Form:
Title           : (required)
Department      : (required)
Location        : (required)
Job Type        : Full-Time / Part-Time / Contract / Internship
Experience      : Fresher / 1-3 yr / 3-5 yr / 5+ yr
Salary Range    : (e.g. 6L-12L)
Skills          : (comma separated)
Description     : (full JD)
Responsibilities: (bullet points)
Qualifications  : (requirements)
Vacancies       : (number)
Status          : Open / Closed / On Hold
```

---

## 6. CANDIDATE PORTAL — WHAT WILL BE VISIBLE

### Screen 1 — My Profile
```
Full Name     : Rahul Verma
Email         : rahul@gmail.com
Phone         : 99999 00001
College       : MIT College Pune
Experience    : Fresher
Skills        : Java, Python
```

### Screen 2 — Available Tests
```
Test name, Description
Duration, Question count
Start Test button
(Only assigned tests shown, only within time window)
```

### Screen 3 — Test Execution
```
Question + 4 options (A, B, C, D)
Timer per question
Progress bar
Next / Submit button
```

### Screen 4 — My Result
```
Score          : 28/30
Accuracy       : 93%
Correct        : 28
Wrong          : 2
Grade          : Excellent
Date           : 12-05-2026
```

---

## 7. DATA ISOLATION — MOST IMPORTANT RULE

```
Infosys HR logs in
→ Only Infosys candidates visible
→ Only Infosys tests visible
→ Only Infosys results visible
→ Zero TCS data visible

TCS HR logs in
→ Only TCS data visible
→ Zero Infosys data visible

SuperAdmin logs in
→ All company data visible
→ Can access any company
```

---

## 8. LOGIN PAGE — WHAT WILL BE VISIBLE

```
TestFlow Login

[Candidate] [HR] [Enterprise] [SuperAdmin]

Username : ___________
Password : ___________

[Login Button]
```

Each tab logs in according to its role.

---

## 9. WORK ORDER (Step by Step)

### Step 1 — Database Update
- Create Enterprise table (company details)
- Add role and enterprise_id to User table
- Add extra fields to Candidate (email, phone, college, skills)
- Add category and passing score to Test table
- Add enterprise_id to all relevant tables

### Step 2 — Backend API
- SuperAdmin APIs (enterprises CRUD)
- Enterprise APIs (HR management)
- Update HR APIs (data isolation — only own company data)
- Update Auth (handle 4 roles)

### Step 3 — Frontend
- Update Login page (4 tabs)
- Build SuperAdmin Dashboard
- Build Enterprise Dashboard
- Update HR Dashboard (update existing admin panel)
- Update Candidate profile

### Step 4 — Testing & Bug Fix
- Login and test with each role
- Verify data isolation
- Fix all bugs

### Step 5 — UI Polish
- Professional look and feel
- Loading states
- Clear error messages
- Mobile friendly

### Step 6 — Deploy
- Connect Neon PostgreSQL / AWS RDS (only change DATABASE_URL in backend/.env)
- Add domain
- Enable HTTPS

---

## 10. DATABASE TABLES

```
enterprises               → company details
users                     → superadmin, enterprise, hr, candidate all here
tests                     → with enterprise_id
questions                 → same as now
candidate_test_assignments → same as now
submissions               → same as now
job_openings              → with enterprise_id
interview_schedules       → with enterprise_id
uploaded_pdfs             → same as now
```

---

*Document Version: 1.0 | Date: 12-05-2026*
