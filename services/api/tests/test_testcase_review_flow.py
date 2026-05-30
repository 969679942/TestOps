import sqlite3


def _create_project(client):
    response = client.post(
        "/projects",
        json={
            "name": "Checkout Platform",
            "code": "checkout-platform",
            "description": "Project for testcase workflow coverage",
        },
    )

    assert response.status_code == 201
    return response.json()


def _create_test_case(client, project_id: int):
    response = client.post(
        f"/projects/{project_id}/test-cases",
        json={
            "title": "Submit a valid checkout order",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["User has items in cart"],
            "steps": [
                {"text": "Open the checkout page"},
                {"text": "Submit the order with valid card details"},
            ],
            "expected_results": [
                {"text": "The checkout form is displayed."},
                {"text": "The order is accepted and a confirmation page is shown."},
            ],
            "tags": ["smoke", "checkout"],
            "automation_flag": True,
            "automation_notes": "Stable happy path for downstream automation.",
        },
    )

    assert response.status_code == 201
    return response.json()


def test_review_publish_and_handoff_flow(client):
    project = _create_project(client)
    test_case = _create_test_case(client, project["id"])
    publish_before_review = client.post(f"/test-cases/{test_case['id']}/publish")

    approve = client.post(
        f"/test-cases/{test_case['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready for publish",
        },
    )
    reviews = client.get(f"/test-cases/{test_case['id']}/reviews")
    publish = client.post(f"/test-cases/{test_case['id']}/publish")
    published_cases = client.get(f"/projects/{project['id']}/published-test-cases")

    assert test_case["status"] == "draft"
    assert test_case["steps"] == [
        {"text": "Open the checkout page"},
        {"text": "Submit the order with valid card details"},
    ]
    assert test_case["expected_results"] == [
        {"text": "The checkout form is displayed."},
        {"text": "The order is accepted and a confirmation page is shown."},
    ]
    assert publish_before_review.status_code == 409
    assert publish_before_review.json() == {"detail": "Only approved cases can be published"}
    assert approve.status_code == 201
    assert approve.json()["action"] == "approve"
    assert reviews.status_code == 200
    assert reviews.json() == [
        {
            "id": approve.json()["id"],
            "test_case_id": test_case["id"],
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready for publish",
            "created_at": approve.json()["created_at"],
        }
    ]
    assert publish.status_code == 200
    assert publish.json()["status"] == "published"
    assert publish.json()["published_at"] is not None
    assert published_cases.status_code == 200
    assert published_cases.json() == [
        {
            "id": test_case["id"],
            "project_id": project["id"],
            "title": "Submit a valid checkout order",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["User has items in cart"],
            "steps": [
                {"text": "Open the checkout page"},
                {"text": "Submit the order with valid card details"},
            ],
            "expected_results": [
                {"text": "The checkout form is displayed."},
                {"text": "The order is accepted and a confirmation page is shown."},
            ],
            "tags": ["smoke", "checkout"],
            "automation_flag": True,
            "automation_notes": "Stable happy path for downstream automation.",
            "status": "published",
            "created_at": publish.json()["created_at"],
            "updated_at": publish.json()["updated_at"],
            "published_at": publish.json()["published_at"],
        }
    ]

    reviews_after_publish = client.get(f"/test-cases/{test_case['id']}/reviews")

    assert reviews_after_publish.status_code == 200
    assert reviews_after_publish.json() == [
        {
            "id": approve.json()["id"],
            "test_case_id": test_case["id"],
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready for publish",
            "created_at": approve.json()["created_at"],
        },
        {
            "id": reviews_after_publish.json()[1]["id"],
            "test_case_id": test_case["id"],
            "reviewer_id": "system",
            "action": "publish",
            "comment": None,
            "created_at": reviews_after_publish.json()[1]["created_at"],
        },
    ]


