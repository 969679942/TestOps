from fastapi import APIRouter

from app.modules.settings import service as settings_service
from app.schemas.settings import RuntimeSettingsRead, RuntimeSettingsUpdate

router = APIRouter(tags=["settings"])


@router.get("/settings/runtime", response_model=RuntimeSettingsRead)
def get_runtime_settings() -> RuntimeSettingsRead:
    return settings_service.get_runtime_settings()


@router.put("/settings/runtime", response_model=RuntimeSettingsRead)
def update_runtime_settings(payload: RuntimeSettingsUpdate) -> RuntimeSettingsRead:
    return settings_service.update_runtime_settings(payload)
