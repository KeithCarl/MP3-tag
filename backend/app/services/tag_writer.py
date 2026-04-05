from mutagen.id3 import (
    ID3,
    ID3NoHeaderError,
    TIT2,
    TPE1,
    TALB,
    TDRC,
    TCON,
    TRCK,
    COMM,
    USLT,
)

from app.models.file_info import TagData, ID3Version
from app.models.responses import TagDiffField
from app.services import tag_reader
from app.services import backup_service


def compute_diff(current: TagData, new: TagData) -> list[TagDiffField]:
    """Compute a diff between current and new tags, only for non-None new fields."""
    fields = [
        "title",
        "artist",
        "album",
        "year",
        "genre",
        "track_number",
        "comment",
        "lyrics",
    ]
    diff = []
    for field in fields:
        new_val = getattr(new, field)
        if new_val is None:
            # Skip: null means keep existing
            continue
        old_val = getattr(current, field)
        if old_val != new_val:
            diff.append(TagDiffField(field=field, old_value=old_val, new_value=new_val))
    return diff


def write_tags(
    path: str,
    tag_data: TagData,
    version: ID3Version,
    dry_run: bool,
    backup: bool,
) -> list[TagDiffField]:
    """
    Write tags to an MP3 file.

    - None fields are skipped (null-means-skip)
    - dry_run=True returns diff without saving
    - backup=True creates .bak before writing
    """
    # 1. Read current tags for diff
    current, _ = tag_reader.read_tags(path)
    diff = compute_diff(current, tag_data)

    if dry_run:
        return diff

    if backup:
        backup_service.create_backup(path)

    no_header = False
    try:
        tags = ID3(path)
    except ID3NoHeaderError:
        tags = ID3()
        no_header = True

    # Only write non-None fields
    if tag_data.title is not None:
        tags["TIT2"] = TIT2(encoding=3, text=tag_data.title)
    if tag_data.artist is not None:
        tags["TPE1"] = TPE1(encoding=3, text=tag_data.artist)
    if tag_data.album is not None:
        tags["TALB"] = TALB(encoding=3, text=tag_data.album)
    if tag_data.year is not None:
        tags["TDRC"] = TDRC(encoding=3, text=tag_data.year)
    if tag_data.genre is not None:
        tags["TCON"] = TCON(encoding=3, text=tag_data.genre)
    if tag_data.track_number is not None:
        tags["TRCK"] = TRCK(encoding=3, text=tag_data.track_number)
    if tag_data.comment is not None:
        tags.delall("COMM")
        tags["COMM::eng"] = COMM(
            encoding=3, lang="eng", desc="", text=tag_data.comment
        )
    if tag_data.lyrics is not None:
        tags.delall("USLT")
        tags["USLT::eng"] = USLT(
            encoding=3, lang="eng", desc="", text=tag_data.lyrics
        )

    # Always pass path explicitly so newly-created ID3() knows where to save
    if version == ID3Version.V1_1:
        tags.save(path, v1=2, v2_version=0)
    elif version == ID3Version.V2_3:
        tags.save(path, v2_version=3)
    elif version == ID3Version.V2_4:
        tags.save(path, v2_version=4)
    else:
        tags.save(path, v2_version=3)

    return diff
