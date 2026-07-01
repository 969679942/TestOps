from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import DocumentAsset, DocumentVersion
from app.models.global_skill_definition import GlobalSkillDefinition
from app.models.global_skill_version import GlobalSkillVersion
from app.models.project_skill_binding import ProjectSkillBinding
from app.models.skill_package import SkillPackage
from app.models.skill_package_version import SkillPackageVersion
from app.modules.skills.templates import build_skill_metadata, DEFAULT_SKILL_TEMPLATE_KEY


def build_generation_context(
    session: Session,
    *,
    project_id: int,
    version_ids: list[int],
    input_refs: dict[str, Any],
) -> dict[str, Any]:
    prd_sections: list[dict[str, Any]] = []
    acceptance_criteria: list[dict[str, Any]] = []
    edge_cases: list[dict[str, Any]] = []
    business_rules: list[dict[str, Any]] = []
    supplements: list[dict[str, Any]] = []
    swagger_hints: list[dict[str, Any]] = []
    figma_hints: list[dict[str, Any]] = []
    ambiguities: list[dict[str, Any]] = []
    requirement_candidates: list[dict[str, Any]] = []
    document_catalog: list[dict[str, Any]] = []

    for version_id in version_ids:
        version = session.scalar(
            select(DocumentVersion).where(DocumentVersion.id == version_id)
        )
        if version is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document version not found: {version_id}",
            )
        asset = session.scalar(
            select(DocumentAsset).where(DocumentAsset.id == version.document_asset_id)
        )
        if asset is None or asset.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document version not found: {version_id}",
            )

        metadata = version.structured_metadata or {}
        document_summary = {
            "document_asset_id": asset.id,
            "document_version_id": version.id,
            "name": asset.name,
            "type": asset.type,
            "parse_status": version.parse_status,
            "metadata": metadata,
        }
        document_catalog.append(document_summary)

        if asset.type == "prd":
            prd_sections.extend(metadata.get("sections", []))
            acceptance_criteria.extend(metadata.get("acceptance_criteria", []))
            requirement_candidates.extend(metadata.get("requirement_items", []))
            edge_cases.extend(metadata.get("edge_cases", []))
            ambiguities.extend(metadata.get("open_questions", []))
        elif asset.type == "business_rule":
            business_rules.extend(metadata.get("rules", []))
            requirement_candidates.extend(metadata.get("constraints", []))
        elif asset.type == "supplement":
            supplements.extend(metadata.get("clarifications", []))
            ambiguities.extend(metadata.get("open_questions", []))
        elif asset.type == "swagger":
            swagger_hints.extend(metadata.get("operations", []))
        elif asset.type == "figma":
            figma_hints.extend(metadata.get("nodes", []))

        if asset.type == "prd" and not metadata:
            prd_sections.append(document_summary)
        elif asset.type == "business_rule" and not metadata:
            business_rules.append(document_summary)
        elif asset.type == "supplement" and not metadata:
            supplements.append(document_summary)

    skill_package = _build_skill_context(
        session,
        project_id=project_id,
        input_refs=input_refs,
    )
    return {
        "project_id": project_id,
        "document_versions": version_ids,
        "document_catalog": document_catalog,
        "prd_sections": prd_sections,
        "acceptance_criteria": acceptance_criteria,
        "edge_cases": edge_cases,
        "business_rules": business_rules,
        "supplements": supplements,
        "swagger_hints": swagger_hints,
        "figma_hints": figma_hints,
        "ambiguities": ambiguities,
        "requirement_candidates": requirement_candidates,
        "skill_package": skill_package,
    }


def _build_skill_context(
    session: Session,
    *,
    project_id: int,
    input_refs: dict[str, Any],
) -> dict[str, Any]:
    raw_skill_version_id = input_refs.get("skill_version_id")
    if isinstance(raw_skill_version_id, int):
        return _build_project_skill_context(
            session,
            project_id=project_id,
            skill_version_id=raw_skill_version_id,
        )

    snapshot = input_refs.get("skill_binding_snapshot")
    if isinstance(snapshot, dict):
        return {
            "id": snapshot.get("global_skill_version_id"),
            "skill_package_id": snapshot.get("global_skill_id"),
            "binding_id": snapshot.get("binding_id"),
            "name": snapshot.get("skill_name"),
            "summary": snapshot.get("version_label"),
            "scenario_taxonomy": snapshot.get("scenario_taxonomy", []),
            "review_checklist": snapshot.get("review_checklist", []),
            "coverage_dimensions": snapshot.get("coverage_dimensions", []),
            "evidence_policy": snapshot.get("evidence_policy"),
            "prompt_template": snapshot.get("prompt_template"),
            "metadata": dict(snapshot),
        }

    raw_binding_id = input_refs.get("skill_binding_id")
    if isinstance(raw_binding_id, int):
        binding = session.scalar(
            select(ProjectSkillBinding).where(ProjectSkillBinding.id == raw_binding_id)
        )
        if binding is None or binding.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project skill binding not found",
            )
        return _build_global_skill_context(
            session,
            binding_id=binding.id,
            global_skill_id=binding.global_skill_id,
            global_skill_version_id=binding.global_skill_version_id,
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No skill input available for generation context",
    )


def _build_project_skill_context(
    session: Session,
    *,
    project_id: int,
    skill_version_id: int,
) -> dict[str, Any]:
    skill_version = session.scalar(
        select(SkillPackageVersion).where(SkillPackageVersion.id == skill_version_id)
    )
    if skill_version is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill package version not found",
        )
    skill_package = session.scalar(
        select(SkillPackage).where(SkillPackage.id == skill_version.skill_package_id)
    )
    if skill_package is None or skill_package.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill package version not found",
        )

    metadata = build_skill_metadata(
        template_key=(skill_version.structured_metadata or {}).get("template_key")
        if isinstance(skill_version.structured_metadata, dict)
        else DEFAULT_SKILL_TEMPLATE_KEY,
        overrides=skill_version.structured_metadata or {},
    )
    return {
        "id": skill_version.id,
        "skill_package_id": skill_package.id,
        "name": skill_package.name,
        "summary": skill_version.summary,
        "scenario_taxonomy": metadata.get("scenario_taxonomy", []),
        "review_checklist": metadata.get("review_checklist", []),
        "coverage_dimensions": metadata.get("coverage_dimensions", []),
        "evidence_policy": metadata.get("evidence_policy"),
        "prompt_template": metadata.get("prompt_template"),
        "metadata": metadata,
    }


def _build_global_skill_context(
    session: Session,
    *,
    binding_id: int,
    global_skill_id: int,
    global_skill_version_id: int,
) -> dict[str, Any]:
    definition = session.scalar(
        select(GlobalSkillDefinition).where(GlobalSkillDefinition.id == global_skill_id)
    )
    version = session.scalar(
        select(GlobalSkillVersion).where(GlobalSkillVersion.id == global_skill_version_id)
    )
    if definition is None or version is None or version.global_skill_id != definition.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Global skill version not found",
        )
    return {
        "id": version.id,
        "skill_package_id": definition.id,
        "binding_id": binding_id,
        "name": definition.name,
        "summary": version.version_label,
        "scenario_taxonomy": list(version.scenario_taxonomy or []),
        "review_checklist": list(version.review_checklist or []),
        "coverage_dimensions": list(version.coverage_dimensions or []),
        "evidence_policy": version.evidence_policy,
        "prompt_template": version.prompt_template,
        "metadata": {
            "template_key": definition.skill_key,
            "template_label": definition.name,
            "global_skill_id": definition.id,
            "global_skill_version_id": version.id,
            "binding_id": binding_id,
        },
    }
