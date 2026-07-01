def test_project_document_generation_review_publish_flow(client, monkeypatch):
    from app.modules.generation import service as generation_service

    monkeypatch.setattr(
        generation_service,
        "dispatch_generation_task",
        lambda task_id: None,
    )

    project = client.post(
        "/projects",
        json={
            "name": "Payments",
            "code": "payments",
            "description": "Checkout and payment requirements",
        },
    ).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Payments PRD",
            "source_mode": "upload",
            "source_uri": "/tmp/prd.md",
        },
    ).json()
    version = client.post(
        f"/documents/{document['id']}/versions",
        json={
            "filename": "payments-prd.md",
            "content": "# Payments PRD\n\n## Acceptance Criteria\n- Submit checkout order",
        },
    ).json()
    skill_package = client.post(
        f"/projects/{project['id']}/skill-packages",
        json={
            "system_key": "payments",
            "name": "Payments Skill",
        },
    ).json()
    skill_version = client.post(
        f"/skill-packages/{skill_package['id']}/versions",
        json={
            "summary": "Payments v1",
            "content": {
                "prompt_template": "Generate payments test cases",
                "scenario_taxonomy": ["happy_path", "boundary"],
                "review_checklist": ["traceable", "observable"],
            },
        },
    ).json()
    activated_package = client.post(
        f"/projects/{project['id']}/skill-packages/{skill_package['id']}/activate/{skill_version['id']}"
    ).json()
    generation_task = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "cursor",
            "prompt_profile": "default",
            "input_document_version_ids": [version["id"]],
            "input_skill_version_id": skill_version["id"],
        },
    ).json()
    test_case = client.post(
        f"/projects/{project['id']}/test-cases",
        json={
            "title": "Submit a valid checkout order",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["User has items in cart"],
            "steps": [{"text": "Open checkout page"}],
            "expected_results": [{"text": "Checkout form is displayed"}],
            "tags": ["smoke", "checkout"],
            "automation_flag": True,
            "automation_notes": "Stable happy path for downstream automation.",
        },
    ).json()

    approve = client.post(
        f"/test-cases/{test_case['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready for publish",
        },
    )
    publish = client.post(f"/test-cases/{test_case['id']}/publish")
    published_cases = client.get(f"/projects/{project['id']}/published-test-cases")

    assert project["code"] == "payments"
    assert document["type"] == "prd"
    assert document["parse_status"] == "uploaded"
    assert version["version_no"] == 1
    assert skill_package["system_key"] == "payments"
    assert activated_package["active_version_id"] == skill_version["id"]
    assert generation_task["status"] == "queued"
    assert generation_task["input_refs"] == {
        "document_version_ids": [version["id"]],
        "skill_version_id": skill_version["id"],
        "seed_test_case_ids": [],
        "coverage_gap_note": None,
    }
    assert test_case["status"] == "draft"
    assert approve.status_code == 201
    assert publish.status_code == 200
    assert publish.json()["status"] == "published"
    assert published_cases.status_code == 200
    assert [item["title"] for item in published_cases.json()] == [
        "Submit a valid checkout order"
    ]


def test_phase_two_automation_acceptance_flow(client, monkeypatch, tmp_path):
    from app.modules.automation import service as automation_service
    from app.modules.report import service as report_service

    class FakeLarkNotifier:
        def push(self, payload):
            return report_service.LarkPushResult(status="sent", error_message=None)

    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    monkeypatch.setattr(
        report_service,
        "get_lark_notifier",
        lambda _settings: FakeLarkNotifier(),
        raising=False,
    )

    project = client.post(
        "/projects",
        json={
            "name": "Phase Two Acceptance",
            "code": "phase-two-acceptance",
        },
    ).json()
    environment = client.post(
        f"/projects/{project['id']}/environments",
        json={
            "name": "Acceptance Staging",
            "code": "staging",
            "base_url": "https://staging.acceptance.example",
            "api_base_url": "https://api-staging.acceptance.example",
        },
    ).json()
    test_case = client.post(
        f"/projects/{project['id']}/test-cases",
        json={
            "title": "Submit acceptance checkout",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["Cart has an item"],
            "steps": [{"text": "Submit checkout"}],
            "expected_results": [{"text": "Order is confirmed"}],
            "tags": ["phase-two"],
            "automation_flag": True,
            "automation_notes": "Acceptance flow for automation platform.",
        },
    ).json()
    client.post(
        f"/test-cases/{test_case['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready",
        },
    )
    published = client.post(f"/test-cases/{test_case['id']}/publish").json()
    generation = client.post(
        f"/test-cases/{published['id']}/automation-generations"
    ).json()
    schedule = client.post(
        f"/projects/{project['id']}/automation-schedules",
        json={
            "name": "Hourly acceptance smoke",
            "environment_id": environment["id"],
            "target_generation_ids": [generation["id"]],
            "cron_expression": "@hourly",
            "next_run_at": "2026-05-21T10:00:00",
        },
    ).json()
    run = client.post(f"/automation-generations/{generation['id']}/runs").json()
    failed_run = client.patch(
        f"/automation-runs/{run['id']}",
        json={
            "status": "failed",
            "report_path": "automation/runs/run-acceptance/report/index.html",
            "summary": {
                "passed": 2,
                "failed": 1,
            },
            "error_message": "Locator timeout on submit button",
        },
    ).json()
    report = client.post(
        f"/automation-runs/{run['id']}/reports",
        json={
            "kind": "allure",
            "artifact_root": "automation/runs/run-acceptance",
            "index_path": "automation/runs/run-acceptance/report/index.html",
            "summary": {
                "passed": 2,
                "failed": 1,
                "duration_ms": 1240,
            },
        },
    ).json()
    analysis = client.post(f"/automation-runs/{run['id']}/failure-analyses").json()
    proposal = client.post(
        f"/automation-failure-analyses/{analysis['id']}/debug-proposals"
    ).json()
    approved_proposal = client.patch(
        f"/automation-debug-proposals/{proposal['id']}/review",
        json={
            "action": "approve",
            "reviewer_id": "qa.lead",
            "comment": "safe to rerun",
        },
    ).json()
    rerun = client.post(f"/automation-debug-proposals/{proposal['id']}/rerun").json()
    final_report = client.post(f"/automation-runs/{run['id']}/final-report").json()
    pushed = client.post(
        f"/automation-final-reports/{final_report['id']}/push-lark"
    ).json()

    assert schedule["status"] == "active"
    assert failed_run["status"] == "failed"
    assert report["summary"]["failed"] == 1
    assert analysis["classification"] == "automation_issue"
    assert proposal["status"] == "draft"
    assert approved_proposal["status"] == "approved"
    assert rerun["trigger_mode"] == "debug_rerun"
    assert final_report["summary"]["failure_analysis"]["classification"] == "automation_issue"
    assert pushed["lark_status"] == "sent"
