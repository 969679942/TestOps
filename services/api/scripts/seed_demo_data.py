from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.document import DocumentAsset
from app.models.project import Project
from app.models.testcase import TestCase


def _get_or_create_project() -> Project:
    with SessionLocal() as session:
        project = session.scalar(select(Project).where(Project.code == "payments"))
        if project is None:
            project = Project(
                name="Payments",
                code="payments",
                description="Demo checkout and payment flows for local development.",
            )
            session.add(project)
            session.commit()
            session.refresh(project)
        return project


def _ensure_document(project_id: int) -> None:
    with SessionLocal() as session:
        existing_document = session.scalar(
            select(DocumentAsset).where(
                DocumentAsset.project_id == project_id,
                DocumentAsset.name == "Payments PRD",
            )
        )
        if existing_document is not None:
            return

        session.add(
            DocumentAsset(
                project_id=project_id,
                type="prd",
                name="Payments PRD",
                source_mode="upload",
                source_uri="/demo/payments-prd.md",
                parse_status="uploaded",
            )
        )
        session.commit()


def _ensure_test_case(project_id: int) -> None:
    with SessionLocal() as session:
        existing_case = session.scalar(
            select(TestCase).where(
                TestCase.project_id == project_id,
                TestCase.title == "Submit a valid checkout order",
            )
        )
        if existing_case is not None:
            return

        session.add(
            TestCase(
                project_id=project_id,
                title="Submit a valid checkout order",
                module="Checkout",
                feature="Order submission",
                case_type="functional",
                priority="high",
                preconditions=["User has items in cart"],
                steps=[
                    {"text": "Open the checkout page"},
                    {"text": "Submit the order with valid card details"},
                ],
                expected_results=[
                    {"text": "The checkout form is displayed"},
                    {"text": "The order is accepted and confirmation is shown"},
                ],
                tags=["smoke", "checkout"],
                automation_flag=True,
                automation_notes="Stable happy path for downstream automation.",
            )
        )
        session.commit()


def main() -> None:
    print("Seeding demo project, document assets, and draft test cases...")
    project = _get_or_create_project()
    _ensure_document(project.id)
    _ensure_test_case(project.id)
    print("Demo data ready: payments")


if __name__ == "__main__":
    main()
