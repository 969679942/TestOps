from datetime import datetime
from typing import Annotated, Any, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_serializer, model_validator

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
TestCaseStatus = Literal["draft", "needs_update", "approved", "rejected", "published"]


class StepItem(BaseModel):
    """Structured UI automation step; `text` is synthesized when omitted."""

    model_config = ConfigDict(extra="allow")

    text: str | None = None
    action: str | None = None
    target: str | None = None
    locator_hint: str | None = None
    value: str | None = None
    assertion: str | None = None
    timeout_ms: int | None = None
    order: int | None = None

    @model_validator(mode="after")
    def ensure_text(self) -> Self:
        if self.text and self.text.strip():
            self.text = self.text.strip()
            return self

        parts: list[str] = []
        if self.action:
            parts.append(f"[{self.action}]")
        if self.target:
            parts.append(self.target)
        if self.value:
            parts.append(f"值: {self.value}")
        if self.assertion:
            parts.append(f"断言: {self.assertion}")

        synthesized = " ".join(parts).strip()
        if not synthesized:
            raise ValueError("Each step must include text or action+target")
        self.text = synthesized
        return self

    def model_dump(self, **kwargs: Any) -> dict[str, Any]:
        kwargs.setdefault("exclude_none", True)
        return super().model_dump(**kwargs)

    @model_serializer(mode="wrap")
    def serialize_model(self, handler: Any) -> dict[str, Any]:
        data = handler(self)
        if not isinstance(data, dict):
            return data
        return {key: value for key, value in data.items() if value is not None}


class UIContext(BaseModel):
    schema_version: str = "ui-automation-v1"
    framework: str = "playwright"
    base_url: str | None = None
    browser: str = "chromium"
    viewport: dict[str, int] | None = None
    entry_path: str | None = None
    entry_ready_selector: str | None = None
    test_data: dict[str, str] = Field(default_factory=dict)
    teardown: str | None = None


class TestCaseCreate(BaseModel):
    title: NonEmptyStr
    module: NonEmptyStr
    feature: NonEmptyStr
    case_type: NonEmptyStr
    priority: NonEmptyStr
    preconditions: list[NonEmptyStr] = Field(default_factory=list)
    steps: list[StepItem] = Field(min_length=1)
    expected_results: list[StepItem] = Field(min_length=1)
    tags: list[NonEmptyStr] = Field(default_factory=list)
    automation_flag: bool = False
    automation_notes: str | None = None
    ui_context: UIContext | None = None
    status: Literal["draft"] = "draft"


class TestCaseUpdate(BaseModel):
    title: NonEmptyStr
    module: NonEmptyStr
    feature: NonEmptyStr
    case_type: NonEmptyStr
    priority: NonEmptyStr
    preconditions: list[NonEmptyStr] = Field(default_factory=list)
    steps: list[StepItem] = Field(min_length=1)
    expected_results: list[StepItem] = Field(min_length=1)
    tags: list[NonEmptyStr] = Field(default_factory=list)
    automation_flag: bool = False
    automation_notes: str | None = None


class TestCaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    module: str
    feature: str
    case_type: str
    priority: str
    preconditions: list[str]
    steps: list[StepItem]
    expected_results: list[StepItem]
    tags: list[str]
    automation_flag: bool
    automation_notes: str | None
    ui_context: UIContext | None
    status: TestCaseStatus
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None


class TestCaseUpdate(BaseModel):
    title: NonEmptyStr | None = None
    module: NonEmptyStr | None = None
    feature: NonEmptyStr | None = None
    case_type: NonEmptyStr | None = None
    priority: NonEmptyStr | None = None
    preconditions: list[NonEmptyStr] | None = None
    steps: list[StepItem] | None = None
    expected_results: list[StepItem] | None = None
    tags: list[NonEmptyStr] | None = None
    automation_flag: bool | None = None
    automation_notes: str | None = None
    ui_context: UIContext | None = None


class TestCaseImportRequest(BaseModel):
    cases: list[TestCaseCreate] = Field(min_length=1, max_length=100)
