# DOCRAFT

Umbrella repository for the **DOCRAFT** product ecosystem: AI-native documents with real UI capture, quality gates, and optional post-export protection.

**Brand:** Docraft · **Domain:** [docraft.pro](https://docraft.pro) (DNS cutover before public launch — see child repo docs).

## Three layers

| Layer | Role | Repository |
|-------|------|------------|
| **Create** | Prompt → structured document → PDF (themes, auth, billing, AI illustrations) | [ai-playbook-generator](https://github.com/beaver20007/ai-playbook-generator) |
| **Capture** | Desktop automation → annotated screenshots → Capture Pack ZIP | [desktop-instructor](https://github.com/beaver20007/desktop-instructor) |
| **Protect** | Local flatten: PDF without selectable text layer (“scan-like”) | [magical-pdf](https://github.com/beaver20007/magical-pdf) |

**Assure** (QA gates Q1–Q6) is shared between Create and Capture; specs and manifests align via this repo.

## Production URLs (current)

| Service | URL |
|---------|-----|
| Docraft web (dev/prod) | https://ai-playbook-generator.vercel.app/ |
| Docraft API | https://ai-playbook-generator-production.up.railway.app/ |
| Magical PDF (preview) | https://beaver20007.github.io/magical-pdf/ |
| Target after cutover | https://app.docraft.pro · https://api.docraft.pro |

## Quick start (clone child repos)

```powershell
cd C:\Projects\docraft
.\scripts\clone-all.ps1
```

Override paths:

```powershell
.\scripts\clone-all.ps1 -ParentDir C:\Projects -PlaybookDir "C:\Users\tsvetkov\ai playbook generator"
```

## Documentation map

| Doc | Purpose |
|-----|---------|
| [VISION.md](./VISION.md) | Product map and integration phases |
| [docs/N11_CAPTURE_PACK.md](./docs/N11_CAPTURE_PACK.md) | **Canonical** Capture Pack contract (source of truth) |
| [docs/REPOS.md](./docs/REPOS.md) | Repos, local paths, pinned commits |
| [docs/INTEGRATION_PHASES.md](./docs/INTEGRATION_PHASES.md) | Phases 0–4 checklist |
| [AGENTS.md](./AGENTS.md) | Rules for AI agents working in the ecosystem |

## Next step (implementation)

Implement **N11a** in **ai-playbook-generator**: worker stores captures → insert `image` blocks into IR → render PDF, following [docs/N11_CAPTURE_PACK.md](./docs/N11_CAPTURE_PACK.md).

Desktop side: export ZIP with `scripts/export_capture_pack.py --require-release` after `agent-verify -Strict`.

---

*This repo contains docs, JSON Schema, and scripts only — no application source code.*
