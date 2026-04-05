from pydantic import BaseModel
from app.models.file_info import MP3FileInfo, TagData, FolderNode


class FileInfoResponse(BaseModel):
    files: list[MP3FileInfo]
    total: int
    capped: bool
    scanned_paths: list[str]


class TagDiffField(BaseModel):
    field: str
    old_value: str | None
    new_value: str | None


class TagDiffResult(BaseModel):
    file_id: str
    filename: str
    diff: list[TagDiffField]
    error: str | None = None


class TagWriteResult(BaseModel):
    file_id: str
    filename: str
    success: bool
    diff: list[TagDiffField]
    error: str | None = None


class RenamePreviewItem(BaseModel):
    file_id: str
    old_name: str
    new_name: str
    conflict: bool = False
    error: str | None = None


class RenamePreviewResponse(BaseModel):
    items: list[RenamePreviewItem]


class RenameApplyResult(BaseModel):
    file_id: str
    old_name: str
    new_name: str
    success: bool
    error: str | None = None


class MBRecording(BaseModel):
    id: str
    title: str
    artist: str | None = None
    album: str | None = None
    year: str | None = None
    track_number: str | None = None
    score: int | None = None


class MBRelease(BaseModel):
    id: str
    title: str
    artist: str | None = None
    year: str | None = None
    tracks: list[dict] = []


class BackupInfo(BaseModel):
    file_id: str
    original_path: str
    backup_path: str
    backup_exists: bool


class FolderTreeResponse(BaseModel):
    nodes: list[FolderNode]
