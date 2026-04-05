"""Tests for tag_writer service."""
import pytest
from pathlib import Path

from app.services.tag_reader import read_tags
from app.services.tag_writer import write_tags, compute_diff
from app.services import backup_service
from app.models.file_info import TagData, ID3Version


def test_write_tags_roundtrip_v2_3(sample_mp3):
    """Round-trip read/write for ID3v2.3."""
    new_tags = TagData(
        title="New Title",
        artist="New Artist",
        album="New Album",
        year="2023",
        genre="Jazz",
        track_number="3",
    )

    write_tags(
        str(sample_mp3),
        new_tags,
        version=ID3Version.V2_3,
        dry_run=False,
        backup=False,
    )

    read_back, version = read_tags(str(sample_mp3))
    assert read_back.title == "New Title"
    assert read_back.artist == "New Artist"
    assert read_back.album == "New Album"
    assert read_back.year == "2023"
    assert read_back.genre == "Jazz"
    assert read_back.track_number == "3"
    assert version == ID3Version.V2_3


def test_write_tags_roundtrip_v2_4(sample_mp3):
    """Round-trip read/write for ID3v2.4."""
    new_tags = TagData(
        title="V24 Title",
        artist="V24 Artist",
    )

    write_tags(
        str(sample_mp3),
        new_tags,
        version=ID3Version.V2_4,
        dry_run=False,
        backup=False,
    )

    read_back, version = read_tags(str(sample_mp3))
    assert read_back.title == "V24 Title"
    assert version == ID3Version.V2_4


def test_dry_run_returns_diff_without_modifying(sample_mp3):
    """dry_run=True should return diff but NOT modify the file."""
    # Read original tags
    original, _ = read_tags(str(sample_mp3))
    original_title = original.title

    new_tags = TagData(title="Should Not Be Written")
    diff = write_tags(
        str(sample_mp3),
        new_tags,
        version=ID3Version.V2_3,
        dry_run=True,
        backup=False,
    )

    # Diff should contain the change
    assert len(diff) > 0
    title_diff = next((d for d in diff if d.field == "title"), None)
    assert title_diff is not None
    assert title_diff.new_value == "Should Not Be Written"

    # File should NOT be modified
    after, _ = read_tags(str(sample_mp3))
    assert after.title == original_title


def test_null_means_skip(sample_mp3):
    """Writing TagData with only title set should leave other tags unchanged."""
    # Ensure the file has a known state
    initial_tags = TagData(
        title="Old Title",
        artist="Keep This Artist",
        album="Keep This Album",
        year="2020",
    )
    write_tags(
        str(sample_mp3),
        initial_tags,
        version=ID3Version.V2_3,
        dry_run=False,
        backup=False,
    )

    # Now write only the title
    partial_tags = TagData(title="New Title Only")
    write_tags(
        str(sample_mp3),
        partial_tags,
        version=ID3Version.V2_3,
        dry_run=False,
        backup=False,
    )

    # Check that other fields were not overwritten
    read_back, _ = read_tags(str(sample_mp3))
    assert read_back.title == "New Title Only"
    assert read_back.artist == "Keep This Artist"
    assert read_back.album == "Keep This Album"
    assert read_back.year == "2020"


def test_backup_creates_bak_file(sample_mp3):
    """Backup=True should create a .bak file before writing."""
    new_tags = TagData(title="Backed Up")
    write_tags(
        str(sample_mp3),
        new_tags,
        version=ID3Version.V2_3,
        dry_run=False,
        backup=True,
    )

    bak_path = Path(str(sample_mp3) + ".bak")
    assert bak_path.exists(), "Backup file should have been created"


def test_write_lyrics(sample_mp3):
    """Should write and read back USLT lyrics."""
    new_tags = TagData(lyrics="These are some test lyrics\nLine 2")
    write_tags(
        str(sample_mp3),
        new_tags,
        version=ID3Version.V2_3,
        dry_run=False,
        backup=False,
    )

    read_back, _ = read_tags(str(sample_mp3))
    assert read_back.lyrics is not None
    assert "test lyrics" in read_back.lyrics


def test_write_comment(sample_mp3):
    """Should write and read back COMM comment."""
    new_tags = TagData(comment="A test comment")
    write_tags(
        str(sample_mp3),
        new_tags,
        version=ID3Version.V2_3,
        dry_run=False,
        backup=False,
    )

    read_back, _ = read_tags(str(sample_mp3))
    assert read_back.comment == "A test comment"


def test_compute_diff_only_changed():
    """compute_diff should only include fields that differ."""
    current = TagData(title="Old", artist="Same", album="Same Album")
    new = TagData(title="New", artist="Same")  # album is None -> skip

    diff = compute_diff(current, new)
    field_names = [d.field for d in diff]

    assert "title" in field_names
    assert "artist" not in field_names  # Same value
    assert "album" not in field_names  # None in new -> skip
