#!/usr/bin/env python3
"""Validate contract example JSON against DOCRAFT JSON Schema (stdlib only)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "contracts" / "examples" / "capture-pack-minimal"
SCHEMAS = [
    (ROOT / "contracts" / "capture-pack-v1.schema.json", EXAMPLES / "manifest.zip.json"),
    (ROOT / "contracts" / "capture-pack-api-v1.schema.json", EXAMPLES / "manifest.api.json"),
]


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _check_required(data: dict, schema: dict, path: str = "") -> list[str]:
    errors: list[str] = []
    required = schema.get("required", [])
    for key in required:
        if key not in data:
            errors.append(f"{path}: missing required '{key}'")

    props = schema.get("properties", {})
    for key, subschema in props.items():
        if key not in data:
            continue
        val = data[key]
        if "const" in subschema and val != subschema["const"]:
            errors.append(f"{path}.{key}: expected const {subschema['const']!r}, got {val!r}")
        if "enum" in subschema and val not in subschema["enum"]:
            errors.append(f"{path}.{key}: expected one of {subschema['enum']}, got {val!r}")
        if subschema.get("type") == "array" and "items" in subschema:
            item_schema = subschema["items"]
            if "$ref" in item_schema:
                ref = item_schema["$ref"].split("/")[-1]
                item_schema = schema.get("$defs", {}).get(ref, item_schema)
            for i, item in enumerate(val):
                if isinstance(item, dict):
                    errors.extend(_check_required(item, item_schema, f"{path}.{key}[{i}]"))

    return errors


def main() -> int:
    ok = True
    for schema_path, example_path in SCHEMAS:
        if not example_path.exists():
            print(f"[FAIL] missing example: {example_path}")
            ok = False
            continue
        schema = _load(schema_path)
        data = _load(example_path)
        errs = _check_required(data, schema)
        if errs:
            ok = False
            print(f"[FAIL] {example_path.name} vs {schema_path.name}")
            for e in errs:
                print(f"  {e}")
        else:
            print(f"[OK] {example_path.name} <- {schema_path.name}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
