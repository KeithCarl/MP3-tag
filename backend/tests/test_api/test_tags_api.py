"""Tests for tags API endpoints."""
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from main import app
from app.config import settings
from app.dependencies import register_file
from app.services.tag_reader import read_tags
from tests.helpers import create_minimal_mp3


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def registered_mp3(tmp_path: Path, monkeypatch):
    """Create an MP3 file and register it, with allowed_root set to tmp_path."""
    monkeypatch.setattr(settings, "allowed_root", str(tmp_path))
    mp3 = tmp_path / "test.mp3"
    create_minimal_mp3(mp3)
    file_id = register_file(str(mp3))
    return file_id, mp3


def test_update_tags_single_file(client, registered_mp3):
    """PUT /{file_id} should write new tags."""
    file_id, mp3 = registered_mp3

    response = client.put(
        f"/api/v1/tags/{file_id}",
        json={
            "tags": {"title": "Updated Title", "artist": "Updated Artist"},
            "version": "id3v2.3",
            "dry_run": False,
            "backup": False,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["file_id"] == file_id

    # Verify on disk
    read_back, _ = read_tags(str(mp3))
    assert read_back.title == "Updated Title"
    assert read_back.artist == "Updated Artist"


def test_update_tags_dry_run(client, registered_mp3):
    """PUT /{file_id} with dry_run=True should not modify file."""
    file_id, mp3 = registered_mp3

    original, _ = read_tags(str(mp3))
    original_title = original.title

    response = client.put(
        f"/api/v1/tags/{file_id}",
        json={
            "tags": {"title": "Dry Run Title"},
            "dry_run": True,
            "backup": False,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    # File should not be changed
    after, _ = read_tags(str(mp3))
    assert after.title == original_title


def test_update_tags_unknown_file(client, registered_mp3):
    """PUT with unknown file_id should return 404."""
    response = client.put(
        "/api/v1/tags/nonexistent_id",
        json={"tags": {"title": "x"}, "dry_run": False, "backup": False},
    )
    assert response.status_code == 404


def test_batch_update_tags(client, tmp_path, monkeypatch):
    """POST /batch should write tags to multiple files."""
    monkeypatch.setattr(settings, "allowed_root", str(tmp_path))

    mp3_a = tmp_path / "a.mp3"
    mp3_b = tmp_path / "b.mp3"
    create_minimal_mp3(mp3_a)
    create_minimal_mp3(mp3_b)

    fid_a = register_file(str(mp3_a))
    fid_b = register_file(str(mp3_b))

    response = client.post(
        "/api/v1/tags/batch",
        json={
            "file_ids": [fid_a, fid_b],
            "tags": {"album": "Batch Album"},
            "version": "id3v2.3",
            "dry_run": False,
            "backup": False,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(item["success"] for item in data)

    # Verify both files were updated
    for mp3 in [mp3_a, mp3_b]:
        tags, _ = read_tags(str(mp3))
        assert tags.album == "Batch Album"


def test_preview_tags(client, tmp_path, monkeypatch):
    """POST /preview should return diffs without modifying files."""
    monkeypatch.setattr(settings, "allowed_root", str(tmp_path))

    mp3 = tmp_path / "preview.mp3"
    create_minimal_mp3(mp3)
    fid = register_file(str(mp3))

    original, _ = read_tags(str(mp3))

    response = client.post(
        "/api/v1/tags/preview",
        json={
            "file_ids": [fid],
            "tags": {"title": "Preview Title"},
            "dry_run": False,  # API forces dry_run=True
            "backup": False,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert len(data[0]["diff"]) > 0

    # File not modified
    after, _ = read_tags(str(mp3))
    assert after.title == original.title
