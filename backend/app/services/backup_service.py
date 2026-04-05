import shutil
from pathlib import Path

from app.config import settings


def create_backup(path: str) -> str:
    """Create a .bak backup of the file. Returns backup path."""
    src = Path(path)
    backup_path = src.with_suffix(src.suffix + settings.default_backup_suffix)
    shutil.copy2(str(src), str(backup_path))
    return str(backup_path)


def get_backup_path(path: str) -> str:
    """Return the expected backup path for a file."""
    src = Path(path)
    return str(src.with_suffix(src.suffix + settings.default_backup_suffix))


def backup_exists(path: str) -> bool:
    """Check if backup exists for a given file."""
    return Path(get_backup_path(path)).exists()


def restore_backup(path: str) -> bool:
    """Restore a backup file to its original path. Returns True on success."""
    backup = Path(get_backup_path(path))
    if not backup.exists():
        return False
    shutil.copy2(str(backup), path)
    return True


def delete_backup(path: str) -> bool:
    """Delete backup file. Returns True if it existed and was deleted."""
    backup = Path(get_backup_path(path))
    if backup.exists():
        backup.unlink()
        return True
    return False
