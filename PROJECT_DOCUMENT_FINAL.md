# TestFlow — Enterprise Platform Document

**Product:** TestFlow
**Owner:** SuperAdmin (You)
**Purpose:** Online Test Platform for Companies to hire candidates
**Date:** 12-05-2026

---

## WHAT IS TESTFLOW

TestFlow is a platform that you sell to companies.
Companies use it to create tests and evaluate job candidates online.

---

## WHO USES THE PLATFORM

There are 4 types of users:

---

### 1. SUPERADMIN (You)
You own the platform. You control everything.

**What you can do:**
- Add new companies manually to the platform
- Approve or reject companies that signup from the website
- View all companies, their HR users, candidates, and results
- Access any company dashboard directly without their password
- Activate or deactivate any company
- Set plan limits for each company (HR count, candidate count, test count)
- Manage free trial settings (duration, limits)
- Approve upgrade requests from companies
- See overall platform statistics

---

### 2. ENTERPRISE (The Company that buys your product)
Example: Infosys, TCS, Wipro

**What they can do:**
- Edit their own company profile
- Create and manage their HR users (unlimited or as per plan)
- Set HR type — Senior or Junior
- View their own statistics
- Upgrade their plan (request goes to SuperAdmin)
- They CANNOT see other company's data

---

### 3. HR (Employee inside the company)
Example: Priya Sharma — HR at Infosys

**Two types of HR:**

**Senior HR:**
- Can see all data of all HRs in the company
- Can manage candidates added by Junior HRs
- Full access within their company

**Junior HR:**
- Can only see their own candidates, tests, results
- Cannot see other HRs data

**What all HRs can do:**
- Create tests (or upload PDF to auto-create questions)
- Add candidates with full details
- Assign tests to candidates
- Schedule interviews
- Post job openings
- View results
- They CANNOT see other company's data

---

### 4. CANDIDATE (Job Applicant)
Example: Rahul Verma — applying for Java Developer

**What they can do:**
- Login and take assigned test
- View their own result only

---

## HOW THE PLATFORM WORKS — STEP BY STEP FLOW

---

### STEP 1 — Company Joins the Platform

**Two ways a company can join:**

**Way 1 — SuperAdmin adds manually:**

SuperAdmin login kare aur company add kare.

Fill karo:
- Company Name (e.g. Infosys)
- GST Number
- Logo
- Address, City, State
- Phone, Email, Website
- Industry (IT / Finance / Manufacturing / Other)
- Plan (Basic / Pro / Enterprise / Custom)
- Plan Limits:
  - HR accounts allowed (e.g. 10)
  - Candidates allowed (e.g. 500)
  - Tests allowed (e.g. 20)

System automatically:
- Creates enterprise login credentials
- Sends email to company:

```
To: hr@infosys.com
Subject: Welcome to TestFlow — Your Account is Ready

Company  : Infosys
Username : infosys_admin
Password : ********
Login at : testflow.com
```

SuperAdmin also gets full access to this company dashboard anytime.

---

**Way 2 — Company signs up from website (Free Trial):**

Company visits TestFlow website and clicks "Start Free Trial".

They fill:
- Company Name
- Contact Person Name
- Email ID
- Phone Number
- Username (they choose)
- Password (they choose)

After signup:
1. Company gets a welcome email with their login details
2. SuperAdmin gets a notification in dashboard:

```
New Signup Request:
Company : Infosys
Contact : Priya Sharma
Phone   : 98765 00001
Email   : priya@infosys.com
Date    : 12-05-2026
[ Approve ]  [ Reject ]
```

SuperAdmin approves → company gets free trial access.

**Free Trial Limits (SuperAdmin sets these — can change anytime):**
```
Trial Duration    : X days   (e.g. 5 days)
HR Accounts       : X        (e.g. 1)
Candidates        : X        (e.g. 10)
Tests             : X        (e.g. 2)
```

When trial ends, company sees upgrade prompt on login.
They click upgrade → request goes to SuperAdmin:

