from fastapi import FastAPI

from app.modules.automation.router import router as automation_router
from app.modules.data_setup.router import router as data_setup_router
from app.modules.document.router import router as document_router
from app.modules.environment.router import router as environment_router
from app.modules.generation.router import router as generation_router
from app.modules.project.router import router as project_router
from app.modules.report.router import router as report_router
from app.modules.review.router import router as review_router
from app.modules.schedule.router import router as schedule_router
from app.modules.testcase.router import router as testcase_router

app = FastAPI(title="TestOps API")

app.include_router(automation_router)
app.include_router(data_setup_router)
app.include_router(project_router)
app.include_router(document_router)
app.include_router(environment_router)
app.include_router(generation_router)
app.include_router(report_router)
app.include_router(schedule_router)
app.include_router(testcase_router)
app.include_router(review_router)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
