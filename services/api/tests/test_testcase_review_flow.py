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
