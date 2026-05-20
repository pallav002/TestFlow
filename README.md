# TestFlow (Offline)

An offline examination platform for conducting MCQ-based aptitude tests.

## Features
- **Admin Dashboard**: Create tests, upload PDF questions, manage candidates, and view results.
- **Candidate Interface**: Secure test execution with timer and automatic evaluation.
- **Database**: PostgreSQL (Neon Cloud Database)
- **Secure**: JWT-based authentication for SuperAdmin, HR, and Candidates.

## Tech Stack
- **Backend**: FastAPI (Python), PostgreSQL, SQLAlchemy
- **Frontend**: React (Vite), Axios, Lucide Icons, Framer Motion

## Setup and Running

### Prerequisites
- Python 3.12+
- Node.js (v24+)

### Backend
1. Go to `backend` directory.
2. The virtual environment is already created at `venv`.
3. Start the server:
   ```bash
   ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

### Frontend
1. Go to `frontend` directory.
2. Start the development server:
   ```bash
   npm run dev -- --host --port 5173
   ```

## Default Credentials
- **Admin**:
  - Username: `admin`
  - Password: `admin123`

## PDF MCQ Format
The system currently supports parsing PDFs with the following MCQ format:
```
1. Question text here?
(A) Option A (B) Option B (C) Option C (D) Option D
```
Note: The admin can manually verify and correct questions after upload if the format differs.
