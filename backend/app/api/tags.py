from fastapi import APIRouter, HTTPException
from pathlib import Path

from app.dependencies import get_registry
from app.models.requests import TagWriteRequest, BatchTagWriteRequest
from app.models.responses import TagWriteResult, TagDiffResult
from app.services import tag_writer

router = APIRouter()


def _get_path_from_registry(file_id: str) -> str:
    registry = get_registry()
    if file_id not in registry:
        raise HTTPException(404, f"File '{file_id}' not found in registry")
    path = registry[file_id]
    if not Path(path).exists():
        raise HTTPException(404, f"File no longer exists: {path}")
    return path


@router.put("/{file_id}", response_model=TagWriteResult)
async def update_tags(file_id: str, request: TagWriteRequest):
    """Update tags for a single file."""
    path = _get_path_from_registry(file_id)
    filename = Path(path).name

    try:
        diff = tag_writer.write_tags(
            path=path,
            tag_data=request.tags,
            version=request.version,
            dry_run=request.dry_run,
            backup=request.backup,
        )
        return TagWriteResult(
            file_id=file_id,
            filename=filename,
            success=True,
            diff=diff,
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to write tags: {e}")


@router.post("/batch", response_model=list[TagWriteResult])
async def batch_update_tags(request: BatchTagWriteRequest):
    """Update the same tags across multiple files."""
    results: list[TagWriteResult] = []

    for file_id in request.file_ids:
        try:
            path = _get_path_from_registry(file_id)
            filename = Path(path).name
        except HTTPException as e:
            results.append(
                TagWriteResult(
                    file_id=file_id,
                    filename="",
                    success=False,
                    diff=[],
                    error=e.detail,
                )
            )
            continue

        try:
            diff = tag_writer.write_tags(
                path=path,
                tag_data=request.tags,
                version=request.version,
                dry_run=request.dry_run,
                backup=request.backup,
            )
            results.append(
                TagWriteResult(
                    file_id=file_id,
                    filename=filename,
                    success=True,
                    diff=diff,
                )
            )
        except Exception as e:
            results.append(
                TagWriteResult(
                    file_id=file_id,
                    filename=Path(get_registry().get(file_id, "")).name,
                    success=False,
                    diff=[],
                    error=str(e),
                )
            )

    return results


@router.post("/preview", response_model=list[TagDiffResult])
async def preview_tag_changes(request: BatchTagWriteRequest):
    """Preview tag changes (dry_run forced to True) for multiple files."""
    results: list[TagDiffResult] = []

    for file_id in request.file_ids:
        try:
            path = _get_path_from_registry(file_id)
            filename = Path(path).name
        except HTTPException as e:
            results.append(
                TagDiffResult(
                    file_id=file_id,
                    filename="",
                    diff=[],
                    error=e.detail,
                )
            )
            continue

        try:
            diff = tag_writer.write_tags(
                path=path,
                tag_data=request.tags,
                version=request.version,
                dry_run=True,  # Always dry_run for preview
                backup=False,
            )
            results.append(
                TagDiffResult(
                    file_id=file_id,
                    filename=filename,
                    diff=diff,
                )
            )
        except Exception as e:
            results.append(
                TagDiffResult(
                    file_id=file_id,
                    filename=filename,
                    diff=[],
                    error=str(e),
                )
            )

    return results
