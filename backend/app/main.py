from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from infravision.backend.app.database import Base, engine
from infravision.backend.app.routers import reports
from infravision.backend.app.routers import admin, ai, analytics, auth, gis, notifications

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


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": str(exc.status_code), "message": exc.detail}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "422",
                "message": "Validasi input gagal",
                "details": exc.errors()}},
    )

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(ai.router)
app.include_router(gis.router)
app.include_router(admin.router)
app.include_router(analytics.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {"message": "InfraVision API is running!", "docs": "/docs"}
