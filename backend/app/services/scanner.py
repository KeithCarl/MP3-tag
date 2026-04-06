import os
from pathlib import Path

from app.config import settings
from app.dependencies import register_file, make_file_id
from app.models.file_info import MP3FileInfo, FolderNode, ID3Version, TagData
from app.services.tag_reader import read_tags, read_audio_info
from app.utils.path_guard import validate_path


def scan_folders(
    paths: list[str],
    max_depth: int | None = None,
    max_files: int | None = None,
) -> tuple[list[MP3FileInfo], bool]:
    """
    Scan folder paths for MP3 files up to max_depth.
    Returns (files, was_capped) where was_capped=True if file limit hit.
    """
    if max_depth is None:
        max_depth = settings.max_scan_depth
    if max_files is None:
        max_files = settings.max_scan_files

    results: list[MP3FileInfo] = []
    capped = False

    for base_path in paths:
        # Validate the path
        try:
            validated = validate_path(base_path)
        except Exception:
            continue

        base_str = str(validated)
        base_depth = base_str.rstrip(os.sep).count(os.sep)

        for root, dirs, files in os.walk(base_str):
            current_depth = root.rstrip(os.sep).count(os.sep) - base_depth
            if current_depth >= max_depth:
                dirs.clear()
                continue

            # Sort for consistent ordering
            dirs.sort()

            for fname in sorted(files):
                if not fname.lower().endswith(".mp3"):
                    continue
                if len(results) >= max_files:
                    capped = True
                    return results, capped

                fpath = os.path.join(root, fname)
                try:
                    info = _build_file_info(fpath)
                    results.append(info)
                except Exception:
                    # Skip files that can't be read
                    continue

    return results, capped


def _build_file_info(fpath: str) -> MP3FileInfo:
    """Build MP3FileInfo for a given file path, registering it."""
    file_id = register_file(fpath)
    stat = os.stat(fpath)
    size_bytes = stat.st_size

    try:
        duration, bitrate = read_audio_info(fpath)
    except Exception:
        duration, bitrate = 0.0, 0

    try:
        tag_data, id3_ver = read_tags(fpath)
    except Exception:
        tag_data = TagData()
        id3_ver = ID3Version.NONE

    allowed_root = Path(settings.allowed_root).resolve()
    try:
        rel_dir = str(Path(fpath).parent.relative_to(allowed_root))
    except ValueError:
        rel_dir = str(Path(fpath).parent)

    return MP3FileInfo(
        file_id=file_id,
        filename=os.path.basename(fpath),
        path=rel_dir,
        size_bytes=size_bytes,
        duration_seconds=round(duration, 2),
        bitrate_kbps=bitrate,
        id3_version=id3_ver,
        tags=tag_data,
    )


def list_subdirs(path: str, depth: int = 1) -> list[FolderNode]:
    """
    Return immediate subdirectories with MP3 counts.
    FolderNode.path is relative to ALLOWED_ROOT for display.
    Raises HTTPException if path is outside allowed root or does not exist.
    """
    # Let HTTPException propagate to the API layer
    validated = validate_path(path)

    allowed_root = Path(settings.allowed_root).resolve()
    nodes: list[FolderNode] = []

    try:
        entries = list(validated.iterdir())
    except PermissionError:
        return []

    for entry in sorted(entries, key=lambda e: e.name):
        if not entry.is_dir():
            continue

        # Count MP3s directly in this dir (non-recursive)
        mp3_count = 0
        try:
            for f in entry.iterdir():
                if f.is_file() and f.name.lower().endswith(".mp3"):
                    mp3_count += 1
        except PermissionError:
            pass

        # Check if it has subdirs
        has_subdirs = False
        try:
            for f in entry.iterdir():
                if f.is_dir():
                    has_subdirs = True
                    break
        except PermissionError:
            pass

        nodes.append(
            FolderNode(
                name=entry.name,
                path=str(entry),
                mp3_count=mp3_count,
                has_subdirs=has_subdirs,
            )
        )

    return nodes
