from fastapi import HTTPException, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.sql import Select

from app.models.automation import (
    AutomationDebugProposal,
    AutomationFailureAnalysis,
    AutomationGeneration,
    AutomationRun,
)
from app.models.data_setup import DataSetupExecution, DataSetupHint
from app.models.document import DocumentAsset
from app.models.document import DocumentVersion
from app.models.environment import Environment
from app.models.generation import GenerationTask
from app.models.project import Project
from app.models.project_skill_binding import ProjectSkillBinding
from app.models.report import AutomationFinalReport, AutomationReport
from app.models.schedule import AutomationSchedule
from app.models.skill_package import SkillPackage
from app.models.skill_package_version import SkillPackageVersion
from app.models.testcase import TestCase
from app.models.testcase import TestCaseReview
from app.models.testcase_directory import TestCaseDirectory
from app.schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectStatus,
    ProjectStatusFilter,
    ProjectSummaryRead,
)

_VALID_PROJECT_STATUSES = {"active", "archived"}
_ARCHIVED_PROJECT_MESSAGE = "Project is archived. Restore it before making changes."
_DELETE_ACTIVE_PROJECT_MESSAGE = "Archive the project before deleting it"


class ProjectConflictError(Exception):
    pass


def _is_project_uniqueness_error(error: IntegrityError) -> bool:
    constraint_name = getattr(getattr(error.orig, "diag", None), "constraint_name", None)
    if constraint_name in {"projects_name_key", "projects_code_key"}:
        return True

    error_message = str(error.orig).lower()
    if "unique constraint failed" in error_message:
        return "projects.name" in error_message or "projects.code" in error_message

    if "duplicate key value violates unique constraint" in error_message:
        return "projects_name_key" in error_message or "projects_code_key" in error_message

    return False


def _apply_project_status_filter(
    statement: Select[tuple[Project]],
    status_filter: ProjectStatusFilter,
) -> Select[tuple[Project]]:
    if status_filter == "all":
        return statement
    if status_filter == "archived":
        return statement.where(Project.status == "archived")
    return statement.where(or_(Project.status.is_(None), Project.status != "archived"))


def _normalize_project_status_value(status_value: str | None) -> ProjectStatus:
    if status_value in _VALID_PROJECT_STATUSES:
        return status_value
    return "active"


def _build_project_read(project: Project) -> ProjectRead:
    return ProjectRead(
        id=project.id,
        name=project.name,
        code=project.code,
        description=project.description,
        status=_normalize_project_status_value(project.status),
        default_provider=project.default_provider,
        default_prompt_profile=project.default_prompt_profile,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


def _get_project_model(session: Session, project_id: int) -> Project:
    project = session.scalar(select(Project).where(Project.id == project_id))
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


def ensure_project_is_active(project: Project) -> Project:
    if project.status == "archived":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=_ARCHIVED_PROJECT_MESSAGE,
        )
    return project


def list_projects(
    session: Session,
    *,
    status_filter: ProjectStatusFilter = "active",
) -> list[ProjectRead]:
    statement = _apply_project_status_filter(select(Project).order_by(Project.id), status_filter)
    return [_build_project_read(project) for project in session.scalars(statement)]


def list_project_summaries(
    session: Session,
    *,
    status_filter: ProjectStatusFilter = "active",
) -> list[ProjectSummaryRead]:
    statement = _apply_project_status_filter(select(Project).order_by(Project.id), status_filter)
    projects = list(session.scalars(statement))
    summaries: list[ProjectSummaryRead] = []
    for project in projects:
        document_count = session.scalar(
            select(func.count())
            .select_from(DocumentAsset)
            .where(DocumentAsset.project_id == project.id)
        )
        test_case_count = session.scalar(
            select(func.count())
            .select_from(TestCase)
            .where(TestCase.project_id == project.id)
        )
        published_count = session.scalar(
            select(func.count())
            .select_from(TestCase)
            .where(
                TestCase.project_id == project.id,
                TestCase.status == "published",
            )
        )
        summaries.append(
            ProjectSummaryRead(
                id=project.id,
                name=project.name,
                code=project.code,
                description=project.description,
                status=_normalize_project_status_value(project.status),
                default_provider=project.default_provider,
                default_prompt_profile=project.default_prompt_profile,
                created_at=project.created_at,
                updated_at=project.updated_at,
                document_count=int(document_count or 0),
                test_case_count=int(test_case_count or 0),
                published_count=int(published_count or 0),
            )
        )
    return summaries


def get_project(session: Session, project_id: int) -> ProjectRead:
    project = _get_project_model(session, project_id)
    return _build_project_read(project)


def update_project_status(
    session: Session,
    project_id: int,
    status_value: ProjectStatus,
) -> Project:
    project = _get_project_model(session, project_id)
    project.status = status_value
    session.commit()
    session.refresh(project)
    return project


