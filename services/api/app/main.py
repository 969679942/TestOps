from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.schema_health import get_schema_status
from app.modules.automation.router import router as automation_router
from app.modules.data_setup.router import router as data_setup_router
from app.modules.document.router import router as document_router
from app.modules.environment.router import router as environment_router
from app.modules.generation.router import router as generation_router
from app.modules.project.router import router as project_router
from app.modules.report.router import router as report_router
from app.modules.review.router import router as review_router
from app.modules.schedule.router import router as schedule_router
from app.modules.skills.router import router as skills_router
from app.modules.settings.router import router as settings_router
from app.modules.testcase.router import router as testcase_router

app = FastAPI(title="TestOps API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(automation_router)
app.include_router(data_setup_router)
app.include_router(project_router)
app.include_router(document_router)
app.include_router(environment_router)
app.include_router(generation_router)
app.include_router(report_router)
app.include_router(schedule_router)
app.include_router(skills_router)
app.include_router(settings_router)
app.include_router(testcase_router)
app.include_router(review_router)


@app.get("/health")
def healthcheck(session: Session = Depends(get_session)) -> dict[str, object]:
    schema = get_schema_status(session.connection())
    return {
        "status": "ok" if schema["up_to_date"] else "degraded",
        "database": "ok",
        "schema": schema,
    }
