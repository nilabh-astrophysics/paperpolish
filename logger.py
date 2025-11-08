import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path

# --- Setup directories ---
LOG_DIR = Path(__file__).resolve().parents[1] / "data" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "app.log"

def get_logger(name: str = "paperpolish"):
    """Return a configured rotating logger."""
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)

    # --- File handler with rotation ---
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=2_000_000,      # 2 MB max before rotation
        backupCount=3,           # keep 3 old logs
        encoding="utf-8"
    )
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s"
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # --- Console handler (for development) ---
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger
