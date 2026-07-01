from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.skills import service as skills_service
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
    SkillPackageVersionRead,
)
from app.schemas.project_skill_binding import (
    ProjectSkillBindingCreate,
    ProjectSkillBindingRead,
    ProjectSkillBindingUpdate,
)

router = APIRouter(tags=["skills"])


@router.get(
    "/skills/library",
    response_model=list[GlobalSkillDefinitionRead],
)
def list_global_skills(
    session: Session = Depends(get_session),
) -> list[GlobalSkillDefinitionRead]:
    return skills_service.list_global_skill_definitions(session)


@router.get(
    "/skills/library/{skill_id}",
    response_model=GlobalSkillDefinitionRead,
)
def get_global_skill(
    skill_id: int,
    session: Session = Depends(get_session),
) -> GlobalSkillDefinitionRead:
    return skills_service.get_global_skill_definition(session, skill_id)


@router.post(
    "/skills/library",
    response_model=GlobalSkillDefinitionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_global_skill(
    payload: GlobalSkillDefinitionCreate,
    session: Session = Depends(get_session),
) -> GlobalSkillDefinitionRead:
    return skills_service.create_global_skill_definition(session, payload)


@router.patch(
    "/skills/library/{skill_id}",
    response_model=GlobalSkillDefinitionRead,
)
def update_global_skill(
    skill_id: int,
    payload: GlobalSkillDefinitionUpdate,
    session: Session = Depends(get_session),
) -> GlobalSkillDefinitionRead:
    return skills_service.update_global_skill_definition(
        session,
        skill_id=skill_id,
        payload=payload,
    )


@router.get(
    "/skills/library/{skill_id}/versions",
    response_model=list[GlobalSkillVersionRead],
)
def list_global_skill_versions(
    skill_id: int,
    session: Session = Depends(get_session),
) -> list[GlobalSkillVersionRead]:
    return skills_service.list_global_skill_versions(session, skill_id)


@router.post(
    "/skills/library/{skill_id}/versions",
    response_model=GlobalSkillVersionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_global_skill_version(
    skill_id: int,
    payload: GlobalSkillVersionCreate,
    session: Session = Depends(get_session),
) -> GlobalSkillVersionRead:
    return skills_service.create_global_skill_version(
        session,
        skill_id=skill_id,
        payload=payload,
    )


@router.patch(
    "/skills/library/{skill_id}/versions/{version_id}",
    response_model=GlobalSkillVersionRead,
)
def update_global_skill_version(
    skill_id: int,
    version_id: int,
    payload: GlobalSkillVersionUpdate,
    session: Session = Depends(get_session),
) -> GlobalSkillVersionRead:
    return skills_service.update_global_skill_version(
        session,
        skill_id=skill_id,
        version_id=version_id,
        payload=payload,
    )


@router.post(
    "/skills/library/{skill_id}/versions/{version_id}/publish",
    response_model=GlobalSkillVersionRead,
)
def publish_global_skill_version(
    skill_id: int,
    version_id: int,
    session: Session = Depends(get_session),
) -> GlobalSkillVersionRead:
    return skills_service.publish_global_skill_version(
        session,
        skill_id=skill_id,
        version_id=version_id,
    )


@router.post(
    "/skills/library/{skill_id}/versions/{version_id}/rollback",
    response_model=GlobalSkillVersionRead,
)
def rollback_global_skill_version(
    skill_id: int,
    version_id: int,
    session: Session = Depends(get_session),
) -> GlobalSkillVersionRead:
    return skills_service.rollback_global_skill_version(
        session,
        skill_id=skill_id,
        version_id=version_id,
    )


@router.get(
    "/projects/{project_id}/skill-bindings",
    response_model=list[ProjectSkillBindingRead],
)
def list_project_skill_bindings(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[ProjectSkillBindingRead]:
    return skills_service.list_project_skill_bindings(session, project_id)


@router.post(
    "/projects/{project_id}/skill-bindings",
    response_model=ProjectSkillBindingRead,
    status_code=status.HTTP_201_CREATED,
)
def create_project_skill_binding(
    project_id: int,
    payload: ProjectSkillBindingCreate,
    session: Session = Depends(get_session),
) -> ProjectSkillBindingRead:
    return skills_service.create_project_skill_binding(session, project_id, payload)


@router.post(
    "/projects/{project_id}/skill-bindings/{binding_id}/set-default",
    response_model=ProjectSkillBindingRead,
)
def set_project_skill_binding_default(
    project_id: int,
    binding_id: int,
    session: Session = Depends(get_session),
) -> ProjectSkillBindingRead:
    return skills_service.set_project_skill_binding_default(
        session,
        project_id=project_id,
        binding_id=binding_id,
    )


@router.patch(
    "/projects/{project_id}/skill-bindings/{binding_id}",
    response_model=ProjectSkillBindingRead,
)
def update_project_skill_binding(
    project_id: int,
    binding_id: int,
    payload: ProjectSkillBindingUpdate,
    session: Session = Depends(get_session),
) -> ProjectSkillBindingRead:
    return skills_service.update_project_skill_binding(
        session,
        project_id=project_id,
        binding_id=binding_id,
        payload=payload,
    )


@router.post(
    "/projects/{project_id}/skill-packages",
    response_model=SkillPackageRead,
    status_code=status.HTTP_201_CREATED,
)
def create_skill_package(
    project_id: int,
    payload: SkillPackageCreate,
    session: Session = Depends(get_session),
) -> SkillPackageRead:
    return skills_service.create_skill_package(session, project_id, payload)


@router.get(
    "/projects/{project_id}/skill-packages",
    response_model=list[SkillPackageRead],
)
def list_skill_packages(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[SkillPackageRead]:
    return skills_service.list_skill_packages(session, project_id)


@router.post(
    "/skill-packages/{skill_package_id}/versions",
    response_model=SkillPackageVersionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_skill_package_version(
    skill_package_id: int,
    payload: SkillPackageVersionCreate,
    session: Session = Depends(get_session),
) -> SkillPackageVersionRead:
    return skills_service.create_skill_package_version(session, skill_package_id, payload)


@router.get(
    "/skill-packages/{skill_package_id}/versions",
    response_model=list[SkillPackageVersionRead],
)
def list_skill_package_versions(
    skill_package_id: int,
    session: Session = Depends(get_session),
) -> list[SkillPackageVersionRead]:
    return skills_service.list_skill_package_versions(session, skill_package_id)


@router.post(
    "/projects/{project_id}/skill-packages/{skill_package_id}/activate/{version_id}",
    response_model=SkillPackageRead,
)
def activate_skill_package_version(
    project_id: int,
    skill_package_id: int,
    version_id: int,
    session: Session = Depends(get_session),
) -> SkillPackageRead:
    return skills_service.activate_skill_package_version(
        session,
        project_id=project_id,
        skill_package_id=skill_package_id,
        version_id=version_id,
    )