```
Upgrade Request:
Company  : Infosys
Plan Req : Pro
Contact  : Priya Sharma
Phone    : 98765 00001
Email    : priya@infosys.com
[ Approve & Activate ]
```

SuperAdmin approves → plan upgrades → email sent to company.

---

### STEP 2 — Enterprise Logs In

Infosys logs in with their enterprise account.

They see their Enterprise Dashboard:
1. Company Profile — view and edit their details
2. HR Management — add and manage HR employees
3. Statistics — total HRs, candidates, tests

---

### STEP 3 — Enterprise Adds HR Users

Infosys creates accounts for their HR employees.

They fill for each HR:
- Full Name
- Employee ID (optional)
- Department
- Phone, Email
- Username and Password
- HR Type: [ Junior ]  [ Senior ]

Example:
```
H1 = Priya HR  → Senior  → sees all HR data
H2 = Aman HR   → Junior  → sees only own data
H3 = Rohit HR  → Junior  → sees only own data
```

No limit on how many HRs they can add (as per their plan).

Final Structure:
```
SuperAdmin
   │
   └── E1 = Infosys (infosys_admin)
          │
          ├── H1 = Priya HR  (Senior)
          ├── H2 = Aman HR   (Junior)
          └── H3 = Rohit HR  (Junior)
```

---

### STEP 4 — HR Adds Candidates

HR logs in and adds candidates who applied for jobs.

They fill:
- Candidate Full Name
- Email, Phone
- College or Current Company
- Experience Level (Fresher / 1-3 yr / 3-5 yr / 5+ yr)
- Skills (Java, Python, etc.)
- Applied For (select from job openings — optional)
- Username and Password (for candidate to login)

---

### STEP 5 — HR Creates a Test

HR creates a test for the job role.

They fill:
- Test Title (e.g. Java Developer Test)
- Description
- Duration (e.g. 30 minutes)
- Category (Technical / Aptitude / HR Round)
- Passing Score (e.g. 60%)
- Time per Question (e.g. 60 seconds)

Questions are added by:
- Uploading a PDF — system auto-reads and creates questions
- Or manually adding questions one by one

---

### STEP 6 — HR Assigns Test to Candidate

HR selects a candidate and assigns the test.

They set:
- Which candidate
- Which test
- Login Start Time (optional)
- Login End Time (optional)

If time is set, candidate can only login during that window.

---

### STEP 7 — Candidate Takes the Test

Candidate logs in with their username and password.

They see:
- Available tests assigned to them
- Test details (duration, questions)
- Start Test button

During test:
- One question at a time
- 4 options (A, B, C, D)
- Timer counts down per question
- Auto-moves to next question when time runs out
- Candidate clicks Submit at the end

---

### STEP 8 — Result is Generated

System automatically calculates the result.

Result shows:
- Total Score
- Accuracy %
- Correct Answers
- Wrong Answers
- Grade (Excellent / Good / Average / Needs Improvement)

---

### STEP 9 — HR Reviews Results

HR logs in and views all candidate results.

They see:
- Candidate name
- Test name
- Score, Accuracy
- Date of submission

Senior HR sees results of all HRs candidates.
Junior HR sees only their own candidates results.

---

### STEP 10 — HR Schedules Interview

Based on results, HR schedules interview for selected candidates.

They fill:
- Candidate name
- Interviewer name
- Date and Time
- Meeting Link (Zoom / Google Meet)
- Notes

Interview status options:
- Pending
- Attended
- Shortlisted
- Rejected
- Absent

---

### STEP 11 — HR Posts Job Openings (Optional)

HR can post job openings on the platform.

They fill:
- Job Title
- Department, Location
- Job Type (Full-Time / Part-Time / Contract / Internship)
- Experience Required
- Salary Range
- Skills Required
- Full Job Description

---

## DATA SEPARATION RULE

Every company sees ONLY their own data.

