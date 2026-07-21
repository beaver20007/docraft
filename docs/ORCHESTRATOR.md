# ORCHESTRATOR — состояние проекта docraft

**Владелец файла:** сессия-Оркестратор (единственная, кто пишет в `main`).
**Последнее обновление:** 2026-07-21 — ввод Оркестратора в строй, приём хендоффа.
**Новая сессия начинает с чтения этого файла.**

---

## 0. Проверенные факты на 2026-07-21 (вывод команд, не отчёты)

| Что | Значение | Как проверено |
|---|---|---|
| Суперрепо `docraft` HEAD | `fa74523` (Merge PR #4) | `git log --oneline` |
| PR `docraft#4` (хендофф) | **УЖЕ ВЛИТ** владельцем | `gh pr list --state open` → пусто |
| Рабочее дерево суперрепо | чисто | `git status --short` |
| `apps/ai-playbook` | `34b58a2` / `heads/main` | `git submodule status` |
| `apps/magical-pdf` | `5f32a2d` / `heads/main` | `git submodule status` |
| `apps/desktop-instructor` | `e6c7e47` / `heads/master` | `git submodule status` |
| Открытые PR: docraft | нет | `gh pr list` |
| Открытые PR: magical-pdf | нет | `gh pr list` |
| Открытые PR: ai-playbook | **#1 DRAFT** «docs: Cursor Cloud dev environment setup guide», ветка `cursor/dev-environment-setup-475d`, от 2026-05-31 | `gh pr list` |

Указатели submodule совпадают с хендоффом → состояние консистентно. Раздел 3 START_PROMPT
подтверждён полностью, кроме одного: `docs/ORCHESTRATOR.md` до сегодня **не существовал** —
создан этой сессией.

---

## 1. Очередь мержей

| # | Репо | PR | Статус | Действие |
|---|---|---|---|---|
| 1 | ai-playbook | [#1](https://github.com/beaver20007/ai-playbook-generator/pull/1) DRAFT, `cursor/dev-environment-setup-475d` | висит 7 недель, чужой (Cursor Cloud) | **АУДИТ БАЗЫ** по правилу 2 перед любым решением; кандидат на закрытие |

Больше открытых PR нет.

## 2. Деплой-очередь

Пусто. Деплой исполняет владелец вручную (Railway + Vercel).
**Правило 14:** Railway тарифицирует рантайм контейнера — упавшие билды платные. Деплои — пачками, не вхолостую.

## 3. Треки (задачи воркерам)

| Трек | Submodule | Статус | Зависимость |
|---|---|---|---|
| `pdf-001` — регистрация шрифтов тем `academic-serif` / `premium` + кириллица | **ai-playbook** (`packages/render-engine`) | **QUEUED → запуск 2026-07-21** | нет |
| `quality-001` — механический валидатор IR (консистентность цифр) | **ai-playbook** (`apps/api`) | **QUEUED → запуск 2026-07-21** | нет |
| `pdf-002` — серый цвет подписи к картинке (`color.text_secondary` → `color.text.secondary`) | **ai-playbook** (`packages/render-engine`) | QUEUED | после `pdf-001` |
| `tokens-001` — подключить осиротевшие токены к UI (единый источник) | ai-playbook (web) + magical-pdf | QUEUED | после pdf-фиксов |
| `engine-001` — Celery-монолит → явные стадии + слой шаблонов | ai-playbook | QUEUED (каркас можно, глубина шаблонов **gated**) | ответ владельца по цели/числу типов |

> ⚠️ **Поправка к START_PROMPT:** `pdf-001` и `pdf-002` числились за `magical-pdf`. Проверено —
> обе точки живут в **ai-playbook**: `packages/render-engine/render_engine/fonts.py` и
> `packages/render-engine/render_engine/components/image_block.py:79`. Задачи заведены в ai-playbook.

## 4. Ждёт человека (владельца)

| # | Пункт | Почему только владелец |
|---|---|---|
| H1 | **Stripe в проде** — создать продукт «Docraft Pro» → `STRIPE_PRO_PRICE_ID`; webhook `POST /billing/webhook` → `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard |
| H2 | **Supabase-миграция** — `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;` | доступ к прод-БД |
| H3 | **FAL_KEY** — получить на fal.ai; выставить на Railway (api + worker). Без него AI-иллюстрации в проде не работают | ключ даёт владелец, выставить может агент |
| H4 | **Volume `/data` для extract-сервиса** — не создан (Railway CLI падал с panic). Без него ML-модели перекачиваются при каждом редеплое | Railway UI |
| H5 | **Мусорная ветка на origin** — `refs/heads/<name-of-remote-branch>` (буквально, плейсхолдер попал в `git push`). **Ломает `git fetch` на Windows** (invalid ref name). Проверено: `715e3200` — предок `main`, уникального содержимого **ноль**, удаление безопасно. Нужна отмашка на `git push origin --delete` | удаление ветки на origin |
| H6 | **Цели проекта** — допущения приняты (launch-ready; 1 реальный тип + дешёвый слой шаблонов; ЦА B2B/малый бизнес; docraft-v2-package каннибализировать). Подтвердить/поправить — от этого зависит глубина `engine-001` | продуктовое решение |
| H7 | **15 открытых вопросов аудита** — `docs/DISCOVERY-REPORT-2026-07.md`, раздел «Открытые вопросы / NOT FOUND» | |
| H8 | **CI source of truth** — `ai-playbook-ci.yml` чекаутит внешний `beaver20007/ai-playbook-generator`, а не submodule. Какой репо главный? | архитектурное решение |

**Закрыто, не переэскалировать:** Railway-инвойс $32.95 **оплачен**; `CLAUDE_MODEL_PROFILE=premium`
выставлен (прод на **Sonnet**, не Haiku) — оба пункта из хендоффа устарели.

## 5. Карантин

| Что | Причина |
|---|---|
| `refs/heads/<name-of-remote-branch>` на origin | битое имя ветки, ломает fetch; ждёт H5 |
| `docraft-v2-package/` + `docraft-v2-package.zip` в корне | черновик ребрендинга, не интегрирован; решение — каннибализировать токены, не интегрировать целиком |
| `_tmp_n11_images/`, `*.capture-pack.zip` в корне | временные артефакты, вне git-контроля задач |
| `docs/supabase-schema.sql` (черновик) | неизвестно, применялся ли; см. вопрос аудита №10 |

## 6. Конфликт-карта (файлы, уже затронутые влитой ручной работой)

Параллельные ветки, трогающие эти файлы, получат конфликт → стартовать строго от свежего `main`.

**`apps/ai-playbook`** (13 файлов, диапазон `0005c1d..34b58a2`):
`apps/api/app/main.py`, `apps/api/app/routes/compress.py` (new), `apps/api/app/services/pdf_compress_service.py` (new),
`apps/web/app/pdf/compress/page.tsx`, `apps/web/app/pdf/convert/page.tsx` (new), `apps/web/app/pdf/page.tsx`,
`apps/web/app/v2/{design.css,layout.tsx,page.tsx}` (deleted), `apps/web/components/v2/GenerateFormV2.tsx` (deleted),
`apps/web/lib/generation/constants.ts`, `apps/web/next.config.ts`, `apps/web/proxy.ts`.

**`apps/magical-pdf`** (1 файл, `cd2581e..5f32a2d`): `extract/Dockerfile`.

**`apps/desktop-instructor`:** не затронут.

> Активные треки `pdf-001` / `pdf-002` / `quality-001` **не пересекаются** с этим списком.

## 7. Подводные камни (10, из HANDOFF-manual.md — читать перед действием)

1. **Прямой push в `main` заблокирован** auto-mode — вся работа через ветку + PR (включая правки этого файла).
2. **Railway CLI (v5.12.1) игнорирует `railway.toml`/`railway.json` при `railway up`** — билдер и Root Directory только через дашборд/GraphQL. Два упавших деплоя стоили ~$6.
3. **Railway тарифицирует время работы контейнера × RAM**, упавшие билды тоже платные. extract — Serverless (sleep on idle), первый запрос после сна = холодный старт до 1–3 мин.
4. **RAM extract нельзя ниже 4 GB** («<2GB often OOMs»); при `ON_FAILURE` низкая RAM = цикл OOM-рестартов дороже стабильного контейнера. Выставлен max restarts = 3.
5. **Vercel: удаление/пересоздание прод-переменных** требует явного разрешения владельца; простое добавление даёт `branch_not_found`.
6. **Локальные submodule-ref'ы устаревают после мержа на GitHub** — перед выводами `git fetch` + `git submodule update --remote`.
7. **CI чекаутит внешний репо**, не submodule; требует секрет `GH_PAT` (репо приватный). См. H8.
8. **Node/npm ломались** (`nvm use` без npm) — лечится `nvm uninstall/install 24.18.0`. Симптом: `spawn npx ENOENT`.
9. **Консоль Windows в cp1251** калечит кириллицу — проверять текст записью в UTF-8 файл, не `print` в консоль.
10. **A/B-тест `design_v2_docraft_brand` полностью удалён**; **PostHog не подключён вообще** — если где-то в доках они числятся живыми, это устарело.

**+11 (найдено сегодня):** `git fetch --all` в суперрепо **всегда падает** на ветке `<name-of-remote-branch>` (см. H5). Пока не удалена — это ожидаемый шум, не поломка репо.

## 8. Инфраструктура (прод)

| Слой | Что | Адрес/деталь |
|---|---|---|
| Railway (проект `docraft`) | Redis, `magical-pdf-extract`, `ai-playbook-generator` [worker], `confident-vibrancy` [api] | extract: `https://magical-pdf-extract-production-5a99.up.railway.app`, Root Directory = `/extract` (критично) |
| Vercel | 1 продовый (ai-playbook-generator web) | `NEXT_PUBLIC_PDF_API_URL` → Railway extract |
| Модель | `CLAUDE_MODEL_PROFILE=premium` → **Sonnet** на api + worker | |
| Не сконфигурировано | Stripe (`stripe_configured:false`), FAL (`fal_configured:false`) | см. H1–H3 |
| Домен `docraft.pro` | намеренно НЕ подключён к проду (pre-launch) | не менять DNS без явного запроса |

## 9. Журнал решений

| Дата | Решение | Основание |
|---|---|---|
| до 2026-07-21 | Railway-инвойс оплачен, «past due» закрыт | владелец |
| до 2026-07-21 | `premium`/Sonnet на api + worker | владелец |
| до 2026-07-21 | Экран генерации = **Variant 1** | владелец |
| до 2026-07-21 | Движок = **явные стадии**, не LangGraph | владелец |
| до 2026-07-21 | `quality-001` — отдельным валидатором **до** рефактора движка | владелец |
| до 2026-07-21 | `docraft-v2-package` — **каннибализировать** (токены/дизайн-система), не интегрировать целиком | владелец |
| 2026-07-21 | Оркестратор введён в строй; PR `docraft#4` уже был влит владельцем — хендофф принят чтением | эта сессия |
| 2026-07-21 | `pdf-001`/`pdf-002` переназначены с `magical-pdf` на **ai-playbook** (реальное расположение кода) | проверено `find`/`grep` |
| 2026-07-21 | `pdf-001` ‖ `quality-001` запущены параллельно (разные каталоги одного submodule, разные ветки, пересечений файлов нет) | конфликт-карта |
