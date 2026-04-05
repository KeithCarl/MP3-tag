"""Tests for backup_service."""
import pytest
from pathlib import Path

from app.services import backup_service


def test_create_backup_creates_bak_file(tmp_path):
    """create_backup should create a .bak copy of the file."""
    original = tmp_path / "song.mp3"
    original.write_bytes(b"original content")

    bak_path = backup_service.create_backup(str(original))

    assert Path(bak_path).exists()
    assert bak_path.endswith(".bak")
    assert Path(bak_path).read_bytes() == b"original content"


def test_create_backup_returns_backup_path(tmp_path):
    """create_backup should return the path to the backup file."""
    original = tmp_path / "song.mp3"
    original.write_bytes(b"data")

    bak_path = backup_service.create_backup(str(original))
    expected = str(original) + ".bak"
    assert bak_path == expected


def test_get_backup_path(tmp_path):
    """get_backup_path should return expected .bak path."""
    original = tmp_path / "song.mp3"
    expected = str(original) + ".bak"
    assert backup_service.get_backup_path(str(original)) == expected


def test_backup_exists_when_present(tmp_path):
    """backup_exists should return True when backup exists."""
    original = tmp_path / "song.mp3"
    original.write_bytes(b"data")
    backup_service.create_backup(str(original))
    assert backup_service.backup_exists(str(original))


def test_backup_exists_when_absent(tmp_path):
    """backup_exists should return False when no backup."""
    original = tmp_path / "song.mp3"
    original.write_bytes(b"data")
    assert not backup_service.backup_exists(str(original))


def test_restore_backup_overwrites_original(tmp_path):
    """restore_backup should overwrite original with backup content."""
    original = tmp_path / "song.mp3"
    original.write_bytes(b"original")
    backup_service.create_backup(str(original))

    # Modify original
    original.write_bytes(b"modified")

    result = backup_service.restore_backup(str(original))
    assert result is True
    assert original.read_bytes() == b"original"


def test_restore_backup_returns_false_when_no_backup(tmp_path):
    """restore_backup should return False if no backup exists."""
    original = tmp_path / "song.mp3"
    original.write_bytes(b"data")

    result = backup_service.restore_backup(str(original))
    assert result is False


def test_delete_backup_removes_file(tmp_path):
    """delete_backup should delete the .bak file."""
    original = tmp_path / "song.mp3"
    original.write_bytes(b"data")
    backup_service.create_backup(str(original))

    result = backup_service.delete_backup(str(original))
    assert result is True
    assert not backup_service.backup_exists(str(original))


def test_delete_backup_returns_false_when_absent(tmp_path):
    """delete_backup should return False if no backup."""
    original = tmp_path / "song.mp3"
    original.write_bytes(b"data")

    result = backup_service.delete_backup(str(original))
    assert result is False
