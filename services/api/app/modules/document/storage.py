from pathlib import Path


class LocalArtifactStorage:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()

    def save_bytes(self, relative_path: str, payload: bytes) -> str:
        candidate = Path(relative_path)
        if candidate.is_absolute() or ".." in candidate.parts:
            raise ValueError("relative_path must stay within the storage root")

        target = (self.root / candidate).resolve()
        target.relative_to(self.root)

        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
        return str(target)
