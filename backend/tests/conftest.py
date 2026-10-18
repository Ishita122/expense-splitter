import sys
from pathlib import Path

# Make 'backend/' importable so 'from app.main import app' works
ROOT = Path(__file__).resolve().parents[1]   # ...\backend
sys.path.insert(0, str(ROOT))
