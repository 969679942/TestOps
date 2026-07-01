def test_list_projects_and_mock_generation(client):
    project = client.post(
        "/projects",
        json={"name": "Generation UI", "code": "generation-ui"},
    ).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Checkout PRD",
            "source_mode": "upload",
            "source_uri": "prd/checkout.pdf",
        },
    ).json()
    version = client.post(
        f"/documents/{document['id']}/versions",
        json={"filename": "checkout.md", "content": "# Checkout"},
    ).json()
    package = client.post(
        f"/projects/{project['id']}/skill-packages",
        json={"system_key": "generation-ui", "name": "Generation UI Skill"},
    ).json()
    skill_version = client.post(
        f"/skill-packages/{package['id']}/versions",
        json={
            "summary": "Generation UI v1",
            "content": {
                "prompt_template": "Generate checkout cases",
                "scenario_taxonomy": ["happy_path", "boundary"],
                "review_checklist": ["traceable"],
            },
        },
    ).json()

    generation = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "mock",
            "input_document_version_ids": [version["id"]],
            "input_skill_version_id": skill_version["id"],
        },
    )
    test_cases = client.get(f"/projects/{project['id']}/test-cases")
    projects = client.get("/projects")

    assert generation.status_code == 201
    assert generation.json()["status"] == "completed"
    assert generation.json()["input_refs"] == {
        "document_version_ids": [version["id"]],
        "skill_version_id": skill_version["id"],
        "seed_test_case_ids": [],
        "coverage_gap_note": None,
    }
    assert test_cases.status_code == 200
    assert len(test_cases.json()) == 3
    assert test_cases.json()[0]["linked_requirement"]
    assert test_cases.json()[0]["source_refs"]
    assert test_cases.json()[0]["generation_task_id"] == generation.json()["id"]
    assert projects.status_code == 200
    assert any(item["id"] == project["id"] for item in projects.json())


def test_generation_task_supports_incremental_supplement_context(client):
    project = client.post(
        "/projects",
        json={"name": "Supplement Cases", "code": "supplement-cases"},
    ).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "business_rule",
            "name": "Refund Rules",
            "source_mode": "upload",
            "source_uri": "rules/refund.md",
        },
    ).json()
    version = client.post(
        f"/documents/{document['id']}/versions",
        json={"filename": "refund.md", "content": "# Refund"},
    ).json()
    package = client.post(
        f"/projects/{project['id']}/skill-packages",
        json={"system_key": "supplement-cases", "name": "Supplement Case Skill"},
    ).json()
    skill_version = client.post(
        f"/skill-packages/{package['id']}/versions",
        json={
            "summary": "Supplement v1",
            "storage_uri": "skills://supplement-cases/v1",
            "content": {
                "prompt_template": "Append missing refund cases",
                "scenario_taxonomy": ["happy_path", "boundary", "permission"],
                "review_checklist": ["traceable"],
            },
        },
    ).json()
    existing_case = client.post(
        f"/projects/{project['id']}/test-cases",
        json={
            "title": "退款成功路径",
            "module": "Refund",
            "feature": "Create refund",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["存在可退款订单"],
            "steps": [{"text": "选择一笔已支付订单并发起退款"}],
            "expected_results": [{"text": "退款申请成功创建"}],
            "tags": ["refund"],
            "automation_flag": False,
            "automation_notes": None,
            "directory_id": None,
            "ui_context": None,
        },
    ).json()

    generation = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "mock",
            "input_document_version_ids": [version["id"]],
            "input_skill_version_id": skill_version["id"],
            "seed_test_case_ids": [existing_case["id"]],
            "coverage_gap_note": "补充退款拒绝、重复退款和权限不足场景",
        },
    )

    assert generation.status_code == 201
    assert generation.json()["status"] == "completed"
    assert generation.json()["input_refs"] == {
        "document_version_ids": [version["id"]],
        "skill_version_id": skill_version["id"],
        "seed_test_case_ids": [existing_case["id"]],
        "coverage_gap_note": "补充退款拒绝、重复退款和权限不足场景",
    }

    generated_cases = client.get(f"/projects/{project['id']}/test-cases").json()
    supplemented_case = generated_cases[-1]
    assert supplemented_case["linked_requirement"] == "补充退款拒绝、重复退款和权限不足场景"
    assert supplemented_case["source_refs"][0]["source_kind"] == "coverage_gap_note"


def test_generation_task_supports_project_skill_binding(client):
    project = client.post(
        "/projects",
        json={"name": "Shared Skill Project", "code": "shared-skill-project"},
    ).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Checkout PRD",
            "source_mode": "upload",
            "source_uri": "prd/checkout-shared.pdf",
        },
    ).json()
    version = client.post(
        f"/documents/{document['id']}/versions",
        json={"filename": "checkout-shared.md", "content": "# Checkout Shared"},
    ).json()
    library = client.get("/skills/library")
    assert library.status_code == 200
    skill_id = library.json()[0]["id"]

    binding = client.post(
        f"/projects/{project['id']}/skill-bindings",
        json={
            "global_skill_id": skill_id,
            "binding_type": "primary",
            "is_default": True,
        },
    )

    assert binding.status_code == 201

    generation = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "mock",
            "input_document_version_ids": [version["id"]],
            "input_skill_binding_id": binding.json()["id"],
        },
    )

    assert generation.status_code == 201
    assert generation.json()["status"] == "completed"
    assert generation.json()["input_refs"]["skill_binding_id"] == binding.json()["id"]
    assert generation.json()["input_refs"]["global_skill_id"] == skill_id
    assert generation.json()["input_refs"]["skill_binding_snapshot"]["skill_name"] == library.json()[0]["name"]

    generated_cases = client.get(f"/projects/{project['id']}/test-cases").json()
    assert generated_cases[0]["generation_task_id"] == generation.json()["id"]
    assert any(
        ref.get("skill_binding_id") == binding.json()["id"]
        and ref.get("global_skill_version_id") == generation.json()["input_refs"]["global_skill_version_id"]
        for ref in generated_cases[0]["source_refs"]
    )
