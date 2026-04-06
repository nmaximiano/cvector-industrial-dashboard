from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import facilities, assets, readings, dashboard

app = FastAPI(title="CVector Industrial Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(facilities.router)
app.include_router(assets.router)
app.include_router(readings.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
