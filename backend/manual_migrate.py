
import psycopg2
import os

DATABASE_URL = "postgresql://neondb_owner:npg_VLi4fcruqzE3@ep-shy-unit-apqtx2g8.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"

def migrate():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        print("Altering table enterprises...")
        cur.execute("ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS signup_method VARCHAR DEFAULT 'manual';")
        conn.commit()
        print("Migration successful!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