def test_list_test_cases_returns_project_drafts(client):
    project = _create_project(client)
    first_case = _create_test_case(client, project["id"])
    second_case = client.post(
        f"/projects/{project['id']}/test-cases",
        json={
            "title": "Reject invalid promo code",
            "module": "Checkout",
            "feature": "Promotions",
            "case_type": "negative",
            "priority": "medium",
            "preconditions": ["User has items in cart"],
            "steps": [
                {"text": "Open the checkout page"},
                {"text": "Apply an expired promo code"},
            ],
            "expected_results": [
                {"text": "The expired promo code is rejected."},
            ],
            "tags": ["checkout", "negative"],
            "automation_flag": False,
            "automation_notes": None,
        },
    )
    response = client.get(f"/projects/{project['id']}/test-cases")

    assert second_case.status_code == 201
    assert response.status_code == 200
    assert [item["title"] for item in response.json()] == [
        first_case["title"],
        "Reject invalid promo code",
    ]


def test_update_test_case_edits_reviewable_fields(client):
    project = _create_project(client)
    test_case = _create_test_case(client, project["id"])

    response = client.patch(
        f"/test-cases/{test_case['id']}",
        json={
            "title": "Submit checkout order with wallet",
            "module": "Payments",
            "feature": "Wallet checkout",
            "case_type": "functional",
            "priority": "medium",
            "preconditions": ["User has a wallet balance"],
            "steps": [
                {"text": "Open checkout"},
                {"text": "Select wallet and submit the order"},
            ],
            "expected_results": [
                {"text": "The order is confirmed."},
                {"text": "The wallet balance is debited."},
            ],
            "tags": ["wallet", "checkout"],
            "automation_flag": False,
            "automation_notes": "Needs wallet fixture before automation.",
        },
    )
    listed = client.get(f"/projects/{project['id']}/test-cases")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == test_case["id"]
    assert body["title"] == "Submit checkout order with wallet"
    assert body["module"] == "Payments"
    assert body["feature"] == "Wallet checkout"
    assert body["priority"] == "medium"
    assert body["preconditions"] == ["User has a wallet balance"]
    assert body["steps"] == [
        {"text": "Open checkout"},
        {"text": "Select wallet and submit the order"},
    ]
    assert body["expected_results"] == [
        {"text": "The order is confirmed."},
        {"text": "The wallet balance is debited."},
    ]
    assert body["tags"] == ["wallet", "checkout"]
    assert body["automation_flag"] is False
    assert body["automation_notes"] == "Needs wallet fixture before automation."
    assert body["status"] == "draft"
    assert listed.status_code == 200
    assert listed.json()[0]["title"] == "Submit checkout order with wallet"


def test_update_test_case_rejects_published_case(client):
    project = _create_project(client)
    test_case = _create_test_case(client, project["id"])
    approve = client.post(
        f"/test-cases/{test_case['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready",
        },
    )
    publish = client.post(f"/test-cases/{test_case['id']}/publish")

    response = client.patch(
        f"/test-cases/{test_case['id']}",
        json={
            "title": "Mutate published case",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["User has items in cart"],
            "steps": [{"text": "Open checkout"}],
            "expected_results": [{"text": "Order is submitted"}],
            "tags": ["checkout"],
            "automation_flag": True,
            "automation_notes": None,
        },
    )

    assert approve.status_code == 201
    assert publish.status_code == 200
    assert response.status_code == 409
    assert response.json() == {"detail": "Published test cases cannot be edited"}


def test_list_test_cases_returns_404_for_missing_project(client):
    response = client.get("/projects/9999/test-cases")

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}


