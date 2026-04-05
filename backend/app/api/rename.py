from fastapi import APIRouter, HTTPException
from pathlib import Path

from app.dependencies import get_registry
from app.models.requests import RenamePreviewRequest, RenameApplyRequest
from app.models.responses import RenamePreviewResponse, RenameApplyResult
from app.services import rename_service, tag_reader
from app.models.file_info import TagData

router = APIRouter()


def _resolve_files(
    file_ids: list[str],
) -> list[tuple[str, str, TagData]]:
    """Resolve file_ids to (file_id, abs_path, tags) tuples."""
    registry = get_registry()
    resolved = []
    for fid in file_ids:
        if fid not in registry:
            continue
        path = registry[fid]
        if not Path(path).exists():
            continue
        try:
            tags, _ = tag_reader.read_tags(path)
        except Exception:
            tags = TagData()
        resolved.append((fid, path, tags))
    return resolved


@router.post("/preview", response_model=RenamePreviewResponse)
async def preview_rename(request: RenamePreviewRequest):
    """Preview renames without applying them."""
    file_tuples = _resolve_files(request.file_ids)
    items = rename_service.preview_renames(
        file_tuples,
        template=request.template,
        regex_match=request.regex_match,
        regex_replace=request.regex_replace,
    )
    return RenamePreviewResponse(items=items)


@router.post("/apply", response_model=list[RenameApplyResult])
async def apply_rename(request: RenameApplyRequest):
    """Apply renames with optional backup."""
    file_tuples = _resolve_files(request.file_ids)
    results = rename_service.apply_renames(
        file_tuples,
        template=request.template,
        regex_match=request.regex_match,
        regex_replace=request.regex_replace,
        backup=request.backup,
    )
    return results
