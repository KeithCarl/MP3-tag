"""
Shared test fixtures.
"""
import pytest
from pathlib import Path

from app.dependencies import clear_registry, register_file
from app.config import settings
from tests.helpers import create_minimal_mp3  # noqa: F401 – re-exported for test files


@pytest.fixture
def sample_mp3(tmp_path: Path) -> Path:
    """Create a real minimal MP3 file in tmp_path."""
    mp3_path = tmp_path / "test.mp3"
    create_minimal_mp3(mp3_path)
    return mp3_path


@pytest.fixture(autouse=True)
def reset_registry():
    """Clear the file registry before each test."""
    clear_registry()
    yield
    clear_registry()


@pytest.fixture
def allowed_root_override(tmp_path: Path, monkeypatch):
    """Override ALLOWED_ROOT to tmp_path for tests."""
    monkeypatch.setattr(settings, "allowed_root", str(tmp_path))
    return tmp_path