def test_list_test_cases_excludes_closed_cases(client):
    project = _create_project(client)
    published_case = _create_test_case(client, project["id"])
    rejected_case = client.post(
        f"/projects/{project['id']}/test-cases",
        json={
            "title": "Reject invalid promo code",
            "module": "Checkout",
            "feature": "Promotions",
            "case_type": "negative",
            "priority": "medium",
            "preconditions": ["User has items in cart"],
            "steps": [{"text": "Open the checkout page"}],
            "expected_results": [{"text": "The invalid promo code is rejected."}],
            "tags": ["checkout", "negative"],
            "automation_flag": False,
            "automation_notes": None,
        },
    ).json()

    approve = client.post(
        f"/test-cases/{published_case['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready for publish",
        },
    )
    reject = client.post(
        f"/test-cases/{rejected_case['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "reject",
            "comment": "not a valid scenario",
        },
    )
    publish = client.post(f"/test-cases/{published_case['id']}/publish")
    response = client.get(f"/projects/{project['id']}/test-cases")

    assert approve.status_code == 201
    assert reject.status_code == 201
    assert publish.status_code == 200
    assert response.status_code == 200
    assert response.json() == []


def _read_test_case_status(test_database_url: str, test_case_id: int) -> str:
    with sqlite3.connect(test_database_url.removeprefix("sqlite:///")) as connection:
        row = connection.execute(
            "SELECT status FROM test_cases WHERE id = ?",
            (test_case_id,),
        ).fetchone()

    assert row is not None
    return row[0]


def test_review_actions_preserve_spec_compliant_statuses(client, test_database_url):
    project = _create_project(client)
    test_case = _create_test_case(client, project["id"])

    comment = client.post(
        f"/test-cases/{test_case['id']}/reviews",
        json={
            "reviewer_id": "qa.observer",
            "action": "comment",
            "comment": "Needs one more pass on wording.",
        },
    )
    comment_status = _read_test_case_status(test_database_url, test_case["id"])
    request_change = client.post(
        f"/test-cases/{test_case['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "request_change",
            "comment": "Clarify the post-submit expected result.",
        },
    )
    request_change_status = _read_test_case_status(test_database_url, test_case["id"])
    reject = client.post(
        f"/test-cases/{test_case['id']}/reviews",
        json={
            "reviewer_id": "qa.manager",
            "action": "reject",
            "comment": "Blocking issue found in the current scenario.",
        },
    )
    reject_status = _read_test_case_status(test_database_url, test_case["id"])
    reviews = client.get(f"/test-cases/{test_case['id']}/reviews")

    assert comment.status_code == 201
    assert comment.json()["action"] == "comment"
    assert comment_status == "draft"
    assert request_change.status_code == 201
    assert request_change.json()["action"] == "request_change"
    assert request_change_status == "needs_update"
    assert reject.status_code == 201
    assert reject.json()["action"] == "reject"
    assert reject_status == "rejected"
    assert reviews.status_code == 200
    assert [item["action"] for item in reviews.json()] == [
        "comment",
        "request_change",
        "reject",
    ]

    published_cases = client.get(f"/projects/{project['id']}/published-test-cases")

    assert published_cases.status_code == 200
    assert published_cases.json() == []


def test_review_endpoint_rejects_client_publish_action(client):
    project = _create_project(client)
    test_case = _create_test_case(client, project["id"])

    response = client.post(
        f"/test-cases/{test_case['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "publish",
            "comment": "attempting to bypass dedicated publish flow",
        },
    )

    assert response.status_code == 422


def test_review_endpoint_rejects_mutating_actions_after_publish(client, test_database_url):
    project = _create_project(client)
    test_case = _create_test_case(client, project["id"])

    approve = client.post(
        f"/test-cases/{test_case['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready for publish",
        },
    )
    publish = client.post(f"/test-cases/{test_case['id']}/publish")
    post_publish_review = client.post(
        f"/test-cases/{test_case['id']}/reviews",
        json={
            "reviewer_id": "qa.manager",
            "action": "reject",
            "comment": "should not mutate a published case",
        },
    )
    reviews = client.get(f"/test-cases/{test_case['id']}/reviews")

    assert approve.status_code == 201
    assert publish.status_code == 200
    assert post_publish_review.status_code == 409
    assert post_publish_review.json() == {
        "detail": "Published test cases cannot be reviewed"
    }
    assert _read_test_case_status(test_database_url, test_case["id"]) == "published"
    assert [item["action"] for item in reviews.json()] == ["approve", "publish"]
