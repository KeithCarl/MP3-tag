from pydantic import BaseModel
from enum import Enum


class ID3Version(str, Enum):
    V1_1 = "id3v1.1"
    V2_3 = "id3v2.3"
    V2_4 = "id3v2.4"
    NONE = "none"


class TagData(BaseModel):
    title: str | None = None
    artist: str | None = None
    album: str | None = None
    year: str | None = None
    genre: str | None = None
    track_number: str | None = None
    comment: str | None = None
    lyrics: str | None = None


class MP3FileInfo(BaseModel):
    file_id: str
    filename: str
    path: str = ""
    size_bytes: int
    duration_seconds: float
    bitrate_kbps: int
    id3_version: ID3Version
    tags: TagData


class FolderNode(BaseModel):
    name: str
    path: str  # relative to ALLOWED_ROOT for display
    mp3_count: int
    has_subdirs: bool
