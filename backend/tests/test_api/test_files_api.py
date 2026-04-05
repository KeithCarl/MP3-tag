"""Tests for files API endpoints."""
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from main import app
from app.config import settings
from app.dependencies import register_file
from tests.helpers import create_minimal_mp3


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mp3_dir(tmp_path: Path, monkeypatch):
    """Create a temp dir with MP3 files and set as allowed_root."""
    monkeypatch.setattr(settings, "allowed_root", str(tmp_path))

    # Create some MP3 files
    sub = tmp_path / "subfolder"
    sub.mkdir()

    mp3_1 = tmp_path / "song1.mp3"
    mp3_2 = tmp_path / "song2.mp3"
    mp3_3 = sub / "song3.mp3"

    create_minimal_mp3(mp3_1)
    create_minimal_mp3(mp3_2)
    create_minimal_mp3(mp3_3)

    return tmp_path


def test_scan_endpoint_returns_files(client, mp3_dir):
    """POST /scan should return MP3FileInfo list."""
    response = client.post(
        "/api/v1/files/scan",
        json={"paths": [str(mp3_dir)]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert len(data["files"]) >= 2
    assert "scanned_paths" in data
    assert data["capped"] is False


def test_scan_endpoint_with_limit(client, mp3_dir):
    """POST /scan with limit=1 should cap results."""
    response = client.post(
        "/api/v1/files/scan",
        json={"paths": [str(mp3_dir)], "limit": 1},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["capped"] is True


def test_scan_endpoint_registers_files(client, mp3_dir):
    """POST /scan should populate the registry."""
    response = client.post(
        "/api/v1/files/scan",
        json={"paths": [str(mp3_dir)]},
    )
    assert response.status_code == 200
    data = response.json()

    # Use first file_id to check registry
    assert len(data["files"]) > 0
    file_id = data["files"][0]["file_id"]
    assert file_id is not None
    assert len(file_id) == 16  # sha256 hex truncated to 16


def test_get_file_tags_after_scan(client, mp3_dir):
    """GET /{file_id}/tags should return tags for a scanned file."""
    # First scan
    scan_resp = client.post(
        "/api/v1/files/scan",
        json={"paths": [str(mp3_dir)]},
    )
    assert scan_resp.status_code == 200
    file_id = scan_resp.json()["files"][0]["file_id"]

    # Then get tags
    tag_resp = client.get(f"/api/v1/files/{file_id}/tags")
    assert tag_resp.status_code == 200
    data = tag_resp.json()
    assert data["file_id"] == file_id
    assert "tags" in data
    assert data["tags"]["title"] == "Test Title"


def test_get_file_tags_unknown_id(client, mp3_dir):
    """GET /{file_id}/tags should return 404 for unknown file_id."""
    response = client.get("/api/v1/files/unknown_id_xyz/tags")
    assert response.status_code == 404


def test_tree_endpoint(client, mp3_dir):
    """GET /tree should return subdirectories with MP3 counts."""
    response = client.get(
        "/api/v1/files/tree",
        params={"path": str(mp3_dir)},
    )
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    # Should have subfolder
    names = [n["name"] for n in data["nodes"]]
    assert "subfolder" in names

    # subfolder should have 1 MP3
    subfolder_node = next(n for n in data["nodes"] if n["name"] == "subfolder")
    assert subfolder_node["mp3_count"] == 1


def test_tree_endpoint_outside_root_returns_403(client, mp3_dir):
    """GET /tree with path outside allowed_root should return 403."""
    response = client.get(
        "/api/v1/files/tree",
        params={"path": "/etc"},
    )
    assert response.status_code == 403


def test_scan_nonexistent_path(client, mp3_dir):
    """POST /scan with nonexistent path should return 0 files (skipped)."""
    response = client.post(
        "/api/v1/files/scan",
        json={"paths": [str(mp3_dir / "nonexistent")]},
    )
    # Path guard raises 404 which scanner catches
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
