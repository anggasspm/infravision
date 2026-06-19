from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, reports, ai, gis

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="InfraVision API",
    description="AI-Powered Infrastructure Damage Reporting System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(ai.router)
app.include_router(gis.router)

@app.get("/")
def root():
    return {"message": "InfraVision API is running!", "docs": "/docs"}