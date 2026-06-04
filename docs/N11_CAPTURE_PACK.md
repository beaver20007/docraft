# N11 — Capture Pack (canonical contract)

**Source of truth:** this file in [github.com/beaver20007/docraft](https://github.com/beaver20007/docraft).

Mirrors (update when this doc changes):

| Repo | Path |
|------|------|
| desktop-instructor | `docs/N11_CAPTURE_PACK.md` (ZIP export detail) |
| ai-playbook-generator | `docs/N11_CAPTURE_PACK.md` (API / IR detail) |

**Status:** spec ready · N11a API stub (501) · worker pipeline pending in Create.

---

## Overview

**N11** adds **real UI screenshots** to Docraft PDFs (not AI-generated illustrations).

| Variant | Flow |
|---------|------|
| **N11a** | User uploads Capture Pack (ZIP or multipart) → Docraft inserts images into IR → PDF |
| **N11b** | Desktop helper: tray → Capture → export → HTTP upload (backlog in desktop-instructor) |
| **N11c** | Automated web capture (Playwright) — future, niche |

Two manifest shapes describe the same steps:

1. **ZIP manifest** — produced by Desktop Instructor (`schema_version: capture-pack-v1`).
2. **API manifest** — consumed by Docraft API (`version: "1.0"`). An adapter maps ZIP → API on upload.

---

## Part A — ZIP transport (Desktop Instructor)

### Archive name

`{timestamp}_{slug}.capture-pack.zip` — from `scripts/export_capture_pack.py`.

### Layout

```text
capture-pack.zip
├── manifest.json
├── images/
│   ├── step_01.png
│   └── step_02.png
└── docs/                    # optional
    ├── instruction.pdf
    └── instruction.docx
```

### ZIP `manifest.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schema_version` | string | yes | `"capture-pack-v1"` |
| `capture_pack_version` | string | yes | `"1"` |
| `title` | string | yes | Instruction title |
| `summary` | string | no | Short description |
| `language` | string | yes | `ru` \| `en` |
| `app_id` | string | yes | `autocad`, `excel`, … |
| `query` | string | no | Original user query |
| `source_tool` | string | yes | `"desktop-instructor"` |
| `created_at` | string | yes | ISO-8601 UTC |
| `steps` | array | yes | See below |
| `output_files` | array | no | Paths inside ZIP, e.g. `docs/instruction.pdf` |
| `qa_summary` | object | no | QA gate summary from run |
| `meta` | object | no | Grounding, workspace, etc. |

#### `steps[]` (ZIP)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `number` | int | yes | 1-based step index |
| `description` | string | yes | Step text |
| `tip` | string \| null | no | Hint |
| `image_file` | string | yes | e.g. `images/step_01.png` |
| `annotation_target` | string | no | Highlight target |
| `ui_target_id` | string \| null | no | Scenario pack id |
| `expected_screen_type` | string \| null | no | Expected screen |

### Desktop export cycle

```powershell
python main.py
.\scripts\agent-verify.ps1 -Strict
python scripts/export_capture_pack.py --run-dir output --require-release
```

`--require-release` fails if `manifest_last.json` lacks `RELEASE_OK` or has FAIL on Q3b/Q6.

JSON Schema: [contracts/capture-pack-v1.schema.json](../contracts/capture-pack-v1.schema.json).

---

## Part B — API manifest (Docraft Create)

Used in `POST /generate/with-captures` (multipart: `manifest` JSON + image files).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | yes | `"1.0"` |
| `source` | string | no | `desktop-instructor` \| `web-upload` \| `api` |
| `title` | string | no | Title |
| `locale` | string | no | `ru` \| `en` |
| `steps` | array | yes | 1…20 `StepCaptureInput` |

#### `StepCaptureInput`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `step_id` | string | yes | Stable id (`step-1`, uuid) |
| `order` | int | yes | 1-based order |
| `title` | string | no | Step heading in PDF |
| `caption` | string | no | Caption under image (≤ 500 chars) |
| `image_ref` | string | yes | Filename in multipart (no path segments) |
| `section_hint` | string | no | IR section id (filled by API) |
| `window_title` | string | no | Capture metadata |
| `captured_at` | string | no | ISO-8601 UTC |

### Images (API)

| Rule | Value |
|------|-------|
| MIME | `image/png`, `image/jpeg`, `image/webp` |
| Max file size | **5 MiB** |
| Max files / steps | **20** |
| Names | Must match `image_ref` (basename only) |

JSON Schema: [contracts/capture-pack-api-v1.schema.json](../contracts/capture-pack-api-v1.schema.json).

Example: [contracts/examples/capture-pack-minimal/manifest.api.json](../contracts/examples/capture-pack-minimal/manifest.api.json).

---

## Adapter: ZIP → API (Docraft upload handler)

When accepting a `.capture-pack.zip`:

1. Read `manifest.json`; require `schema_version == "capture-pack-v1"`.
2. For each ZIP step `n`: map to API step  
   - `step_id` = `step-{number}`  
   - `order` = `number`  
   - `title` = first line of `description` (or `Step {n}`)  
   - `caption` = `description` (+ `tip` if present)  
   - `image_ref` = basename of `image_file` (e.g. `step_01.png`)  
3. Set `version: "1.0"`, `source: "desktop-instructor"`, `locale` from `language`, `title` from ZIP `title`.
4. Validate with API schema; store bytes keyed by `step_id`.

---

## IR binding (after N11a implementation)

1. Claude generates draft IR (sections/modules).
2. For each capture step by `order`, attach or create an `image` block:

```json
{
  "type": "image",
  "src": "capture://{step_id}",
  "alt": "{caption or title}",
  "caption": "{caption}"
}
```

3. Renderer resolves `capture://` from blob storage (Redis/S3) — not public URLs in LLM context.

---

## API endpoints (Create)

| Method | Path | Current |
|--------|------|---------|
| `POST` | `/generate/with-captures` | Validates manifest + files → **501** until worker wired |
| `POST` | `/generate/` | Standard generation (no captures) |

Planned: `POST /v1/capture-packs` (upload only) — see [INTEGRATION_PHASES.md](./INTEGRATION_PHASES.md).

### Errors

| Code | Reason |
|------|--------|
| 400 | Invalid JSON, version, duplicate ids, extra files |
| 413 | File > 5 MiB |
| 415 | Unsupported MIME |
| 501 | Contract OK, pipeline disabled (`N11_CAPTURE_ENABLED=false`) |

---

## E2E (when impl ready)

1. Desktop: `export_capture_pack.py --require-release` → ZIP.
2. Docraft: upload ZIP or multipart → PDF with real images at each step.
3. Flags: `N11_CAPTURE_ENABLED=true` (Railway), `NEXT_PUBLIC_N11_CAPTURE=1` (Vercel).

Do not enable flags before worker implements capture → IR → render.
