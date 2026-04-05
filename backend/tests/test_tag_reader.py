"""Tests for tag_reader service."""
import pytest
from pathlib import Path

from app.services.tag_reader import read_tags, read_audio_info
from app.models.file_info import ID3Version


def test_read_tags_returns_tag_data(sample_mp3):
    """Should read basic tags from a valid MP3 file."""
    tag_data, version = read_tags(str(sample_mp3))

    assert tag_data.title == "Test Title"
    assert tag_data.artist == "Test Artist"
    assert tag_data.album == "Test Album"
    assert tag_data.year == "2024"
    assert tag_data.genre == "Rock"
    assert tag_data.track_number == "1"


def test_read_tags_returns_id3_version(sample_mp3):
    """Should return correct ID3 version."""
    _, version = read_tags(str(sample_mp3))
    assert version in (ID3Version.V2_3, ID3Version.V2_4)


def test_read_tags_no_header(tmp_path):
    """Should return empty TagData and NONE version for file without ID3 header."""
    # Create a file with no valid ID3 header
    bad_file = tmp_path / "no_id3.mp3"
    bad_file.write_bytes(bytes(512))  # all zeros, no ID3 header

    tag_data, version = read_tags(str(bad_file))
    assert version == ID3Version.NONE
    assert tag_data.title is None


def test_read_audio_info_returns_numbers(sample_mp3):
    """Should return numeric duration and bitrate."""
    duration, bitrate = read_audio_info(str(sample_mp3))
    assert isinstance(duration, float)
    assert isinstance(bitrate, int)
    assert duration >= 0
    assert bitrate >= 0
