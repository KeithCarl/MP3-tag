from mutagen.mp3 import MP3
from mutagen.id3 import ID3, ID3NoHeaderError

from app.models.file_info import TagData, ID3Version


def read_tags(path: str) -> tuple[TagData, ID3Version]:
    """Read ID3 tags from an MP3 file. Returns (TagData, ID3Version)."""
    try:
        tags = ID3(path)
        version_tuple = tags.version  # e.g. (2, 3, 0) or (2, 4, 0)
        if version_tuple[1] == 3:
            id3_ver = ID3Version.V2_3
        elif version_tuple[1] == 4:
            id3_ver = ID3Version.V2_4
        else:
            id3_ver = ID3Version.V2_3  # fallback

        # Read USLT lyrics
        lyrics = None
        uslt_frames = tags.getall("USLT")
        if uslt_frames:
            lyrics = uslt_frames[0].text

        return TagData(
            title=_str_or_none(tags.get("TIT2")),
            artist=_str_or_none(tags.get("TPE1")),
            album=_str_or_none(tags.get("TALB")),
            year=_str_or_none(tags.get("TDRC")),
            genre=_str_or_none(tags.get("TCON")),
            track_number=_str_or_none(tags.get("TRCK")),
            comment=_get_comment(tags),
            lyrics=lyrics,
        ), id3_ver

    except ID3NoHeaderError:
        # Try ID3v1 via mutagen MP3
        try:
            audio = MP3(path)
            # Check if ID3v1 tags exist via mutagen's tag attribute
            if audio.tags is not None:
                # ID3v1 tags may be accessible
                return TagData(), ID3Version.V1_1
        except Exception:
            pass
        return TagData(), ID3Version.NONE


def read_audio_info(path: str) -> tuple[float, int]:
    """Return (duration_seconds, bitrate_kbps). Returns (0.0, 0) for files with no audio frame."""
    try:
        audio = MP3(path)
        duration = audio.info.length if audio.info else 0.0
        bitrate = (audio.info.bitrate // 1000) if audio.info else 0
        return duration, bitrate
    except Exception:
        return 0.0, 0


def _str_or_none(frame) -> str | None:
    if frame is None:
        return None
    val = str(frame)
    return val if val else None


def _get_comment(tags) -> str | None:
    comm_frames = tags.getall("COMM")
    if comm_frames:
        frame = comm_frames[0]
        if frame.text:
            return frame.text[0] if frame.text else None
    return None
