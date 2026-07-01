from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.global_skill_definition import GlobalSkillDefinition
from app.models.global_skill_version import GlobalSkillVersion
from app.models.project import Project
from app.models.project_skill_binding import ProjectSkillBinding
from app.models.skill_package import SkillPackage
from app.models.skill_package_version import SkillPackageVersion
from app.modules.project import service as project_service
from app.modules.skills.templates import build_skill_metadata, list_global_skill_library_seeds
from app.schemas.skill_package import (
    GlobalSkillDefinitionCreate,
    GlobalSkillDefinitionRead,
    GlobalSkillDefinitionUpdate,
    GlobalSkillVersionCreate,
    GlobalSkillVersionRead,
    GlobalSkillVersionUpdate,
    SkillPackageCreate,
    SkillPackageRead,
    SkillPackageVersionCreate,
)
from app.schemas.project_skill_binding import (
    ProjectSkillBindingCreate,
    ProjectSkillBindingRead,
    ProjectSkillBindingUpdate,
)


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _get_project(session: Session, project_id: int) -> Project:
    project = session.scalar(select(Project).where(Project.id == project_id))
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


def _get_skill_package(session: Session, skill_package_id: int) -> SkillPackage:
    package = session.scalar(
        select(SkillPackage).where(SkillPackage.id == skill_package_id)
    )
    if package is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill package not found",
        )
    return package


def _get_skill_package_version(
    session: Session,
    version_id: int,
) -> SkillPackageVersion:
    version = session.scalar(
        select(SkillPackageVersion).where(SkillPackageVersion.id == version_id)
    )
    if version is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill package version not found",
        )
    return version


def _map_package_read(session: Session, package: SkillPackage) -> SkillPackageRead:
    active_version_summary: str | None = None
    if package.active_version_id is not None:
        active_version_summary = session.scalar(
            select(SkillPackageVersion.summary).where(
                SkillPackageVersion.id == package.active_version_id
            )
        )
    return SkillPackageRead(
        id=package.id,
        project_id=package.project_id,
        system_key=package.system_key,
        name=package.name,
        status=package.status,
        active_version_id=package.active_version_id,
        active_version_summary=active_version_summary,
        created_at=package.created_at,
        updated_at=package.updated_at,
    )


def create_skill_package(
    session: Session,
    project_id: int,
    payload: SkillPackageCreate,
) -> SkillPackageRead:
    project_service.ensure_project_is_active(_get_project(session, project_id))
    package = SkillPackage(
        project_id=project_id,
        system_key=payload.system_key,
        name=payload.name,
        status="active",
        active_version_id=None,
    )
    session.add(package)
    session.commit()
    session.refresh(package)
    return _map_package_read(session, package)


def list_skill_packages(session: Session, project_id: int) -> list[SkillPackageRead]:
    _get_project(session, project_id)
    packages = list(
        session.scalars(
            select(SkillPackage)
            .where(SkillPackage.project_id == project_id)
            .order_by(SkillPackage.id)
        )
    )
    return [_map_package_read(session, package) for package in packages]


def create_skill_package_version(
    session: Session,
    skill_package_id: int,
    payload: SkillPackageVersionCreate,
) -> SkillPackageVersion:
    package = _get_skill_package(session, skill_package_id)
    project_service.ensure_project_is_active(_get_project(session, package.project_id))
    current = session.scalar(
        select(func.max(SkillPackageVersion.version_no)).where(
            SkillPackageVersion.skill_package_id == package.id
        )
    )
    version = SkillPackageVersion(
        skill_package_id=package.id,
        version_no=int(current or 0) + 1,
        storage_uri=payload.storage_uri,
        structured_metadata=build_skill_metadata(
            template_key=payload.template_key,
            overrides=payload.content,
        ),
        summary=payload.summary,
    )
    session.add(version)
    session.commit()
    session.refresh(version)
    return version


def list_skill_package_versions(
    session: Session,
    skill_package_id: int,
) -> list[SkillPackageVersion]:
    _get_skill_package(session, skill_package_id)
    return list(
        session.scalars(
            select(SkillPackageVersion)
            .where(SkillPackageVersion.skill_package_id == skill_package_id)
            .order_by(SkillPackageVersion.version_no)
        )
    )


