import re
import os
from pathlib import Path
from typing import Any

from app.models.file_info import TagData
from app.models.responses import RenamePreviewItem, RenameApplyResult
from app.services import backup_service

# Characters illegal in filenames
_ILLEGAL_CHARS = re.compile(r'[/\\:*?"<>|]')


class _SafeMapping(dict):
    """dict subclass that returns '' for missing keys (for str.format_map)."""

    def __missing__(self, key: str) -> str:
        return ""


def _sanitize(name: str) -> str:
    """Replace illegal filename characters with underscores."""
    return _ILLEGAL_CHARS.sub("_", name)


def _build_new_name_from_template(template: str, tags: TagData) -> str:
    """Apply template tokens to produce a new base filename (without .mp3)."""
    mapping = _SafeMapping(
        {
            "artist": tags.artist or "",
            "title": tags.title or "",
            "album": tags.album or "",
            "year": tags.year or "",
            "track": tags.track_number or "",
            "genre": tags.genre or "",
        }
    )
    raw = template.format_map(mapping)
    sanitized = _sanitize(raw)
    return sanitized.strip()


def _build_new_name_from_regex(
    regex_match: str, regex_replace: str, basename: str
) -> str:
    """Apply regex substitution to the basename (without extension)."""
    stem = Path(basename).stem
    try:
        new_stem = re.sub(regex_match, regex_replace, stem)
    except re.error:
        new_stem = stem
    sanitized = _sanitize(new_stem)
    return sanitized.strip()


def _ensure_mp3_extension(name: str) -> str:
    if not name.lower().endswith(".mp3"):
        return name + ".mp3"
    return name


def preview_renames(
    file_paths: list[tuple[str, str, TagData]],  # (file_id, abs_path, tags)
    template: str | None,
    regex_match: str | None,
    regex_replace: str | None,
) -> list[RenamePreviewItem]:
    """
    Preview renames for a list of files.
    Detects conflicts when two files resolve to the same new name in the same directory.
    """
    items: list[RenamePreviewItem] = []

    # Track new names per directory to detect conflicts
    # dir -> {new_name: [index_in_items]}
    dir_name_map: dict[str, dict[str, list[int]]] = {}

    for file_id, abs_path, tags in file_paths:
        old_name = os.path.basename(abs_path)
        parent_dir = str(Path(abs_path).parent)

        try:
            new_stem = _compute_new_stem(old_name, tags, template, regex_match, regex_replace)
            new_name = _ensure_mp3_extension(new_stem) if new_stem else old_name
        except Exception as e:
            items.append(
                RenamePreviewItem(
                    file_id=file_id,
                    old_name=old_name,
                    new_name=old_name,
                    conflict=False,
                    error=str(e),
                )
            )
            continue

        idx = len(items)
        items.append(
            RenamePreviewItem(
                file_id=file_id,
                old_name=old_name,
                new_name=new_name,
                conflict=False,
            )
        )

        if parent_dir not in dir_name_map:
            dir_name_map[parent_dir] = {}
        dir_map = dir_name_map[parent_dir]

        if new_name not in dir_map:
            dir_map[new_name] = [idx]
        else:
            dir_map[new_name].append(idx)

    # Mark conflicts
    for dir_map in dir_name_map.values():
        for name, indices in dir_map.items():
            if len(indices) > 1:
                for idx in indices:
                    items[idx] = items[idx].model_copy(update={"conflict": True})

    return items


def _compute_new_stem(
    old_name: str,
    tags: TagData,
    template: str | None,
    regex_match: str | None,
    regex_replace: str | None,
) -> str:
    """Compute new stem (without .mp3) for a file."""
    if template is not None:
        return _build_new_name_from_template(template, tags)
    elif regex_match is not None and regex_replace is not None:
        return _build_new_name_from_regex(regex_match, regex_replace, old_name)
    else:
        return Path(old_name).stem


def apply_renames(
    file_paths: list[tuple[str, str, TagData]],  # (file_id, abs_path, tags)
    template: str | None,
    regex_match: str | None,
    regex_replace: str | None,
    backup: bool,
) -> list[RenameApplyResult]:
    """Apply renames, with optional backup before each rename."""
    # First get preview to detect conflicts
    preview = preview_renames(file_paths, template, regex_match, regex_replace)
    results: list[RenameApplyResult] = []

    for i, (file_id, abs_path, tags) in enumerate(file_paths):
        item = preview[i]

        if item.error:
            results.append(
                RenameApplyResult(
                    file_id=file_id,
                    old_name=item.old_name,
                    new_name=item.old_name,
                    success=False,
                    error=item.error,
                )
            )
            continue

        if item.conflict:
            results.append(
                RenameApplyResult(
                    file_id=file_id,
                    old_name=item.old_name,
                    new_name=item.new_name,
                    success=False,
                    error="Conflict: another file would get the same name",
                )
            )
            continue

        if item.old_name == item.new_name:
            results.append(
                RenameApplyResult(
                    file_id=file_id,
                    old_name=item.old_name,
                    new_name=item.new_name,
                    success=True,
                )
            )
            continue

        try:
            parent = Path(abs_path).parent
            new_path = str(parent / item.new_name)

            if backup:
                backup_service.create_backup(abs_path)

            os.rename(abs_path, new_path)

            results.append(
                RenameApplyResult(
                    file_id=file_id,
                    old_name=item.old_name,
                    new_name=item.new_name,
                    success=True,
                )
            )
        except Exception as e:
            results.append(
                RenameApplyResult(
                    file_id=file_id,
                    old_name=item.old_name,
                    new_name=item.new_name,
                    success=False,
                    error=str(e),
                )
            )

    return results
