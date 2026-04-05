import asyncio
import time
import httpx

from app.config import settings
from app.models.responses import MBRecording, MBRelease

_semaphore = asyncio.Semaphore(1)
_last_request_time: float = 0.0


async def _mb_get(url: str, params: dict) -> dict:
    global _last_request_time

    async with _semaphore:
        now = time.monotonic()
        wait = settings.musicbrainz_rate_limit_seconds - (now - _last_request_time)
        if wait > 0:
            await asyncio.sleep(wait)

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                url,
                params=params,
                headers={"User-Agent": settings.musicbrainz_user_agent},
                timeout=10,
            )
            _last_request_time = time.monotonic()

            if resp.status_code == 503:
                await asyncio.sleep(2)
                resp = await client.get(
                    url,
                    params=params,
                    headers={"User-Agent": settings.musicbrainz_user_agent},
                    timeout=10,
                )

            resp.raise_for_status()
            return resp.json()


async def search_recordings(
    title: str,
    artist: str | None = None,
    album: str | None = None,
    limit: int = 10,
) -> list[MBRecording]:
    """Search MusicBrainz for recordings matching title/artist/album."""
    parts = []
    if title:
        parts.append(f'recording:"{title}"')
    if artist:
        parts.append(f'artist:"{artist}"')
    if album:
        parts.append(f'release:"{album}"')

    query = " AND ".join(parts) if parts else title

    data = await _mb_get(
        "https://musicbrainz.org/ws/2/recording",
        {"query": query, "fmt": "json", "limit": limit},
    )

    return [_parse_recording(r) for r in data.get("recordings", [])]


async def get_release(mbid: str) -> MBRelease:
    """Fetch a release by MBID."""
    data = await _mb_get(
        f"https://musicbrainz.org/ws/2/release/{mbid}",
        {"fmt": "json", "inc": "recordings+artist-credits"},
    )
    return _parse_release(data)


def _parse_recording(r: dict) -> MBRecording:
    artist = None
    artist_credits = r.get("artist-credit", [])
    if artist_credits:
        first = artist_credits[0]
        if isinstance(first, dict):
            artist_obj = first.get("artist", {})
            artist = artist_obj.get("name")

    album = None
    year = None
    track_number = None
    releases = r.get("releases", [])
    if releases:
        first_release = releases[0]
        album = first_release.get("title")
        date = first_release.get("date", "")
        year = date[:4] if date else None

        # Try to get track number from media
        media = first_release.get("media", [])
        if media:
            tracks = media[0].get("tracks", [])
            if tracks:
                track_number = str(tracks[0].get("number", ""))

    return MBRecording(
        id=r.get("id", ""),
        title=r.get("title", ""),
        artist=artist,
        album=album,
        year=year,
        track_number=track_number,
        score=r.get("score"),
    )


def _parse_release(data: dict) -> MBRelease:
    artist = None
    artist_credits = data.get("artist-credit", [])
    if artist_credits:
        first = artist_credits[0]
        if isinstance(first, dict):
            artist_obj = first.get("artist", {})
            artist = artist_obj.get("name")

    date = data.get("date", "")
    year = date[:4] if date else None

    tracks = []
    for medium in data.get("media", []):
        for track in medium.get("tracks", []):
            recording = track.get("recording", {})
            tracks.append(
                {
                    "number": track.get("number"),
                    "title": recording.get("title") or track.get("title"),
                    "id": recording.get("id"),
                }
            )

    return MBRelease(
        id=data.get("id", ""),
        title=data.get("title", ""),
        artist=artist,
        year=year,
        tracks=tracks,
    )
