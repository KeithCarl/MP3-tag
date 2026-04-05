from pathlib import Path
from fastapi import HTTPException
from app.config import settings


def validate_path(user_path: str) -> Path:
    """Validate that a path is within the allowed root and exists."""
    allowed = Path(settings.allowed_root).resolve()
    p = Path(user_path).resolve()
    try:
        p.relative_to(allowed)
    except ValueError:
        raise HTTPException(403, "Path outside allowed root")
    if not p.exists():
        raise HTTPException(404, "Path does not exist")
    return p


def validate_path_no_exist_check(user_path: str) -> Path:
    """Validate path is within allowed root but don't require it to exist."""
    allowed = Path(settings.allowed_root).resolve()
    p = Path(user_path).resolve()
    try:
        p.relative_to(allowed)
    except ValueError:
        raise HTTPException(403, "Path outside allowed root")
    return p


def is_within_allowed_root(user_path: str) -> bool:
    """Check (without raising) whether path is within allowed root."""
    allowed = Path(settings.allowed_root).resolve()
    p = Path(user_path).resolve()
    try:
        p.relative_to(allowed)
        return True
    except ValueError:
        return False
