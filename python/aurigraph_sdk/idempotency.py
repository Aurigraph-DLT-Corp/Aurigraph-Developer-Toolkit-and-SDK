"""Deterministic SHA-256 idempotency key generation.

The input payload is canonicalized (object keys sorted alphabetically at all
nesting levels, arrays preserved in order) then hashed with SHA-256.  Two
callers passing the same logical payload — even with different key ordering —
produce the same key.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any


def _canonicalize(obj: Any) -> str:
    """Recursively canonicalize a Python object into a deterministic JSON string."""
    if obj is None:
        return "null"
    if isinstance(obj, bool):
        return "true" if obj else "false"
    if isinstance(obj, (int, float)):
        return json.dumps(obj)
    if isinstance(obj, str):
        return json.dumps(obj, ensure_ascii=False)
    if isinstance(obj, (list, tuple)):
        inner = ",".join(_canonicalize(item) for item in obj)
        return f"[{inner}]"
    if isinstance(obj, dict):
        sorted_keys = sorted(obj.keys())
        pairs = ",".join(
            f"{json.dumps(k, ensure_ascii=False)}:{_canonicalize(obj[k])}"
            for k in sorted_keys
            if obj[k] is not None
        )
        return f"{{{pairs}}}"
    # Fallback: serialize as string
    return json.dumps(str(obj), ensure_ascii=False)


def generate_idempotency_key(operation: str, payload: dict[str, Any]) -> str:
    """Generate a deterministic SHA-256 idempotency key.

    Args:
        operation: The operation name (e.g. "POST /transactions").
        payload: The request payload dict.

    Returns:
        A 64-character lowercase hex string.
    """
    combined: dict[str, Any] = {"operation": operation, "payload": payload}
    canonical = _canonicalize(combined)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