| Who Logs In | What They See |
|-------------|---------------|
| SuperAdmin | All companies, all data, direct access to any company |
| Infosys Enterprise | Only Infosys data |
| Infosys Senior HR | All Infosys HR data |
| Infosys Junior HR | Only their own data |
| TCS HR | Only TCS data |
| Candidate | Only their own test and result |

---

## SCREENS IN THE PLATFORM

| Screen | Who Uses It |
|--------|-------------|
| Login Page | Everyone |
| Signup Page (Free Trial) | New companies from website |
| SuperAdmin Dashboard | SuperAdmin |
| Enterprise Dashboard | Enterprise |
| HR Dashboard | HR (Senior and Junior) |
| Candidate Portal | Candidate |

---

## LOGIN PAGE

Single login page with role selection:

```
[ Candidate ]  [ HR ]  [ Enterprise ]  [ SuperAdmin ]

Username : ________________
Password : ________________

         [ Login ]

New company? [ Start Free Trial ]
```

---

## SUPERADMIN DASHBOARD SCREENS

1. **Overview** — Total companies, HRs, candidates, tests given
2. **Companies List** — All companies with status and plan details
3. **Add Company** — Form to add new company with plan limits
4. **Company Detail** — Click any company to see all its data
5. **Access Dashboard** — Directly enter any company dashboard without password
6. **Signup Requests** — New companies that signed up from website (Approve / Reject)
7. **Upgrade Requests** — Companies requesting plan upgrade (Approve / Reject)
8. **Free Trial Settings** — Set trial duration, HR limit, candidate limit, test limit
---
## ENTERPRISE DASHBOARD SCREENS

1. **Company Profile** — View and edit company details
2. **HR Management** — Add, edit, delete, activate/deactivate HR users
3. **HR Type** — Set each HR as Senior or Junior
4. **Statistics** — Total HRs, candidates, tests
5. **Upgrade Plan** — Request plan upgrade (goes to SuperAdmin)

---

## HR DASHBOARD SCREENS

**Senior HR sees:**
1. **Tests** — All company tests
2. **Candidates** — All company candidates (from all HRs)
3. **Results** — All company results
4. **Interviews** — All company interviews
5. **Job Openings** — All company jobs

**Junior HR sees:**
1. **Tests** — Only their own tests
2. **Candidates** — Only their own candidates
3. **Results** — Only their own results
4. **Interviews** — Only their own interviews
5. **Job Openings** — All company jobs (can post too)

---

## CANDIDATE PORTAL SCREENS

1. **My Profile** — Name, email, phone, skills
2. **Available Tests** — Tests assigned to me
3. **Test Screen** — Take the test
4. **My Result** — Score and grade

---

## DATABASE — WHAT DATA IS STORED

| Table | What It Stores |
|-------|----------------|
| enterprises | Company details (name, GST, logo, address, plan, limits) |
| users | All users (superadmin, enterprise, hr, candidate) with role and hr_type |
| tests | All tests linked to company |
| questions | MCQ questions for each test |
| assignments | Which candidate is assigned which test |
| submissions | Candidate test results and answers |
| job_openings | Job posts by HR linked to company |
| interview_schedules | Interview records linked to company |
| signup_requests | Free trial signup requests from website |
| upgrade_requests | Plan upgrade requests from companies |

---

## TECHNOLOGY USED

| Part | Technology |
|------|------------|
| Frontend (UI) | React.js |
| Backend (Server) | Python FastAPI |
| Database | PostgreSQL (Neon — cloud) |
| Authentication | JWT Token |
| Email Service | SMTP / SendGrid |
| PDF Parsing | Python PDF library |

---

## HOW TO SWITCH DATABASE (When Selling to Client)

Currently using **Neon** (free cloud database for demo).

When moving to production on **AWS RDS**:
- Change only ONE line in the server config file
- Everything else stays exactly the same

```
DATABASE_URL = postgresql://user:password@aws-rds-url/dbname
```

That is it. No other changes needed.

---

*Document Version: 2.0*
*Project: TestFlow Enterprise Platform*
*Date: 12-05-2026*
