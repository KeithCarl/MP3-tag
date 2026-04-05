import hashlib

# Global registry: {file_id: absolute_path_str}
# Populated by scan, used by all write operations
_file_registry: dict[str, str] = {}


def get_registry() -> dict[str, str]:
    return _file_registry


def make_file_id(path: str) -> str:
    return hashlib.sha256(path.encode()).hexdigest()[:16]


def register_file(path: str) -> str:
    """Register a file path and return its file_id."""
    file_id = make_file_id(path)
    _file_registry[file_id] = path
    return file_id


def clear_registry() -> None:
    """Clear the registry (used in tests)."""
    _file_registry.clear()
