# DOCRAFT — integration phases (0–6)

Checklist for merging Create, Capture, and PDF workstation. Do not run DNS cutover and large features in parallel (child roadmap rule).

**Strategic pivot (2026-06):** Extract (ocr-docs) integrates **now** into magical-pdf UI — no separate sandbox product. See magical-pdf `docs/EXTRACT_INTEGRATION.md`.

---

## Phase 0 — Bootstrap meta-repo

**DoD**

- [x] `github.com/beaver20007/docraft` exists with README, VISION, contracts, `clone-all.ps1`
- [x] Canonical [N11_CAPTURE_PACK.md](./N11_CAPTURE_PACK.md) published
- [x] Child repos linked in [REPOS.md](./REPOS.md)
- [ ] CI `validate-schema.yml` green on `main`

---

## Phase 1 — N11a manual (ZIP upload)

**Goal:** Real screenshots in PDF without desktop helper HTTP.

| # | Task | Owner repo | DoD |
|---|------|------------|-----|
| 1.1 | Desktop export with `--require-release` | desktop-instructor | ZIP validates against schema |
| 1.2 | Docraft: unzip + ZIP→API adapter | ai-playbook-generator | Unit test on fixture ZIP |
| 1.3 | Worker: store capture blobs | ai-playbook-generator | Blobs keyed by `step_id` |
| 1.4 | Worker: merge into IR + render | ai-playbook-generator | PDF shows real images per step |
| 1.5 | UI: file picker + ZIP upload | ai-playbook-generator | `NEXT_PUBLIC_N11_CAPTURE=1` on preview |
| 1.6 | E2E | both | 2-step pack → PDF on Vercel |

**DoD phase:** User completes Excel/AutoCAD run locally, uploads ZIP, downloads Docraft PDF with matching step images.

---

## Phase 2 — N11a API hardening

| # | Task | DoD |
|---|------|-----|
| 2.1 | `N11_CAPTURE_ENABLED=true` on Railway API + worker | No 501 on valid pack |
| 2.2 | Optional `POST /v1/capture-packs` (upload-only job) | Job id + status poll |
| 2.3 | Billing + captures (quota if needed) | Document in TARIFFS |
| 2.4 | Sync child mirror docs from docraft `main` | No spec drift |

---

## Phase 3 — N11b desktop helper

See `desktop-instructor/docs/N11B_BACKLOG.md`.

| # | Task | DoD |
|---|------|-----|
| 3.1 | Tray app repo or `docraft/desktop-helper` | No questionary; subprocess capture + export |
| 3.2 | HTTP upload to Docraft API | Uses same Capture Pack contract |
| 3.3 | Auth token / device pairing | Documented security model |

---

## Phase 4 — Protect hook (Magical PDF) — largely done

| # | Task | DoD |
|---|------|-----|
| 4.1 | Docraft PDF export CTA «Protect with Magical» | Opens Pages or Tauri with `?source=docraft` |
| 4.2 | Implement v0.1 from `magical-pdf/docs/DOCRAFT_API_HOOK.md` | Deep link + `?mode=protect` in UI |
| 4.3 | Optional `protect.docraft.pro` | Only if separate deploy justified |

**Status:** Protect shipped in magical-pdf; 4.1–4.2 remain Docraft UI wiring.

---

## Phase 5 — Extract in magical-pdf ⭐ CURRENT PRIORITY

**Goal:** Scanned PDF → editable DOCX/PPTX **inside magical-pdf** (no terminal, no separate ocr-docs app).

| # | Task | Owner | DoD |
|---|------|-------|-----|
| 5.1 | Port ocr-docs `pipeline/` + `api/` → `magical-pdf/extract/` | magical-pdf | `python -m` / uvicorn runs from subfolder |
| 5.2 | Tab shell: **Защитить** \| **Распознать** + `?mode=` | magical-pdf | Refactor `app.js` → `src/protect.js` + router |
| 5.3 | Extract tab: upload → job poll → download DOCX/PPTX | magical-pdf | Works on web dev against `:8765` |
| 5.4 | Tauri: `ensure_extract_server` spawn sidecar | magical-pdf | Desktop starts API; no manual uvicorn |
| 5.5 | Worker defaults: `layout` DOCX; PPTX if landscape | extract/ | Lukoil + Plan pass manual QA via UI |
| 5.6 | Docraft CTA «Распознать» → `?mode=extract` | Create | Documented in `DOCRAFT_API_HOOK.md` |
| 5.7 | Freeze ocr-docs repo; REPOS → single PDF hub | docraft | Pipeline changes only in magical-pdf |

**DoD phase:** User opens magical-pdf → Распознать → uploads scan → downloads editable Office file locally.

**Source:** `C:\Projects\ocr-docs` (read-only reference until 5.1 lands).

Spec: [magical-pdf/docs/EXTRACT_INTEGRATION.md](https://github.com/beaver20007/magical-pdf/blob/main/docs/EXTRACT_INTEGRATION.md).

---

## Phase 6 — PDF utilities (deferred)

**Goal:** merge/split/compress natively in magical-pdf (Stirling-class). **After** Extract MVP.

| # | Task | DoD |
|---|------|-----|
| 6.1 | merge + compress (pdf-lib / sidecar) | Local, no cloud |
| 6.2 | `?mode=tools` tab | Third tab in shell |
| 6.3 | Stirling as dev reference only | No Java in product |

---

## Ops (parallel, not blocking phase 1)

| Task | Where |
|------|-------|
| Supabase `user_profiles` migration | Create |
| `BILLING_ENFORCE=true` on Railway | Create |
| `app.docraft.pro` DNS | Create — after product confidence |

---

## Current focus

| Track | Focus |
|-------|--------|
| **Create** | Phase 1.2–1.4 (capture pipeline) — continues in parallel |
| **PDF hub** | **Phase 5** Extract in magical-pdf — **priority for PDF work** |

Do not block Capture on Extract; teams/repos are independent until Docraft deep links (5.6).
