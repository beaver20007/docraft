# DOCRAFT — product vision

**Docraft** is a mega-product for **how-to and operational documentation**: from a natural-language request (or a captured UI walkthrough) to a polished PDF, with optional “protected” distribution.

## Problem

Teams need tutorials (CAD, Office, AI tools) that combine **accurate UI screenshots** with **narrative structure**. Cloud-only AI PDF tools invent illustrations; desktop capture tools rarely connect to a hosted editor and billing.

## Solution (layers)

```text
User query ──► Create (Docraft SaaS) ──► PDF/DOCX with text layer
                    ▲
                    │ Capture Pack ZIP (N11)
Desktop Instructor ─┘

Optional: Magical PDF (Protect) ──► scan-like PDF, offline, no text selection
```

## Child products

1. **Create** — [ai-playbook-generator](https://github.com/beaver20007/ai-playbook-generator): Next.js + FastAPI + worker; Supabase auth; ReportLab render; GPT Image 2 for optional AI illustrations.
2. **Capture** — [desktop-instructor](https://github.com/beaver20007/desktop-instructor): Windows Python; COM/pyautogui screenshots; QA gates; `export_capture_pack.py`.
3. **Protect** — [magical-pdf](https://github.com/beaver20007/magical-pdf): browser/Tauri/iOS; PDF→JPEG→PDF locally.

## Integration phases

| Phase | Name | Outcome |
|-------|------|---------|
| **0** | Bootstrap | Meta-repo, canonical N11 contract, clone scripts ✅ |
| **1** | N11a manual | Desktop ZIP → upload → Docraft PDF with real images |
| **2** | N11a API | `POST /generate/with-captures` + worker pipeline live on Railway |
| **3** | N11b helper | Tray app: Capture → export → HTTP upload (no questionary) |
| **4** | Protect hook | Docraft export → Magical deep link / CLI (v0.1 spec) |

Details and DoD: [docs/INTEGRATION_PHASES.md](./docs/INTEGRATION_PHASES.md).

## Principles

- **Source of truth** for Capture Pack: this repo (`docs/N11_CAPTURE_PACK.md` + `contracts/`).
- Child repos hold **mirrors**; on drift, update child docs to match docraft `main`.
- **No monolith** — do not vendor child sources into docraft.
- **Secrets** never in git; `.env` only locally and in platform dashboards.

## Audience

Engineers, technical writers, CAD/Office power users, agencies shipping SOPs and playbooks.

## Horizon (not phase 0–4)

- Multi-app Capture tiers (IDE, LLM web) per desktop-instructor roadmap.
- `app.docraft.pro` DNS, Product Hunt, enterprise workspace (child PRD).
