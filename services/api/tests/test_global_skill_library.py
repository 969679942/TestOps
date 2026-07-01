def test_global_skill_library_seeds_and_lists_definitions(client):
    response = client.get("/skills/library")

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    assert data[0]["skill_key"] == "prd_rules_core"
    assert data[0]["current_production_version_label"] == "v1 Production"
    assert "prd" in data[0]["input_types"]


def test_global_skill_library_returns_detail_and_versions(client):
    library = client.get("/skills/library")
    assert library.status_code == 200
    skill_id = library.json()[0]["id"]

    detail = client.get(f"/skills/library/{skill_id}")
    versions = client.get(f"/skills/library/{skill_id}/versions")

    assert detail.status_code == 200
    assert versions.status_code == 200
    assert detail.json()["skill_key"] == "prd_rules_core"
    assert versions.json()[0]["status"] == "production"
    assert "traceable" in versions.json()[0]["review_checklist"]


def test_project_skill_bindings_can_be_created_listed_and_switched_default(client):
    project = client.post(
        "/projects",
        json={"name": "Skill Binding Project", "code": "skill-binding-project"},
    ).json()
    library = client.get("/skills/library")
    assert library.status_code == 200

    first_skill = library.json()[0]
    second_skill = library.json()[1]

    first_binding = client.post(
        f"/projects/{project['id']}/skill-bindings",
        json={
            "global_skill_id": first_skill["id"],
            "binding_type": "primary",
            "is_default": True,
        },
    )
    second_binding = client.post(
        f"/projects/{project['id']}/skill-bindings",
        json={
            "global_skill_id": second_skill["id"],
            "binding_type": "api",
            "is_default": False,
        },
    )

    assert first_binding.status_code == 201
    assert second_binding.status_code == 201
    assert first_binding.json()["is_default"] is True
    assert second_binding.json()["is_default"] is False

    set_default = client.post(
        f"/projects/{project['id']}/skill-bindings/{second_binding.json()['id']}/set-default"
    )
    bindings = client.get(f"/projects/{project['id']}/skill-bindings")

    assert set_default.status_code == 200
    assert set_default.json()["id"] == second_binding.json()["id"]
    assert set_default.json()["is_default"] is True
    assert bindings.status_code == 200
    assert bindings.json()[0]["id"] == second_binding.json()["id"]
    assert bindings.json()[0]["skill_name"] == second_skill["name"]
    assert bindings.json()[0]["version_label"] == second_skill["current_production_version_label"]

    switched_binding = client.patch(
        f"/projects/{project['id']}/skill-bindings/{second_binding.json()['id']}",
        json={
            "global_skill_version_id": second_skill["current_production_version_id"],
            "is_default": True,
        },
    )

    assert switched_binding.status_code == 200
    assert switched_binding.json()["global_skill_version_id"] == second_skill["current_production_version_id"]
    assert switched_binding.json()["is_default"] is True


def test_global_skill_library_supports_create_update_and_publish(client):
    created_skill = client.post(
        "/skills/library",
        json={
            "skill_key": "recovery_plus",
            "name": "恢复补场景模板",
            "description": "Focus on recovery and rollback.",
            "category": "extension",
            "domain": "general",
            "input_types": ["prd", "business_rule"],
            "owner": "workspace",
        },
    )

    assert created_skill.status_code == 201
    skill_id = created_skill.json()["id"]
    assert created_skill.json()["skill_key"] == "recovery_plus"

    updated_skill = client.patch(
        f"/skills/library/{skill_id}",
        json={
            "description": "Updated recovery coverage",
            "status": "active",
        },
    )

    assert updated_skill.status_code == 200
    assert updated_skill.json()["description"] == "Updated recovery coverage"

    created_version = client.post(
        f"/skills/library/{skill_id}/versions",
        json={
            "version_label": "v1 Draft",
            "prompt_template": "Generate recovery cases",
            "scenario_taxonomy": ["recovery", "rollback"],
            "review_checklist": ["traceable"],
            "coverage_dimensions": ["exception_flow"],
            "evidence_policy": "Only use explicit evidence.",
            "storage_uri": "oss://skills/recovery-plus/v1.zip",
            "change_log": "Initial draft",
            "release_notes": "Draft release",
            "created_by": "workspace",
            "status": "draft",
        },
    )

    assert created_version.status_code == 201
    version_id = created_version.json()["id"]
    assert created_version.json()["status"] == "draft"

    updated_version = client.patch(
        f"/skills/library/{skill_id}/versions/{version_id}",
        json={
            "version_label": "v1 Candidate",
            "review_checklist": ["traceable", "observable"],
        },
    )

    assert updated_version.status_code == 200
    assert updated_version.json()["version_label"] == "v1 Candidate"
    assert "observable" in updated_version.json()["review_checklist"]

    published_version = client.post(
        f"/skills/library/{skill_id}/versions/{version_id}/publish"
    )

    assert published_version.status_code == 200
    assert published_version.json()["status"] == "production"
    assert published_version.json()["published_at"] is not None

    rolled_back_version = client.post(
        f"/skills/library/{skill_id}/versions/{version_id}/rollback"
    )

    assert rolled_back_version.status_code == 200
    assert rolled_back_version.json()["status"] == "production"