def activate_skill_package_version(
    session: Session,
    *,
    project_id: int,
    skill_package_id: int,
    version_id: int,
) -> SkillPackageRead:
    package = _get_skill_package(session, skill_package_id)
    project_service.ensure_project_is_active(_get_project(session, project_id))
    version = _get_skill_package_version(session, version_id)
    if package.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill package not found",
        )
    if version.skill_package_id != package.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Skill package version does not belong to the selected package",
        )

    package.active_version_id = version.id
    session.add(package)
    session.commit()
    session.refresh(package)
    return _map_package_read(session, package)


def _get_global_skill_definition(
    session: Session,
    skill_id: int,
) -> GlobalSkillDefinition:
    ensure_global_skill_library_seeded(session)
    definition = session.scalar(
        select(GlobalSkillDefinition).where(GlobalSkillDefinition.id == skill_id)
    )
    if definition is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Global skill not found",
        )
    return definition


def _get_current_production_version(
    session: Session,
    global_skill_id: int,
) -> GlobalSkillVersion | None:
    return session.scalar(
        select(GlobalSkillVersion)
        .where(
            GlobalSkillVersion.global_skill_id == global_skill_id,
            GlobalSkillVersion.status == "production",
        )
        .order_by(GlobalSkillVersion.version_no.desc())
    )


def _get_global_skill_version(
    session: Session,
    version_id: int,
) -> GlobalSkillVersion:
    version = session.scalar(
        select(GlobalSkillVersion).where(GlobalSkillVersion.id == version_id)
    )
    if version is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Global skill version not found",
        )
    return version


def _map_global_skill_definition_read(
    session: Session,
    definition: GlobalSkillDefinition,
) -> GlobalSkillDefinitionRead:
    production_version = _get_current_production_version(session, definition.id)
    return GlobalSkillDefinitionRead(
        id=definition.id,
        skill_key=definition.skill_key,
        name=definition.name,
        description=definition.description,
        category=definition.category,
        domain=definition.domain,
        input_types=list(definition.input_types or []),
        status=definition.status,
        owner=definition.owner,
        current_production_version_id=production_version.id if production_version else None,
        current_production_version_label=production_version.version_label if production_version else None,
        created_at=definition.created_at,
        updated_at=definition.updated_at,
    )


def _map_global_skill_version_read(version: GlobalSkillVersion) -> GlobalSkillVersionRead:
    return GlobalSkillVersionRead(
        id=version.id,
        global_skill_id=version.global_skill_id,
        version_no=version.version_no,
        version_label=version.version_label,
        status=version.status,
        prompt_template=version.prompt_template,
        scenario_taxonomy=list(version.scenario_taxonomy or []),
        review_checklist=list(version.review_checklist or []),
        coverage_dimensions=list(version.coverage_dimensions or []),
        evidence_policy=version.evidence_policy,
        storage_uri=version.storage_uri,
        change_log=version.change_log,
        release_notes=version.release_notes,
        created_by=version.created_by,
        created_at=version.created_at,
        published_at=version.published_at,
    )


def _get_project_skill_binding(
    session: Session,
    *,
    project_id: int,
    binding_id: int,
) -> ProjectSkillBinding:
    binding = session.scalar(
        select(ProjectSkillBinding).where(
            ProjectSkillBinding.id == binding_id,
            ProjectSkillBinding.project_id == project_id,
        )
    )
    if binding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project skill binding not found",
        )
    return binding


def _map_project_skill_binding_read(
    session: Session,
    binding: ProjectSkillBinding,
) -> ProjectSkillBindingRead:
    definition = _get_global_skill_definition(session, binding.global_skill_id)
    version = _get_global_skill_version(session, binding.global_skill_version_id)
    return ProjectSkillBindingRead(
        id=binding.id,
        project_id=binding.project_id,
        global_skill_id=binding.global_skill_id,
        global_skill_version_id=binding.global_skill_version_id,
        binding_type=binding.binding_type,
        status=binding.status,
        is_default=binding.is_default,
        override_payload=dict(binding.override_payload or {}),
        skill_key=definition.skill_key,
        skill_name=definition.name,
        version_label=version.version_label,
        version_status=version.status,
        skill_category=definition.category,
        skill_domain=definition.domain,
        input_types=list(definition.input_types or []),
        created_at=binding.created_at,
        updated_at=binding.updated_at,
    )


