from pydantic import BaseModel, Field
from app.models.file_info import TagData, ID3Version


class ScanRequest(BaseModel):
    paths: list[str]
    limit: int | None = None


class TagWriteRequest(BaseModel):
    tags: TagData
    version: ID3Version = ID3Version.V2_3
    dry_run: bool = False
    backup: bool = True


class BatchTagWriteRequest(BaseModel):
    file_ids: list[str]
    tags: TagData
    version: ID3Version = ID3Version.V2_3
    dry_run: bool = False
    backup: bool = True


class RenamePreviewRequest(BaseModel):
    file_ids: list[str]
    template: str | None = None
    regex_match: str | None = None
    regex_replace: str | None = None
    backup: bool = True
    dry_run: bool = True


class RenameApplyRequest(BaseModel):
    file_ids: list[str]
    template: str | None = None
    regex_match: str | None = None
    regex_replace: str | None = None
    backup: bool = True


class MBApplyRequest(BaseModel):
    file_id: str
    recording_id: str
    fields: list[str] = Field(
        default=["title", "artist", "album", "year", "track_number"]
    )
    dry_run: bool = False
    backup: bool = True
