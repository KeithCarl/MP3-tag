from fastapi import APIRouter
from app.api import files, tags, rename, musicbrainz, backup

router = APIRouter()

router.include_router(files.router, prefix="/files", tags=["files"])
router.include_router(tags.router, prefix="/tags", tags=["tags"])
router.include_router(rename.router, prefix="/rename", tags=["rename"])
router.include_router(musicbrainz.router, prefix="/musicbrainz", tags=["musicbrainz"])
router.include_router(backup.router, prefix="/backup", tags=["backup"])