def ensure_global_skill_library_seeded(session: Session) -> None:
    has_existing = session.scalar(
        select(GlobalSkillDefinition.id).limit(1)
    )
    if has_existing is not None:
        return

    seeded_at = _utcnow()
    for seed in list_global_skill_library_seeds():
        definition = GlobalSkillDefinition(
            skill_key=seed["skill_key"],
            name=seed["name"],
            description=seed["description"],
            category=seed["category"],
            domain=seed["domain"],
            input_types=list(seed["input_types"]),
            status=seed["status"],
            owner=seed["owner"],
        )
        session.add(definition)
        session.flush()
        version = GlobalSkillVersion(
            global_skill_id=definition.id,
            version_no=1,
            version_label=seed["version_label"],
            status="production",
            prompt_template=seed["prompt_template"],
            scenario_taxonomy=list(seed["scenario_taxonomy"]),
            review_checklist=list(seed["review_checklist"]),
            coverage_dimensions=list(seed["coverage_dimensions"]),
            evidence_policy=seed["evidence_policy"],
            storage_uri=seed["storage_uri"],
            change_log=seed["change_log"],
            release_notes=seed["release_notes"],
            created_by=seed["created_by"],
            created_at=seeded_at,
            published_at=seeded_at,
        )
        session.add(version)
    session.commit()


def list_global_skill_definitions(session: Session) -> list[GlobalSkillDefinitionRead]:
    ensure_global_skill_library_seeded(session)
    definitions = list(
        session.scalars(
            select(GlobalSkillDefinition).order_by(GlobalSkillDefinition.id)
        )
    )
    return [_map_global_skill_definition_read(session, definition) for definition in definitions]


def get_global_skill_definition(
    session: Session,
    skill_id: int,
) -> GlobalSkillDefinitionRead:
    definition = _get_global_skill_definition(session, skill_id)
    return _map_global_skill_definition_read(session, definition)


def create_global_skill_definition(
    session: Session,
    payload: GlobalSkillDefinitionCreate,
) -> GlobalSkillDefinitionRead:
    ensure_global_skill_library_seeded(session)
    existing = session.scalar(
        select(GlobalSkillDefinition).where(GlobalSkillDefinition.skill_key == payload.skill_key)
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Global skill key already exists",
        )

    definition = GlobalSkillDefinition(
        skill_key=payload.skill_key,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        domain=payload.domain,
        input_types=list(payload.input_types),
        status="active",
        owner=payload.owner,
    )
    session.add(definition)
    session.commit()
    session.refresh(definition)
    return _map_global_skill_definition_read(session, definition)


def update_global_skill_definition(
    session: Session,
    *,
    skill_id: int,
    payload: GlobalSkillDefinitionUpdate,
) -> GlobalSkillDefinitionRead:
    definition = _get_global_skill_definition(session, skill_id)
    if payload.name is not None:
        definition.name = payload.name
    if payload.description is not None:
        definition.description = payload.description
    if payload.category is not None:
        definition.category = payload.category
    if payload.domain is not None:
        definition.domain = payload.domain
    if payload.input_types is not None:
        definition.input_types = list(payload.input_types)
    if payload.status is not None:
        definition.status = payload.status
    if payload.owner is not None:
        definition.owner = payload.owner
    session.add(definition)
    session.commit()
    session.refresh(definition)
    return _map_global_skill_definition_read(session, definition)


def list_global_skill_versions(
    session: Session,
    skill_id: int,
) -> list[GlobalSkillVersionRead]:
    _get_global_skill_definition(session, skill_id)
    versions = list(
        session.scalars(
            select(GlobalSkillVersion)
            .where(GlobalSkillVersion.global_skill_id == skill_id)
            .order_by(GlobalSkillVersion.version_no)
        )
    )
    return [_map_global_skill_version_read(version) for version in versions]


