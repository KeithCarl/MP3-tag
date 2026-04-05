"""
Shared test helper utilities (not fixtures).
"""
import struct
from pathlib import Path


def create_minimal_mp3(path: Path) -> Path:
    """
    Create a minimal valid MP3 file with an ID3v2.3 header.
    The file has a basic frame sync so mutagen can parse it.
    """

    def syncsafe(n: int) -> bytes:
        result = bytearray(4)
        for i in range(3, -1, -1):
            result[i] = n & 0x7F
            n >>= 7
        return bytes(result)

    def make_frame(frame_id: str, content: bytes) -> bytes:
        fid = frame_id.encode("ascii")
        size = struct.pack(">I", len(content))
        flags = b"\x00\x00"
        return fid + size + flags + content

    def text_frame(frame_id: str, text: str) -> bytes:
        content = b"\x03" + text.encode("utf-8")
        return make_frame(frame_id, content)

    frames = b""
    frames += text_frame("TIT2", "Test Title")
    frames += text_frame("TPE1", "Test Artist")
    frames += text_frame("TALB", "Test Album")
    frames += text_frame("TDRC", "2024")
    frames += text_frame("TCON", "Rock")
    frames += text_frame("TRCK", "1")

    tag_size = syncsafe(len(frames))
    # ID3v2.3: major=3, minor=0
    header = b"ID3" + bytes([3, 0]) + b"\x00" + tag_size

    # Minimal MP3 frame: sync bytes + audio data
    mp3_frame_header = bytes([0xFF, 0xFB, 0x90, 0x00])
    mp3_frame_data = bytes(417 - 4)

    data = header + frames + mp3_frame_header + mp3_frame_data
    path.write_bytes(data)
    return path
