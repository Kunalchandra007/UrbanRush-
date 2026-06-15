from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import intent

app = FastAPI(title="QuickCart AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intent.router)


@app.get("/health")
def health():
    return {"status": "ok"}
