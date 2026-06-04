# AGENTS.md — DOCRAFT meta-repo

Rules for AI agents (Cursor, Codex, Claude Code) working on the **ecosystem**, not only this folder.

## Scope

This repository is **documentation + contracts + scripts**. Application code lives in child repos ([REPOS.md](./docs/REPOS.md)).

## Workflow order (N11)

1. **Capture** — desktop-instructor: `main.py` → `agent-verify -Strict` → `export_capture_pack.py --require-release`.
2. **Contract** — validate ZIP against `contracts/capture-pack-v1.schema.json` (or examples).
3. **Create** — ai-playbook-generator: implement ZIP→API adapter, worker blobs, IR `image` blocks, render.
4. **Protect** — magical-pdf only when user needs scan-like PDF; manual or hook v0.1.

Do not enable `N11_CAPTURE_ENABLED` or `NEXT_PUBLIC_N11_CAPTURE` until worker pipeline is complete.

## Secrets

- Never commit `.env`, API keys, `.env.e2e`, or `output/` artifacts with PII.
- Never print passwords in logs or chat.

## Contract changes

1. Edit **docraft** `docs/N11_CAPTURE_PACK.md` and JSON Schema under `contracts/`.
2. Open PRs in child repos to update mirror docs and code (Pydantic, `export_capture_pack.py`).
3. Bump pin commit in `docs/REPOS.md`.

## Child AGENTS / guides

| Repo | Start here |
|------|------------|
| desktop-instructor | `AGENTS.md`, `docs/PROD_RUN.md` |
| ai-playbook-generator | `docs/DOCRAFT_INTEGRATION.md`, `docs/ROADMAP-FINALE.md` |
| magical-pdf | `docs/DOCRAFT_INTEGRATION.md`, `START_HERE.md` |

## Git

- Commits only when the user asks.
- Format: `docs: …`, `chore: …`, `feat(contracts): …`

## Testing

```powershell
# Validate JSON examples against schema (requires Python 3.11+)
python scripts/validate_schemas.py
```

## DNS

Do not change `docraft.pro` DNS from this repo without explicit user request (cutover is Phase 5b in Create repo).
