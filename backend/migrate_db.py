"""
Database migration script — adds new columns to existing tables.
Run once: python migrate_db.py
"""
from app.db.session import engine
from sqlalchemy import text

migrations = [
    # ── users: add new columns ──────────────────────────────────────────
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'candidate'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_type VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS enterprise_id INTEGER REFERENCES enterprises(id) ON DELETE CASCADE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS college_or_company VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT",

    # ── users: set role from old is_admin flag ─────────────────────────
    "UPDATE users SET role = 'superadmin' WHERE is_admin = TRUE",
    "UPDATE users SET role = 'candidate' WHERE (is_admin = FALSE OR is_admin IS NULL) AND role = 'candidate'",

    # ── candidate_test_assignments: add assigned_by ────────────────────
    "ALTER TABLE candidate_test_assignments ADD COLUMN IF NOT EXISTS assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL",

    # ── tests: add new columns ─────────────────────────────────────────
    "ALTER TABLE tests ADD COLUMN IF NOT EXISTS enterprise_id INTEGER REFERENCES enterprises(id) ON DELETE CASCADE",
    "ALTER TABLE tests ADD COLUMN IF NOT EXISTS created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL",
    "ALTER TABLE tests ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'Technical'",
    "ALTER TABLE tests ADD COLUMN IF NOT EXISTS passing_score FLOAT DEFAULT 60.0",

    # ── submissions: add new columns ───────────────────────────────────
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS enterprise_id INTEGER REFERENCES enterprises(id) ON DELETE SET NULL",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT FALSE",

    # ── interview_schedules: add enterprise_id ─────────────────────────
    "ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS enterprise_id INTEGER REFERENCES enterprises(id) ON DELETE CASCADE",
    "ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL",

    # ── job_openings: add enterprise_id + created_by_id ───────────────
    "ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS enterprise_id INTEGER REFERENCES enterprises(id) ON DELETE CASCADE",
    "ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL",
]

with engine.begin() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql))
            print(f"OK  : {sql[:80]}")
        except Exception as e:
            print(f"SKIP: {sql[:80]}")
            print(f"      {str(e)[:120]}")

print("\nMigration complete!")
