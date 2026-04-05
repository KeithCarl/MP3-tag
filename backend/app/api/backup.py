from fastapi import APIRouter, HTTPException, Query
from pathlib import Path

from app.dependencies import get_registry
from app.models.responses import BackupInfo
from app.services import backup_service
from app.utils.path_guard import validate_path

router = APIRouter()


@router.get("/list", response_model=list[BackupInfo])
async def list_backups(
    path: str = Query(..., description="Directory path to list backups in"),
):
    """List all backup files in a directory."""
    validated = validate_path(path)
    registry = get_registry()

    # Build reverse map: abs_path -> file_id
    path_to_id = {v: k for k, v in registry.items()}

    backups: list[BackupInfo] = []
    suffix = ".mp3.bak"

    for entry in sorted(validated.iterdir()):
        if entry.is_file() and entry.name.endswith(suffix):
            # The original file would be without .bak
            original_path = str(entry).removesuffix(".bak")
            file_id = path_to_id.get(original_path, "")
            backups.append(
                BackupInfo(
                    file_id=file_id,
                    original_path=original_path,
                    backup_path=str(entry),
                    backup_exists=True,
                )
            )

    return backups


@router.post("/restore/{file_id}", response_model=BackupInfo)
async def restore_backup(file_id: str):
    """Restore backup for a file by its file_id."""
    registry = get_registry()
    if file_id not in registry:
        raise HTTPException(404, f"File '{file_id}' not found in registry")

    path = registry[file_id]
    success = backup_service.restore_backup(path)
    if not success:
        raise HTTPException(404, f"No backup found for file: {path}")

    return BackupInfo(
        file_id=file_id,
        original_path=path,
        backup_path=backup_service.get_backup_path(path),
        backup_exists=backup_service.backup_exists(path),
    )


@router.delete("/{file_id}", response_model=BackupInfo)
async def delete_backup(file_id: str):
    """Delete backup for a file by its file_id."""
    registry = get_registry()
    if file_id not in registry:
        raise HTTPException(404, f"File '{file_id}' not found in registry")

    path = registry[file_id]
    backup_path = backup_service.get_backup_path(path)
    deleted = backup_service.delete_backup(path)

    if not deleted:
        raise HTTPException(404, f"No backup found for file: {path}")

    return BackupInfo(
        file_id=file_id,
        original_path=path,
        backup_path=backup_path,
        backup_exists=False,
    )
