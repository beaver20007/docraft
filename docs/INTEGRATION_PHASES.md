# DOCRAFT — integration phases (0–4)

Checklist for merging Create, Capture, and Protect. Do not run DNS cutover and large features in parallel (child roadmap rule).

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

## Phase 4 — Protect hook (Magical PDF)

| # | Task | DoD |
|---|------|-----|
| 4.1 | Docraft PDF export CTA «Protect with Magical» | Opens Pages or Tauri with `?source=docraft` |
| 4.2 | Implement v0.1 from `magical-pdf/docs/DOCRAFT_API_HOOK.md` | At least deep link documented in UI |
| 4.3 | Optional `protect.docraft.pro` | Only if separate deploy justified |

---

## Ops (parallel, not blocking phase 1)

| Task | Where |
|------|-------|
| Supabase `user_profiles` migration | Create |
| `BILLING_ENFORCE=true` on Railway | Create |
| `app.docraft.pro` DNS | Create — after product confidence |

---

## Current focus

**Phase 1.2–1.4** in ai-playbook-generator per [README](../README.md).
