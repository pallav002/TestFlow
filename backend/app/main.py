from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal, Base
from app.models import models
from app.core.config import settings
from app.core.security import get_password_hash
from app.api import auth, admin, candidate
from app.api import superadmin, enterprise, public

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        db = SessionLocal()
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db.close()
        print("INFO: DB connection pool warmed up.")
    except Exception as e:
        print(f"WARNING: DB warmup failed: {e}")
    _init_db()
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router,         prefix=f"{settings.API_V1_STR}/auth",        tags=["auth"])
app.include_router(superadmin.router,   prefix=f"{settings.API_V1_STR}/superadmin",  tags=["superadmin"])
app.include_router(enterprise.router,   prefix=f"{settings.API_V1_STR}/enterprise",  tags=["enterprise"])
app.include_router(admin.router,        prefix=f"{settings.API_V1_STR}/admin",        tags=["hr-admin"])
app.include_router(candidate.router,    prefix=f"{settings.API_V1_STR}/candidate",   tags=["candidate"])
app.include_router(public.router,       prefix=f"{settings.API_V1_STR}/public",      tags=["public"])


@app.get("/")
def root():
    return {"message": "TestFlow API", "version": "2.0"}


def _init_db():
    db: Session = SessionLocal()
    try:
        # Default SuperAdmin
        sa = db.query(models.User).filter(models.User.username == "superadmin").first()
        if not sa:
            sa = models.User(
                username="superadmin",
                hashed_password=get_password_hash("superadmin123"),
                full_name="Super Administrator",
                role=models.UserRole.superadmin,
                is_active=True,
            )
            db.add(sa)
            db.commit()
            print("INFO: Default superadmin created (superadmin / superadmin123)")

        # Default trial settings
        ts = db.query(models.TrialSettings).first()
        if not ts:
            ts = models.TrialSettings(
                trial_duration_days=5,
                hr_limit=1,
                candidate_limit=10,
                test_limit=2,
            )
            db.add(ts)
            db.commit()
            print("INFO: Default trial settings created")

    except Exception as e:
        print(f"ERROR: DB init failed: {e}")
    finally:
        db.close()
