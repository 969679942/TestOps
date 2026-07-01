def test_create_skill_package_and_activate_version(client):
    project = client.post("/projects", json={"name": "OMS", "code": "oms"}).json()

    package = client.post(
        f"/projects/{project['id']}/skill-packages",
        json={"system_key": "oms", "name": "OMS Test Case Skill"},
    )
    assert package.status_code == 201

    version = client.post(
        f"/skill-packages/{package.json()['id']}/versions",
        json={
            "summary": "OMS v1",
            "storage_uri": "skills://oms/archive/v1",
            "content": {
                "prompt_template": "Generate OMS cases",
                "scenario_taxonomy": ["happy_path", "boundary", "permission"],
                "review_checklist": ["traceable", "observable"],
            },
        },
    )
    assert version.status_code == 201
    assert version.json()["storage_uri"] == "skills://oms/archive/v1"

    activate = client.post(
        f"/projects/{project['id']}/skill-packages/{package.json()['id']}/activate/{version.json()['id']}"
    )
    assert activate.status_code == 200
    assert activate.json()["active_version_id"] == version.json()["id"]


def test_list_skill_packages_returns_active_version_summary(client):
    project = client.post("/projects", json={"name": "CRM", "code": "crm"}).json()

    package = client.post(
        f"/projects/{project['id']}/skill-packages",
        json={"system_key": "crm", "name": "CRM Test Case Skill"},
    )
    assert package.status_code == 201

    version = client.post(
        f"/skill-packages/{package.json()['id']}/versions",
        json={
            "summary": "CRM v1",
            "content": {
                "prompt_template": "Generate CRM cases",
                "scenario_taxonomy": ["happy_path"],
                "review_checklist": ["traceable"],
            },
        },
    )
    assert version.status_code == 201

    activate = client.post(
        f"/projects/{project['id']}/skill-packages/{package.json()['id']}/activate/{version.json()['id']}"
    )
    assert activate.status_code == 200

    response = client.get(f"/projects/{project['id']}/skill-packages")

    assert response.status_code == 200
    assert response.json()[0]["active_version_summary"] == "CRM v1"


def test_archived_project_rejects_skill_package_changes(client):
    project = client.post(
        "/projects",
        json={"name": "Legacy Payments", "code": "legacy-payments"},
    ).json()
    client.patch(
        f"/projects/{project['id']}/status",
        json={"status": "archived"},
    )

    response = client.post(
        f"/projects/{project['id']}/skill-packages",
        json={"system_key": "legacy-payments", "name": "Legacy Payments Skills"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Project is archived. Restore it before making changes."


def test_create_skill_package_version_records_archive_uri_and_metadata(client):
    project = client.post("/projects", json={"name": "Archive Skill", "code": "archive-skill"}).json()

    package = client.post(
        f"/projects/{project['id']}/skill-packages",
        json={"system_key": "archive-skill", "name": "Archive Skill Package"},
    )
    assert package.status_code == 201

    version = client.post(
        f"/skill-packages/{package.json()['id']}/versions",
        json={
            "summary": "Archive v2",
            "storage_uri": "s3://testops-skills/archive-skill/v2.json",
            "content": {
                "prompt_template": "Generate archive skill cases",
                "scenario_taxonomy": ["happy_path", "exception"],
                "review_checklist": ["traceable", "reviewable"],
                "supplement_strategy": "append_missing_scenarios",
            },
        },
    )

    assert version.status_code == 201
    assert version.json()["storage_uri"] == "s3://testops-skills/archive-skill/v2.json"
    assert version.json()["structured_metadata"]["supplement_strategy"] == "append_missing_scenarios"


def test_create_skill_package_version_applies_recommended_template_defaults(client):
    project = client.post("/projects", json={"name": "Template Skill", "code": "template-skill"}).json()

    package = client.post(
        f"/projects/{project['id']}/skill-packages",
        json={"system_key": "template-skill", "name": "Template Skill Package"},
    )
    assert package.status_code == 201

    version = client.post(
        f"/skill-packages/{package.json()['id']}/versions",
        json={
            "summary": "Template v1",
            "template_key": "prd_rules_core",
            "content": {},
        },
    )

    assert version.status_code == 201
    metadata = version.json()["structured_metadata"]
    assert metadata["template_key"] == "prd_rules_core"
    assert "state_transition" in metadata["scenario_taxonomy"]
    assert "automation-ready" in metadata["review_checklist"]
    assert "core_user_journey" in metadata["coverage_dimensions"]
    assert "Only derive cases from explicit requirements" in metadata["evidence_policy"]
