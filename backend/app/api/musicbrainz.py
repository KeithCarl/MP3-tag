from fastapi import APIRouter, Query, HTTPException
from pathlib import Path

from app.dependencies import get_registry
from app.models.requests import MBApplyRequest
from app.models.responses import MBRecording, MBRelease, TagWriteResult
from app.models.file_info import TagData
from app.services import musicbrainz_service, tag_writer, tag_reader
from app.models.file_info import ID3Version

router = APIRouter()


@router.get("/search", response_model=list[MBRecording])
async def search_musicbrainz(
    title: str = Query(..., description="Recording title to search for"),
    artist: str | None = Query(None),
    album: str | None = Query(None),
    limit: int = Query(10, ge=1, le=100),
):
    """Search MusicBrainz for recordings."""
    try:
        results = await musicbrainz_service.search_recordings(
            title=title, artist=artist, album=album, limit=limit
        )
        return results
    except Exception as e:
        raise HTTPException(502, f"MusicBrainz error: {e}")


@router.get("/release/{mbid}", response_model=MBRelease)
async def get_release(mbid: str):
    """Fetch a MusicBrainz release by MBID."""
    try:
        release = await musicbrainz_service.get_release(mbid)
        return release
    except Exception as e:
        raise HTTPException(502, f"MusicBrainz error: {e}")


@router.post("/apply", response_model=TagWriteResult)
async def apply_mb_tags(request: MBApplyRequest):
    """
    Apply tags from a MusicBrainz recording to a local file.
    Only applies fields listed in request.fields.
    """
    registry = get_registry()
    if request.file_id not in registry:
        raise HTTPException(404, f"File '{request.file_id}' not found in registry")

    path = registry[request.file_id]
    if not Path(path).exists():
        raise HTTPException(404, f"File no longer exists: {path}")

    # Fetch recording from MB
    try:
        recordings = await musicbrainz_service.search_recordings(
            title="", artist=None, album=None, limit=1
        )
    except Exception:
        pass

    # Fetch release by recording ID
    try:
        # Use the recording ID directly
        data = await musicbrainz_service._mb_get(
            f"https://musicbrainz.org/ws/2/recording/{request.recording_id}",
            {"fmt": "json", "inc": "releases+artist-credits"},
        )
        mb_recording = musicbrainz_service._parse_recording(data)
    except Exception as e:
        raise HTTPException(502, f"Failed to fetch recording: {e}")

    # Build TagData from allowed fields
    field_map = {
        "title": mb_recording.title,
        "artist": mb_recording.artist,
        "album": mb_recording.album,
        "year": mb_recording.year,
        "track_number": mb_recording.track_number,
    }

    tag_kwargs: dict = {}
    for field in request.fields:
        if field in field_map:
            tag_kwargs[field] = field_map[field]

    tag_data = TagData(**tag_kwargs)

    # Determine current ID3 version
    try:
        _, current_version = tag_reader.read_tags(path)
    except Exception:
        current_version = ID3Version.V2_3

    try:
        diff = tag_writer.write_tags(
            path=path,
            tag_data=tag_data,
            version=current_version,
            dry_run=request.dry_run,
            backup=request.backup,
        )
        return TagWriteResult(
            file_id=request.file_id,
            filename=Path(path).name,
            success=True,
            diff=diff,
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to write tags: {e}")
