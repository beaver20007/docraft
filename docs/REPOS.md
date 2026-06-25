# DOCRAFT — repository map

| Layer | Name | GitHub | Branch | Pin (main) | Local path | Integration |
|-------|------|--------|--------|------------|------------|-------------|
| **Meta** | docraft | https://github.com/beaver20007/docraft | main | *(this repo)* | `C:\Projects\docraft` | Canonical N11 contract |
| **Create** | ai-playbook-generator | https://github.com/beaver20007/ai-playbook-generator | main | `9dac8a4` | `C:\Projects\docraft\apps\ai-playbook` | Prod SaaS; CTA "Распознать PDF" → Extract |
| **Capture** | desktop-instructor | https://github.com/beaver20007/desktop-instructor | main | `e6c7e47` | `C:\Projects\docraft\apps\desktop-instructor` | Export ZIP + agent-verify |
| **Protect + PDF hub** | magical-pdf | https://github.com/beaver20007/magical-pdf | main | `66870b4` | `C:\Projects\docraft\apps\magical-pdf` | Protect shipped; Extract UI wired (Phase 5.2-5.3 done) |
| **Extract (archived)** | ocr-docs | *(local, frozen)* | master | `803f859` | `C:\Projects\ocr-docs` | ✅ Ported to magical-pdf/extract — Phase 5.7 frozen 2026-06-12 |

> Монорепо-стратегия (2026-06-25): все репо клонированы в `apps/` как самостоятельные git-репо с оригинальными remote.
> Старые пути переименованы в `_archive_*` и больше не используются.

Update **Pin** column when child repos release contract-relevant changes.

## Agent entry points

| Repo | File |
|------|------|
| Create | `AGENTS.md` (if present), `docs/DOCRAFT_INTEGRATION.md`, `docs/ROADMAP-FINALE.md` |
| Capture | `AGENTS.md`, `docs/DOCRAFT_INTEGRATION.md`, `docs/N11B_BACKLOG.md` |
| Protect + PDF hub | `docs/DOCRAFT_INTEGRATION.md`, `docs/PDF_UTILITIES_ROADMAP.md`, `CODEX_HANDOFF.md` |
| Extract (sandbox) | `AGENTS.md`, `docs/DOCRAFT_INTEGRATION.md`, `docs/ECOSYSTEM_ROADMAP.md`, `docs/API.md` |

## Production

| Service | URL |
|---------|-----|
| Docraft web | https://ai-playbook-generator.vercel.app/ |
| Docraft API | https://ai-playbook-generator-production.up.railway.app/ |
| API health | https://ai-playbook-generator-production.up.railway.app/health |
| Magical preview | https://beaver20007.github.io/magical-pdf/ |
| Target | https://app.docraft.pro · https://api.docraft.pro |

DNS cutover: child `docs/coach/DNS-DOCRAFT-CUTOVER.md` (Create repo).
