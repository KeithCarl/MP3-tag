"""Tests for rename_service."""
import os
import shutil
import pytest
from pathlib import Path

from app.services import rename_service
from app.models.file_info import TagData


def make_file_tuple(
    file_id: str,
    path: str,
    artist: str = "Artist",
    title: str = "Title",
    album: str = "Album",
    year: str = "2024",
    track: str = "01",
    genre: str = "Rock",
) -> tuple[str, str, TagData]:
    tags = TagData(
        artist=artist,
        title=title,
        album=album,
        year=year,
        track_number=track,
        genre=genre,
    )
    return (file_id, path, tags)


def test_template_rename_artist_title(tmp_path):
    """Template {artist} - {title} should produce correct new name."""
    mp3 = tmp_path / "song.mp3"
    mp3.touch()

    file_tuples = [make_file_tuple("id1", str(mp3), artist="The Beatles", title="Hey Jude")]
    items = rename_service.preview_renames(
        file_tuples,
        template="{artist} - {title}",
        regex_match=None,
        regex_replace=None,
    )

    assert len(items) == 1
    assert items[0].new_name == "The Beatles - Hey Jude.mp3"
    assert not items[0].conflict


def test_template_rename_with_all_tokens(tmp_path):
    """All template tokens should be substituted correctly."""
    mp3 = tmp_path / "song.mp3"
    mp3.touch()

    file_tuples = [
        make_file_tuple(
            "id1", str(mp3),
            artist="Artist", title="Title", album="Album",
            year="2024", track="05", genre="Rock"
        )
    ]
    items = rename_service.preview_renames(
        file_tuples,
        template="{track} {artist} - {title} ({year}) [{album}] {genre}",
        regex_match=None,
        regex_replace=None,
    )
    assert items[0].new_name == "05 Artist - Title (2024) [Album] Rock.mp3"


def test_template_missing_token_becomes_empty(tmp_path):
    """Missing tag fields should produce empty string in template."""
    mp3 = tmp_path / "song.mp3"
    mp3.touch()

    tags = TagData(title="Song", artist=None)
    file_tuples = [("id1", str(mp3), tags)]

    items = rename_service.preview_renames(
        file_tuples,
        template="{artist} - {title}",
        regex_match=None,
        regex_replace=None,
    )
    assert items[0].new_name == "- Song.mp3"


def test_illegal_character_sanitization(tmp_path):
    """Illegal filename characters should be replaced with underscores."""
    mp3 = tmp_path / "song.mp3"
    mp3.touch()

    file_tuples = [make_file_tuple("id1", str(mp3), artist="AC/DC", title='Rock: "Hard"')]
    items = rename_service.preview_renames(
        file_tuples,
        template="{artist} - {title}",
        regex_match=None,
        regex_replace=None,
    )

    new_name = items[0].new_name
    # None of these chars should appear in the filename
    for char in r'/\:*?"<>|':
        assert char not in new_name, f"Illegal char '{char}' found in: {new_name}"


def test_regex_rename(tmp_path):
    """Regex mode should apply substitution to the file stem."""
    mp3 = tmp_path / "01 - My Song.mp3"
    mp3.touch()

    tags = TagData()
    file_tuples = [("id1", str(mp3), tags)]

    items = rename_service.preview_renames(
        file_tuples,
        template=None,
        regex_match=r"^(\d+) - (.+)$",
        regex_replace=r"\2 (\1)",
    )
    assert items[0].new_name == "My Song (01).mp3"


def test_conflict_detection(tmp_path):
    """Two files resolving to the same name should both be flagged as conflict."""
    mp3_a = tmp_path / "song_a.mp3"
    mp3_b = tmp_path / "song_b.mp3"
    mp3_a.touch()
    mp3_b.touch()

    # Both have same artist and title -> same template result
    file_tuples = [
        make_file_tuple("id1", str(mp3_a), artist="Same", title="Song"),
        make_file_tuple("id2", str(mp3_b), artist="Same", title="Song"),
    ]

    items = rename_service.preview_renames(
        file_tuples,
        template="{artist} - {title}",
        regex_match=None,
        regex_replace=None,
    )

    assert items[0].conflict
    assert items[1].conflict


def test_no_conflict_when_different_names(tmp_path):
    """Files with different new names should not conflict."""
    mp3_a = tmp_path / "a.mp3"
    mp3_b = tmp_path / "b.mp3"
    mp3_a.touch()
    mp3_b.touch()

    file_tuples = [
        make_file_tuple("id1", str(mp3_a), artist="Artist", title="Song A"),
        make_file_tuple("id2", str(mp3_b), artist="Artist", title="Song B"),
    ]

    items = rename_service.preview_renames(
        file_tuples,
        template="{artist} - {title}",
        regex_match=None,
        regex_replace=None,
    )

    assert not items[0].conflict
    assert not items[1].conflict


def test_apply_rename_actually_renames(tmp_path):
    """apply_renames should rename the file on disk."""
    mp3 = tmp_path / "old_name.mp3"
    mp3.write_bytes(b"\xff\xfb" + bytes(200))  # minimal content

    file_tuples = [make_file_tuple("id1", str(mp3), artist="The Artist", title="The Song")]
    results = rename_service.apply_renames(
        file_tuples,
        template="{artist} - {title}",
        regex_match=None,
        regex_replace=None,
        backup=False,
    )

    assert results[0].success
    new_path = tmp_path / "The Artist - The Song.mp3"
    assert new_path.exists()
    assert not mp3.exists()


def test_apply_rename_with_backup(tmp_path):
    """apply_renames with backup=True should create .bak before renaming."""
    mp3 = tmp_path / "original.mp3"
    mp3.write_bytes(b"\xff\xfb" + bytes(200))

    file_tuples = [make_file_tuple("id1", str(mp3), artist="Bkp", title="Test")]
    results = rename_service.apply_renames(
        file_tuples,
        template="{artist} - {title}",
        regex_match=None,
        regex_replace=None,
        backup=True,
    )

    bak = tmp_path / "original.mp3.bak"
    assert bak.exists(), "Backup file should exist"


def test_apply_rename_skips_conflicts(tmp_path):
    """apply_renames should not rename conflicting files."""
    mp3_a = tmp_path / "a.mp3"
    mp3_b = tmp_path / "b.mp3"
    mp3_a.write_bytes(b"\xff\xfb" + bytes(200))
    mp3_b.write_bytes(b"\xff\xfb" + bytes(200))

    file_tuples = [
        make_file_tuple("id1", str(mp3_a), artist="Same", title="Song"),
        make_file_tuple("id2", str(mp3_b), artist="Same", title="Song"),
    ]

    results = rename_service.apply_renames(
        file_tuples,
        template="{artist} - {title}",
        regex_match=None,
        regex_replace=None,
        backup=False,
    )

    # Both should fail due to conflict
    assert not results[0].success
    assert not results[1].success
    # Original files should still exist
    assert mp3_a.exists()
    assert mp3_b.exists()