def create_global_skill_version(
    session: Session,
    *,
    skill_id: int,
    payload: GlobalSkillVersionCreate,
) -> GlobalSkillVersionRead:
    definition = _get_global_skill_definition(session, skill_id)
    current = session.scalar(
        select(func.max(GlobalSkillVersion.version_no)).where(
            GlobalSkillVersion.global_skill_id == definition.id
        )
    )
    version = GlobalSkillVersion(
        global_skill_id=definition.id,
        version_no=int(current or 0) + 1,
        version_label=payload.version_label,
        status=payload.status,
        prompt_template=payload.prompt_template,
        scenario_taxonomy=list(payload.scenario_taxonomy),
        review_checklist=list(payload.review_checklist),
        coverage_dimensions=list(payload.coverage_dimensions),
        evidence_policy=payload.evidence_policy,
        storage_uri=payload.storage_uri,
        change_log=payload.change_log,
        release_notes=payload.release_notes,
        created_by=payload.created_by,
        published_at=_utcnow() if payload.status == "production" else None,
    )
    if payload.status == "production":
        for item in session.scalars(
            select(GlobalSkillVersion).where(GlobalSkillVersion.global_skill_id == definition.id)
        ):
            if item.id != version.id:
                item.status = "archived" if item.status == "production" else item.status
                session.add(item)
    session.add(version)
    session.commit()
    session.refresh(version)
    return _map_global_skill_version_read(version)


def update_global_skill_version(
    session: Session,
    *,
    skill_id: int,
    version_id: int,
    payload: GlobalSkillVersionUpdate,
) -> GlobalSkillVersionRead:
    _get_global_skill_definition(session, skill_id)
    version = _get_global_skill_version(session, version_id)
    if version.global_skill_id != skill_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Global skill version not found",
        )

    if payload.version_label is not None:
        version.version_label = payload.version_label
    if payload.prompt_template is not None:
        version.prompt_template = payload.prompt_template
    if payload.scenario_taxonomy is not None:
        version.scenario_taxonomy = list(payload.scenario_taxonomy)
    if payload.review_checklist is not None:
        version.review_checklist = list(payload.review_checklist)
    if payload.coverage_dimensions is not None:
        version.coverage_dimensions = list(payload.coverage_dimensions)
    if payload.evidence_policy is not None:
        version.evidence_policy = payload.evidence_policy
    if payload.storage_uri is not None:
        version.storage_uri = payload.storage_uri
    if payload.change_log is not None:
        version.change_log = payload.change_log
    if payload.release_notes is not None:
        version.release_notes = payload.release_notes
    if payload.created_by is not None:
        version.created_by = payload.created_by
    if payload.status is not None:
        version.status = payload.status
        if payload.status == "production":
            version.published_at = _utcnow()
            for item in session.scalars(
                select(GlobalSkillVersion).where(
                    GlobalSkillVersion.global_skill_id == skill_id,
                    GlobalSkillVersion.id != version.id,
                )
            ):
                if item.status == "production":
                    item.status = "archived"
                    session.add(item)
    session.add(version)
    session.commit()
    session.refresh(version)
    return _map_global_skill_version_read(version)


def publish_global_skill_version(
    session: Session,
    *,
    skill_id: int,
    version_id: int,
) -> GlobalSkillVersionRead:
    return update_global_skill_version(
        session,
        skill_id=skill_id,
        version_id=version_id,
        payload=GlobalSkillVersionUpdate(status="production"),
    )


def rollback_global_skill_version(
    session: Session,
    *,
    skill_id: int,
    version_id: int,
) -> GlobalSkillVersionRead:
    return publish_global_skill_version(
        session,
        skill_id=skill_id,
        version_id=version_id,
    )


def _resolve_binding_version(
    session: Session,
    *,
    global_skill_id: int,
    global_skill_version_id: int | None,
) -> GlobalSkillVersion:
    if global_skill_version_id is not None:
        version = _get_global_skill_version(session, global_skill_version_id)
        if version.global_skill_id != global_skill_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Global skill version does not belong to the selected skill",
            )
        return version

    version = _get_current_production_version(session, global_skill_id)
    if version is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Selected global skill has no production version yet",
        )
    return version


