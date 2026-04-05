import asyncio
import json
import os

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from pathlib import Path

from app.config import settings
from app.dependencies import get_registry
from app.models.file_info import TagData, ID3Version
from app.models.requests import ScanRequest
from app.models.responses import FileInfoResponse, FolderTreeResponse
from app.models.file_info import MP3FileInfo
from app.services import scanner, tag_reader
from app.utils.path_guard import validate_path

router = APIRouter()


@router.get("/tree", response_model=FolderTreeResponse)
async def get_folder_tree(
    path: str = Query(..., description="Absolute path to browse"),
    depth: int = Query(1, ge=1, le=5),
):
    """Return immediate subdirectories with MP3 counts."""
    nodes = scanner.list_subdirs(path, depth)
    return FolderTreeResponse(nodes=nodes)


@router.post("/scan-stream")
async def scan_files_stream(request: ScanRequest):
    """Stream scan progress as Server-Sent Events. Each event is a JSON line."""
    max_files = request.limit or settings.max_scan_files
    loop = asyncio.get_event_loop()

    async def generate():
        scanned = 0
        capped = False

        for base_path in request.paths:
            try:
                validated = validate_path(base_path)
            except Exception:
                continue

            base_str = str(validated)
            base_depth = base_str.rstrip(os.sep).count(os.sep)

            for root, dirs, files in os.walk(base_str):
                current_depth = root.rstrip(os.sep).count(os.sep) - base_depth
                if current_depth >= settings.max_scan_depth:
                    dirs.clear()
                    continue
                dirs.sort()

                for fname in sorted(files):
                    if not fname.lower().endswith(".mp3"):
                        continue
                    if scanned >= max_files:
                        capped = True
                        yield f"data: {json.dumps({'type': 'done', 'total': scanned, 'capped': True})}\n\n"
                        return

                    fpath = os.path.join(root, fname)
                    try:
                        info = await loop.run_in_executor(None, scanner._build_file_info, fpath)
                        scanned += 1
                        yield f"data: {json.dumps({'type': 'file', 'scanned': scanned, 'file': info.model_dump()})}\n\n"
                    except Exception:
                        continue

        yield f"data: {json.dumps({'type': 'done', 'total': scanned, 'capped': capped})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/scan", response_model=FileInfoResponse)
async def scan_files(request: ScanRequest):
    """Scan folder paths for MP3 files and populate the file registry."""
    max_files = request.limit or settings.max_scan_files
    files, capped = scanner.scan_folders(
        request.paths,
        max_depth=settings.max_scan_depth,
        max_files=max_files,
    )
    return FileInfoResponse(
        files=files,
        total=len(files),
        capped=capped,
        scanned_paths=request.paths,
    )


@router.get("/{file_id}/tags", response_model=MP3FileInfo)
async def get_file_tags(file_id: str):
    """Get tags for a file by its file_id (must be in registry from a prior scan)."""
    registry = get_registry()
    if file_id not in registry:
        raise HTTPException(404, f"File '{file_id}' not found in registry")

    path = registry[file_id]
    p = Path(path)
    if not p.exists():
        raise HTTPException(404, f"File no longer exists: {path}")

    import os

    try:
        duration, bitrate = tag_reader.read_audio_info(path)
    except Exception:
        duration, bitrate = 0.0, 0

    try:
        tags, id3_ver = tag_reader.read_tags(path)
    except Exception:
        tags = TagData()
        id3_ver = ID3Version.NONE

    return MP3FileInfo(
        file_id=file_id,
        filename=p.name,
        size_bytes=p.stat().st_size,
        duration_seconds=round(duration, 2),
        bitrate_kbps=bitrate,
        id3_version=id3_ver,
        tags=tags,
    )
