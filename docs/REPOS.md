# DOCRAFT — repository map

| Layer | Name | GitHub | Branch | Pin (main) | Local path (default) | Integration |
|-------|------|--------|--------|------------|----------------------|-------------|
| **Meta** | docraft | https://github.com/beaver20007/docraft | main | *(this repo)* | `C:\Projects\docraft` | Canonical N11 contract |
| **Create** | ai-playbook-generator | https://github.com/beaver20007/ai-playbook-generator | main | `cded0af` | `C:\Users\tsvetkov\ai playbook generator` | Prod SaaS; N11a stub 501 |
| **Capture** | desktop-instructor | https://github.com/beaver20007/desktop-instructor | master | `e6c7e47` | `C:\Projects\autocad-instructor` | Export ZIP + agent-verify |
| **Protect + PDF hub** | magical-pdf | https://github.com/beaver20007/magical-pdf | main | `eed2874` | `C:\Users\tsvetkov\Documents\magical-pdf` | Protect shipped; Utilities + Extract UI planned ([PDF_UTILITIES_ROADMAP](https://github.com/beaver20007/magical-pdf/blob/main/docs/PDF_UTILITIES_ROADMAP.md)) |
| **Extract (porting)** | ocr-docs → magical-pdf | *(local)* | — | — | `C:\Projects\ocr-docs` → `magical-pdf/extract/` | **Phase 5:** port pipeline + UI now; freeze ocr-docs after 5.7 |

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