def list_project_skill_bindings(
    session: Session,
    project_id: int,
) -> list[ProjectSkillBindingRead]:
    _get_project(session, project_id)
    bindings = list(
        session.scalars(
            select(ProjectSkillBinding)
            .where(ProjectSkillBinding.project_id == project_id)
            .order_by(
                ProjectSkillBinding.is_default.desc(),
                ProjectSkillBinding.id,
            )
        )
    )
    return [_map_project_skill_binding_read(session, binding) for binding in bindings]


def create_project_skill_binding(
    session: Session,
    project_id: int,
    payload: ProjectSkillBindingCreate,
) -> ProjectSkillBindingRead:
    project_service.ensure_project_is_active(_get_project(session, project_id))
    definition = _get_global_skill_definition(session, payload.global_skill_id)
    version = _resolve_binding_version(
        session,
        global_skill_id=definition.id,
        global_skill_version_id=payload.global_skill_version_id,
    )

    existing_binding = session.scalar(
        select(ProjectSkillBinding).where(
            ProjectSkillBinding.project_id == project_id,
            ProjectSkillBinding.global_skill_id == definition.id,
            ProjectSkillBinding.binding_type == payload.binding_type,
        )
    )
    if existing_binding is not None:
        existing_binding.global_skill_version_id = version.id
        existing_binding.status = "active"
        existing_binding.override_payload = dict(payload.override_payload or {})
        if payload.is_default:
            for binding in session.scalars(
                select(ProjectSkillBinding).where(ProjectSkillBinding.project_id == project_id)
            ):
                binding.is_default = binding.id == existing_binding.id
                session.add(binding)
        session.add(existing_binding)
        session.commit()
        session.refresh(existing_binding)
        return _map_project_skill_binding_read(session, existing_binding)

    has_default = session.scalar(
        select(ProjectSkillBinding.id).where(
            ProjectSkillBinding.project_id == project_id,
            ProjectSkillBinding.is_default.is_(True),
        )
    )
    is_default = payload.is_default or has_default is None
    if is_default:
        for binding in session.scalars(
            select(ProjectSkillBinding).where(ProjectSkillBinding.project_id == project_id)
        ):
            binding.is_default = False
            session.add(binding)

    binding = ProjectSkillBinding(
        project_id=project_id,
        global_skill_id=definition.id,
        global_skill_version_id=version.id,
        binding_type=payload.binding_type,
        status="active",
        is_default=is_default,
        override_payload=dict(payload.override_payload or {}),
    )
    session.add(binding)
    session.commit()
    session.refresh(binding)
    return _map_project_skill_binding_read(session, binding)


def set_project_skill_binding_default(
    session: Session,
    *,
    project_id: int,
    binding_id: int,
) -> ProjectSkillBindingRead:
    project_service.ensure_project_is_active(_get_project(session, project_id))
    target = _get_project_skill_binding(session, project_id=project_id, binding_id=binding_id)
    for binding in session.scalars(
        select(ProjectSkillBinding).where(ProjectSkillBinding.project_id == project_id)
    ):
        binding.is_default = binding.id == target.id
        session.add(binding)
    session.commit()
    session.refresh(target)
    return _map_project_skill_binding_read(session, target)


def update_project_skill_binding(
    session: Session,
    *,
    project_id: int,
    binding_id: int,
    payload: ProjectSkillBindingUpdate,
) -> ProjectSkillBindingRead:
    project_service.ensure_project_is_active(_get_project(session, project_id))
    target = _get_project_skill_binding(session, project_id=project_id, binding_id=binding_id)
    if payload.global_skill_version_id is not None:
        version = _get_global_skill_version(session, payload.global_skill_version_id)
        if version.global_skill_id != target.global_skill_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Global skill version does not belong to the selected skill",
            )
        target.global_skill_version_id = version.id
    if payload.binding_type is not None:
        target.binding_type = payload.binding_type
    if payload.status is not None:
        target.status = payload.status
    if payload.override_payload is not None:
        target.override_payload = dict(payload.override_payload)
    if payload.is_default is True:
        for binding in session.scalars(
            select(ProjectSkillBinding).where(ProjectSkillBinding.project_id == project_id)
        ):
            binding.is_default = binding.id == target.id
            session.add(binding)
    session.add(target)
    session.commit()
    session.refresh(target)
    return _map_project_skill_binding_read(session, target)
