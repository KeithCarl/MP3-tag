"""Root conftest.py — ensures backend/ is on sys.path for all tests."""
import sys
import os

# Add backend directory to path so 'app', 'tests', 'main' are importable
sys.path.insert(0, os.path.dirname(__file__))