def delete_archived_project(session: Session, project_id: int) -> None:
    project = _get_project_model(session, project_id)
    if project.status != "archived":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=_DELETE_ACTIVE_PROJECT_MESSAGE,
        )

    test_case_ids = list(
        session.scalars(select(TestCase.id).where(TestCase.project_id == project_id))
    )
    document_ids = list(
        session.scalars(select(DocumentAsset.id).where(DocumentAsset.project_id == project_id))
    )
    document_version_ids = (
        list(
            session.scalars(
                select(DocumentVersion.id).where(DocumentVersion.document_asset_id.in_(document_ids))
            )
        )
        if document_ids
        else []
    )
    skill_package_ids = list(
        session.scalars(select(SkillPackage.id).where(SkillPackage.project_id == project_id))
    )
    session.execute(
        delete(ProjectSkillBinding).where(ProjectSkillBinding.project_id == project_id)
    )
    environment_ids = list(
        session.scalars(select(Environment.id).where(Environment.project_id == project_id))
    )
    automation_generation_ids = (
        list(
            session.scalars(
                select(AutomationGeneration.id).where(
                    AutomationGeneration.test_case_id.in_(test_case_ids)
                )
            )
        )
        if test_case_ids
        else []
    )
    automation_run_ids = (
        list(
            session.scalars(
                select(AutomationRun.id).where(
                    AutomationRun.automation_generation_id.in_(automation_generation_ids)
                )
            )
        )
        if automation_generation_ids
        else []
    )
    failure_analysis_ids = (
        list(
            session.scalars(
                select(AutomationFailureAnalysis.id).where(
                    AutomationFailureAnalysis.automation_run_id.in_(automation_run_ids)
                )
            )
        )
        if automation_run_ids
        else []
    )
    data_setup_hint_ids = (
        list(
            session.scalars(
                select(DataSetupHint.id).where(
                    or_(
                        DataSetupHint.test_case_id.in_(test_case_ids),
                        DataSetupHint.document_version_id.in_(document_version_ids),
                        DataSetupHint.environment_id.in_(environment_ids),
                    )
                )
            )
        )
        if test_case_ids or document_version_ids or environment_ids
        else []
    )

    if failure_analysis_ids:
        session.execute(
            delete(AutomationDebugProposal).where(
                AutomationDebugProposal.automation_failure_analysis_id.in_(failure_analysis_ids)
            )
        )
    if automation_run_ids:
        session.execute(
            delete(AutomationFinalReport).where(
                AutomationFinalReport.automation_run_id.in_(automation_run_ids)
            )
        )
        session.execute(
            delete(AutomationReport).where(
                AutomationReport.automation_run_id.in_(automation_run_ids)
            )
        )
        session.execute(
            delete(AutomationFailureAnalysis).where(
                AutomationFailureAnalysis.automation_run_id.in_(automation_run_ids)
            )
        )
    if data_setup_hint_ids:
        session.execute(
            delete(DataSetupExecution).where(
                DataSetupExecution.data_setup_hint_id.in_(data_setup_hint_ids)
            )
        )
    if automation_run_ids:
        session.execute(
            delete(DataSetupExecution).where(
                DataSetupExecution.automation_run_id.in_(automation_run_ids)
            )
        )
        session.execute(
            delete(AutomationRun).where(
                AutomationRun.automation_generation_id.in_(automation_generation_ids)
            )
        )
    if automation_generation_ids:
        session.execute(
            delete(AutomationGeneration).where(AutomationGeneration.id.in_(automation_generation_ids))
        )
    if data_setup_hint_ids:
        session.execute(delete(DataSetupHint).where(DataSetupHint.id.in_(data_setup_hint_ids)))
    if test_case_ids:
        session.execute(delete(TestCaseReview).where(TestCaseReview.test_case_id.in_(test_case_ids)))
        session.execute(delete(TestCase).where(TestCase.id.in_(test_case_ids)))
    session.execute(delete(AutomationSchedule).where(AutomationSchedule.project_id == project_id))
    session.execute(delete(TestCaseDirectory).where(TestCaseDirectory.project_id == project_id))
    session.execute(delete(GenerationTask).where(GenerationTask.project_id == project_id))
    if document_ids:
        session.execute(
            delete(DocumentVersion).where(DocumentVersion.document_asset_id.in_(document_ids))
        )
        session.execute(delete(DocumentAsset).where(DocumentAsset.id.in_(document_ids)))
    if skill_package_ids:
        session.execute(
            delete(SkillPackageVersion).where(
                SkillPackageVersion.skill_package_id.in_(skill_package_ids)
            )
        )
        session.execute(delete(SkillPackage).where(SkillPackage.id.in_(skill_package_ids)))
    session.execute(delete(Environment).where(Environment.project_id == project_id))
    session.delete(project)
    session.commit()


def create_project(session: Session, payload: ProjectCreate) -> Project:
    existing_project = session.scalar(
        select(Project).where(or_(Project.name == payload.name, Project.code == payload.code))
    )
    if existing_project is not None:
        raise ProjectConflictError

    project = Project(
        name=payload.name,
        code=payload.code,
        description=payload.description,
    )
    session.add(project)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        if _is_project_uniqueness_error(exc):
            raise ProjectConflictError from exc
        raise
    session.refresh(project)
    return project
