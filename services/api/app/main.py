from fastapi import FastAPI

from app.modules.document.router import router as document_router
from app.modules.project.router import router as project_router

app = FastAPI(title="TestOps API")

app.include_router(project_router)
app.include_router(document_router)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
