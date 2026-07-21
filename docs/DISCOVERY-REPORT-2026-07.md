# Docraft — Discovery-отчёт

**Дата:** 2026-07-19 · **Метод:** параллельный аудит кода (5 агентов-исследователей) + живая проверка инфраструктуры (Railway/Vercel CLI, HTTP-пробы).
**Правило отчёта:** каждый факт проверен в коде/инфраструктуре и снабжён путём к источнику. Где ответа нет — прямо помечено `NOT FOUND / уточнить у владельца`.

---

## Как запускается проект локально (кратко)

```powershell
# Backend (FastAPI) — Python 3.11 обязательно
cd apps/ai-playbook/apps/api
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000

# Worker (Celery) — ОБЯЗАТЕЛЕН, генерация асинхронная
celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=2

# Frontend (Next.js 16)
cd apps/ai-playbook/apps/web
npm install && npm run dev
```

Для полного end-to-end прогона генерации нужны: **Redis** (broker+хранилище), **Celery worker**, **FastAPI**, **Next.js**, валидный `ANTHROPIC_API_KEY`. Supabase/OpenAI/FAL/Stripe — опциональны. (Источник: `apps/ai-playbook/CLAUDE.md`, `apps/ai-playbook/apps/api/app/config.py:26`.)

## Дерево репозитория (2–3 уровня)

```
docraft/                          ← мета-репо на git submodules (.gitmodules)
├── apps/
│   ├── ai-playbook/              ← ОСНОВНОЙ ПРОДУКТ (submodule, own .git)
│   │   ├── apps/api/             ← FastAPI backend
│   │   ├── apps/web/             ← Next.js 16 frontend
│   │   ├── packages/             ← document-schema, render-engine, content-normalizer
│   │   ├── themes/               ← 7 JSON-тем PDF
│   │   ├── supabase/             ← schema.sql + migrations
│   │   └── prompts/, scripts/, docs/
│   ├── magical-pdf/              ← PDF-инструменты + OCR extract (submodule)
│   └── desktop-instructor/       ← захват скриншотов десктопа (submodule)
├── docraft-v2-package/           ← черновик ребрендинга v2 (НЕ интегрирован)
├── contracts/, docs/, scripts/
└── README.md, VISION.md, AGENTS.md
```

---

## A. Репозиторий и архитектура

**1. Структура.** Монорепо-«зонтик» на **git submodules** (не единая история): `.gitmodules` в корне подключает `apps/ai-playbook`, `apps/magical-pdf`, `apps/desktop-instructor` — каждый со своим remote (`README.md:7-15`, `docs/REPOS.md`). Внутри `apps/ai-playbook` фронт (`apps/web`) и бэк (`apps/api`) — в одном submodule, движок вынесен в `packages/` (document-schema = JSON-схема IR, render-engine = ReportLab-рендерер, content-normalizer = Markdown→IR фолбэк).
Роли (`README.md`): **Create** = ai-playbook, **Capture** = desktop-instructor, **Protect/OCR** = magical-pdf.

**2. Технологии (по факту, из манифестов):**
- Frontend (`apps/web/package.json`): **Next.js 16.2.6**, **React 19.2.4**, App Router; `@supabase/ssr` 0.10, `pdf-lib` 1.17, `pdfjs-dist` 6.0, Tailwind 4, Playwright 1.40. ⚠️ `apps/web/AGENTS.md`: «This is NOT the Next.js you know» — нестандартная/бета-ветка Next 16.
- Backend (`apps/api/pyproject.toml`): **FastAPI ≥0.115**, Pydantic 2, **Celery[redis] ≥5.4**, **anthropic ≥0.28**, openai ≥1.35, **fal-client ≥0.5**, python-docx ≥1.1, pymupdf ≥1.24, stripe ≥10, sentry-sdk.
- **LangGraph/LangChain НЕ используются** — grep по всему `apps/api` = 0 совпадений. Оркестрация LLM написана вручную.
- ReportLab не в `pyproject.toml` напрямую — тянется транзитивно через `packages/render-engine` (точная версия — `NOT FOUND`, уточнить).

**3. Локальный запуск** — см. блок выше.

---

## B. Движок генерации документов

**4. Как генерируется.** Не граф, а **последовательный императивный Python-пайплайн** в одной Celery-задаче `run_generate` (`apps/api/app/tasks/generate_task.py:81-480`). Шаги (каждый — отдельный синхронный вызов Claude):
1. Обогащение промпта (контекст файла + пресеты) — `generation_presets.py`.
2. Генерация IR — `AIService.generate_document` (`ai_service.py:613`), Claude отдаёт JSON.
3. QA-пайплайн: 4 независимых проверки (relevance/completeness/quality/data_context) + до 3 циклов авто-коррекции — `quality_service.py:177-252`.
4. (Опц.) Иллюстрации: двухпроходная расстановка + ревью промптов + параллельная генерация (до 8 воркеров) — `image_service.py`.
5. Сохранение (in-memory + Supabase, если залогинен).
6. Проставление дат — `document_dates.py`.
7. Рендер PDF — `_run_render` (`routes/exports.py:341`) → ReportLab.
8. Для premium — двойная валидация (`premium_validation_service.py`).
9. PDF→JPEG превью (PyMuPDF) + DOCX (`docx_service.py`) → всё в Redis.

**5. Модели Claude.** Таблица маршрутизации `app/services/claude_models.py` (алиасы `claude-haiku-4-5`, `claude-sonnet-4-5`), переключатель `CLAUDE_MODEL_PROFILE` (`development` | `premium`):

| Задача | development | premium |
|---|---|---|
| generate_ir | Haiku | **Sonnet** |
| qa_check ×4 | Haiku | Haiku |
| qa_correct | Haiku | **Sonnet** |
| section_regen | Haiku | **Sonnet** |
| visual_full/place | Haiku | Sonnet/Haiku |
| illustration_review, file_vision | Haiku | Haiku |

**По умолчанию профиль `development` (`config.py:30`) → на проде сейчас Haiku везде**, пока явно не переключат. Sonnet включается только на «дорогих» текстовых шагах.

**6. Полный поток:** `POST /generate/` (billing check → enqueue, ответ 202 с job_id) → Celery `run_generate` (шаги 1-9 выше) → `save_job(completed)`. Фронт поллит `GET /generate/{id}/status` каждые 2 сек. Скачивание — `GET /exports/{id}/download` (PDF или `?format=docx`).

**7. Структурированный вывод — да.** Между генерацией и рендером — **Document IR** (JSON), схема `packages/document-schema/schema.json`. Claude инструктируется отдавать только валидный JSON с закрытым набором блоков (cover/heading/paragraph/callout/table/stats_grid/code/divider/image). Свободного markdown в основном потоке нет (Markdown-парсер `content-normalizer` — legacy-фолбэк, в проде не используется). ⚠️ В Python IR типизирован слабо (`dict[str, Any]`), формальная валидация только через JSON Schema, не Pydantic.

---

## C. Шаблоны документов

**8. Типы документов.** Enum `DocumentType` в бэке (`app/domain/models.py:22-25`): `playbook`, `investor-memo`, `onboarding-kit`. **НО фронт не передаёт `document_type` вообще** — всегда дефолт `playbook` (`useGenerateForm.ts:199-213`; для captures захардкожен `"playbook"`). То, что в UI выглядит «типами» — это `PromptTemplateCategory` (`lib/promptTemplates.ts`): playbook/onboarding/memo — **только текст-заготовки промпта, не влияют на бэкенд** (комментарий в файле: «Только UI/копирайт»). **Фактически поддержан один тип — playbook.** `investor-memo`/`onboarding-kit` — мёртвые значения enum. Причина — `NOT FOUND`.

**9. Определение шаблона.** Гибрид без БД: **layout** = 1 JSON-файл `packages/document-schema/layouts/playbook-standard.json` (единственный, `compatible_types:["playbook"]`); **тема** = 7× `themes/<id>/theme.json`; **содержание** = целиком промпт к Claude, не параметризованные слоты из БД. Таблицы «templates» нет.

**10. Различия типов.** Практически никаких — один тип, один layout. Реальные дифференциаторы: `theme_id` (визуал), пресеты `tone/audience/length/language` (влияют на объём/стиль — `generation_presets.py`), `premium_palette`. Ветвлений `if document_type == ...` в коде нет; `document_type` влияет только на одну строку промпта.

---

## D. PDF-пайплайн (ReportLab)

⚠️ **Важное разграничение.** Есть ДВА независимых PDF-инструмента:
- **PDF Hub** (`apps/web/app/pdf/*`) — клиентские утилиты на `pdf-lib` (merge/split/compress/convert/…), к генерации документов не относится.
- **Рендерер сгенерированных документов** — описан ниже.

**11. Код рендера.** Точка входа `routes/exports.py:_run_render()` (341-407) → подключает `packages/render-engine` → `RenderContext.from_files(theme.json, layout.json)` → `PDFExporter` (`render_engine/exporters/pdf_reportlab.py`, `reportlab.platypus.SimpleDocTemplate`). Компоненты по одному файлу на блок (`render_engine/components/`). PDF→JPEG превью через PyMuPDF.

**Темы — конфиг, не хардкод.** `GET /themes/` просто читает `themes/*/theme.json` (`routes/themes.py:35-54`); компоненты берут значения только через `ctx.token()` (`context.py:50-68`). 7 тем реально существуют:

| id | mode | tier | primary | heading/body |
|---|---|---|---|---|
| minimal-light | light | standard | #111111 | Arial-Bold/Arial |
| executive-dark | dark | standard | #C9A84C золото | Arial-Bold/Arial |
| corporate-blue | light | standard | #1E40AF | Arial-Bold/Arial |
| modern-dark | dark | standard | #6366F1 | Arial-Bold/Arial |
| playful-neon | dark | standard | #00D9FF | Arial-Bold/Arial |
| academic-serif | light | standard | #2C1810 | **Georgia-Bold/Georgia** |
| premium | light | **premium** | #00A651 | **Inter-Bold/Inter, mono Monaco** |

У premium дополнительно — секции validation/quality_gates/illustration_guidelines (`themes/premium/theme.json:88-153`) + 7 палитр (`premium_palettes.py`, только для premium).

⚠️ **«Строгая / Акцентная / Ночная обложка» — NOT FOUND.** Этих русских названий нет нигде. Варианты обложки в коде: `cover_style` = left_aligned/centered/centered_bold/classic_centered/premium_centered, но в `cover.py` реализованы фактически только 2 (`_render_left_aligned`, `_render_centered`). Файл `public/design/themes/pdf-themes.css` (docraft-light/dark/violet) заявляет связь с ReportLab, но **нигде не подключён** — неинтегрированный макет.

**12. Шрифты и кириллица.** Регистрация — `render_engine/fonts.py`: логические имена `Arial`/`Arial-Bold`/`Courier`, регистрируются ТОЛЬКО 2 TTF по путям-кандидатам. В контейнере (`Dockerfile:12-16`) ставится `fonts-dejavu-core` → **кириллица работает через DejaVu Sans** (на Windows-деве — системный Arial). TTF в репо нет. **Отдельного дисплей-шрифта для заголовков нет** — это просто bold той же гарнитуры.

⚠️ **БАГ (подтверждён кодом).** Темы `academic-serif` (Georgia) и `premium` (Inter/Monaco) ссылаются на шрифты, которые **нигде не регистрируются** (в `fonts.py` только Arial). `resolve_font()` вернёт неизвестное ReportLab имя → эти 2 темы могут падать в `except` (`exports.py:67-72`) и давать `status: failed`, либо рендериться неверным шрифтом. **Требует проверки владельцем.**

**13. Хардкод в Python-рендере.** Цвета в целом вынесены в theme.json, но захардкожены: геометрия обложки (`cover.py` — толщины 12/6/8/3px, `+4`/`-4` к кеглю, отступы `0.18/0.28`); водяной знак полностью зашит (`watermark.py` — #888888, alpha 0.14, 42pt, 45° — одинаков для всех тем включая тёмные); футер («Стр. N» захардкожен, `footer.py:94`); подпись картинки (`image_block.py:82` — `fontName="Arial"` буквально, не через resolve_font). ⚠️ Ещё баг: `image_block.py:79` читает `color.text_secondary`, а в темах путь `color.text.secondary` (вложенный) → подпись картинок всегда дефолтный #888888.

---

## E. Бренд и токены

**14. Где определены.**
- **Веб-бренд:** `apps/web/public/design/tokens/design-tokens.css` — «DOCRAFT.pro Design Tokens v2», переменные `--dc-*` (violet #6B5CE7, cyan #00BFA5, orange #F5A623, шрифты Epilogue/DM Sans/JetBrains Mono). ⚠️ **Но этот файл НЕ подключён** — реально работает `app/globals.css` со стандартными Next-переменными (Arial, #ffffff). Статус design-tokens.css неясен — `уточнить у владельца`.
- **PDF:** `themes/*/theme.json` (7) + `premium_palettes.py` + логические шрифты `fonts.py`.

**15. Дублирование / единый источник.**
- **Веб vs PDF — палитры полностью разные, общего токен-слоя нет.** Сайт фиолетово-циановый (#6B5CE7), PDF-темы — своя палитра (золото/зелёный Stratum/…). Не дублирование, а расхождение.
- **Внутри приложения — да, ручное дублирование:** `constants.ts:33-41` (`THEME_PREVIEW_COLORS`) дословно копирует все 7 theme.json (комментарий: «Mirrors theme.json»), `constants.ts:44-52` (`PREMIUM_PALETTES`) зеркалит `premium_palettes.py`. Сверка значений — совпадают дословно. Первичный источник — API (theme.json/premium_palettes.py), constants.ts — статичный фолбэк. **Механизма авто-синхронизации нет → риск дрейфа.**

---

## F. Фронтенд и экран генерации

**16.** Код — `apps/web`, **Next.js 16.2.6, App Router** (директория `app/`, `pages/` нет). Ключевые файлы: `app/page.tsx` (главная), `components/variant-a/VariantAHero.tsx`, `components/GenerateForm.tsx`, `lib/generation/useGenerateForm.ts`, `components/PreviewGallery.tsx`.

**17. Что live.** Единственный живой экран — `app/page.tsx` → **«Вариант A»** (тёмная тема, классы `da-*`, `app/variant-a.css`), hero из `VariantAHero.tsx` («Создайте профессиональный документ»). Разветвления A/B в `page.tsx` нет — один экран для всех.

**18. A/B-тест `ab_design_v2_docraft_brand` — ПОЛНОСТЬЮ УДАЛЁН из кода** (факт, проверен на диске). Коммит `5f1397e` «retire legacy /v2 design» (07.07.2026, beaver20007@gmail.com). Сейчас: директории `app/v2/` нет; `proxy.ts` содержит только Supabase-auth, без A/B-логики; `next.config.ts` — постоянный редирект `/v2 → /` для старых закладок. Раньше он рероутил 50% посетителей на удалённый теперь дизайн — этого больше нет.

**19. Стриминга превью нет.** Механизм — **HTTP-поллинг** статуса job каждые 2 сек (`pollJobStatus.ts`, таймаут 5 мин / 10 мин с иллюстрациями). Превью появляется **целиком после завершения** (`PreviewGallery` рендерится только при готовом result); внутри — ленивая построничная загрузка уже готовых JPG. SSE/WebSocket — `NOT FOUND`.

---

## G. A/B-тест и аналитика

**20.** A/B-тест удалён (см. F.18). `AB_COOKIE` в `constants.ts` больше нет, `app/v2` нет, `GenerateFormV2.tsx` нет. Не работает даже частично. Остаток — только редирект `/v2 → /`.

**21. PostHog — НЕ подключён.** Полнотекстовый поиск по всему `apps/ai-playbook` (web+api): `posthog`/`.capture(` = 0 в коде продукта (единственное упоминание — в текстовом плане `Пошаговый старт проекта…txt:294`). `posthog-js`/`posthog-node` нет в зависимостях. **Все 5 названных событий (`generate_click`, `template_selection`, `theme_selection`, `file_upload`, `ai_illustrations_toggle`) — NOT FOUND**, не реализованы.

**22. Цифры трафика/конверсии — NOT FOUND.** Требуют live-дашборда. Более того, раз PostHog не интегрирован, сбор событий в принципе не идёт.

---

## H. AI-иллюстрации

**23. Тумблер «AI иллюстрации».** UI — `GenerateForm.tsx:270-281`, состояние `includeImages` (`useGenerateForm.ts:50`) → `include_images` в API. Бэк — двухпроходный pipeline (`generate_task.py:674-798`): Pass 1 «визуальный консультант» Claude расставляет image-блоки с промптами (`ai_service.py:409`), затем ревью промптов, затем Pass 2 — параллельная генерация (ThreadPoolExecutor до 8).
**Провайдер/модель** (`image_service.py`): приоритет 1) OpenAI Images (`gpt-image-2`→`gpt-image-1`), 2) Fal.ai fallback — модель **`fal-ai/flux/schnell`** (FLUX.1 Schnell, 4 шага, landscape_4_3). `FAL_KEY` в env.
**Промпт** собирается в `build_image_generation_prompt()` (`image_service.py:69-97`) — к тексту от Claude добавляются guard-суффиксы (no-text guard / on-image-text quality + русская локализация).
⚠️ **Кэша нет.** Отдельного per-prompt кэша изображений в коде нет. Картинка → base64 в блок IR (`generate_task.py:774`) → живёт вместе с экспортом в Redis (TTL 7 дней). Повторной генерации по одинаковому промпту с переиспользованием нет.

**24. Куда вставляется.** **Только в PDF** (ReportLab, `image_block.py:35-92`, декод base64 → `platypus.Image`). Отдельного live HTML-превью IR-блоков во фронте нет: «превью» в `PreviewGallery.tsx` — это **JPEG-снимки уже готовых PDF-страниц** (`/exports/{id}/preview/page/{p}.jpg`), а не рендер картинки в браузере.

---

## I. Данные и авторизация

**25. Схема Supabase** (`apps/ai-playbook/supabase/schema.sql` — актуальная):
- **`documents`**: id, user_id→auth.users, title, prompt, document_type, `document_ir jsonb`, timestamps. RLS включён, политики по `auth.uid()=user_id` + service-role bypass.
- **`exports`**: id, document_id, user_id, theme_id, status, page_count, model, input/output_tokens, created_at. RLS включён.
- **`user_profiles`**: user_id pk, `plan text check(free|pro)`, updated_at. RLS включён. Миграция `20260612_stripe_customer_id.sql` добавляет `stripe_customer_id` + unique index — ⚠️ **по CLAUDE.md ещё не применена (pending #7)**.
- Черновик `docs/supabase-schema.sql` (таблицы `profiles`, триггер handle_new_user) — **не используется кодом**, `уточнить`.

**Auth.** Supabase Auth через `@supabase/ssr`. Middleware `proxy.ts`: `AUTH_ENABLED = Boolean(URL && ANON_KEY) && E2E_SKIP_AUTH!="true"`. **Опционален** — без ключей приложение работает без авторизации. Неавторизованных редиректит на `/auth`.

**RLS.** В SQL-миграциях включён для всех 3 таблиц с политиками. ⚠️ Фактическое состояние в live-базе код-поиском не подтверждается на 100% — **проверить в Supabase Dashboard → Policies**.

**26. Где хранятся файлы.** Комбинация:
- **Redis** (основное, TTL 7 дней): `pdf:{id}`, `page:{id}:{i}`, `docx:{id}`, `ir:{id}`, `job:{id}` (`generate_task.py`, `export_blob_ttl_seconds=604800`).
- **Supabase Storage** bucket `exports` (постоянное, переживает рестарт Railway): `{id}/document.pdf` (`storage_service.py`), заливается после рендера, используется как fallback при скачивании после истечения Redis TTL.
- **Локальный диск** — dev/legacy fallback.
- **document_ir** для залогиненных → Postgres `documents.document_ir` (`supabase_service.py:25`).

---

## J. Инфраструктура и деплой (живая проверка через Railway/Vercel CLI)

**27. Railway** (проект `docraft`, workspace beaver20007, план **Hobby**) — 4 сервиса, все Online:
| Сервис | Роль | URL | Примечание |
|---|---|---|---|
| ai-playbook-generator | **api** (FastAPI) | ai-playbook-generator-production.up.railway.app | `/health` role=api |
| confident-vibrancy | **worker** (Celery) | confident-vibrancy-production-3773… | `/health` role=worker — тот же код, другая роль |
| magical-pdf-extract | **OCR extract** | magical-pdf-extract-production-5a99… | развёрнут только что; Serverless (sleep on idle) |
| Redis | broker+хранилище | — | volume 0.3/4.9 GB |

⚠️ **Health проды:** `stripe_configured: false`, `fal_configured: false` на обоих (api+worker) — Stripe и FAL-ключи не выставлены в проде.
⚠️ **Railway billing: subscription past due** — неоплаченный инвойс $32.95 (карта insufficient funds). Риск отключения сервисов.

**Vercel** — проект `ai-playbook-generator` (`ai-playbook-generator.vercel.app`), Node 24. Единственный продовый фронт. `NEXT_PUBLIC_PDF_API_URL` только что переставлена на Railway extract-сервис.

**Vercel/Railway деплой — авто по git-push** (не через GitHub Actions). Явного deploy-workflow нет.

**28. CI/CD** (`.github/workflows/`):
- `ai-playbook-ci.yml` — pytest на push/PR в main при `apps/ai-playbook/**`. ⚠️ **Чекаутит ОТДЕЛЬНЫЙ репо `beaver20007/ai-playbook-generator`** (не submodule docraft), токен `GH_PAT||GITHUB_TOKEN`. Redis service-контейнер, ключи-заглушки `sk-test-placeholder`. Codecov (`CODECOV_TOKEN`). E2E не гоняется. Последний запуск (29.06) — success.
- `validate-schema.yml` — валидация контрактов N11.
- `apps/magical-pdf`: `build-installers.yml` (Tauri mac/win), `deploy-pages.yml` (GitHub Pages).
- Секреты в CI: `CODECOV_TOKEN`, `GH_PAT`. Прод-секреты в CI не используются (только заглушки).

**Redis — две роли:** (1) Celery broker+result backend (`celery_app.py`, оба = `redis_url`, result_expires 3600); (2) временное объектное хранилище с TTL для PDF/DOCX/IR/job-статуса (не сессии — сессии в Supabase).

---

## K. Бизнес и цели

**29. Стадия — pre-launch.** `PRD.md §14`: последовательность до «7. Public launch» ещё не пройдена. Домен `docraft.pro` намеренно НЕ подключён к проду (`CLAUDE.md:41`, `ROADMAP-FINALE.md` — «прод сейчас на vercel/railway»). Единственный аккаунт с экспортами — `beaver20007@gmail.com` (сам владелец), 8 документов (`docs/coach/GATE-17.9.md`) — не внешние пользователи. **Данных о пользователях/MRR/выручке в репо нет.**

**30. Монетизация — технически готова, организационно не активирована.**
| План | Watermark | Лимит/мес | Источник |
|---|---|---|---|
| Free | Да («Docraft») | 3 | `config.py:61` free_monthly_exports=3 |
| Pro | Нет | unlimited (0) | `config.py:62` pro_monthly_exports=0 |
Цена Pro в коде нет (только `stripe_pro_price_id`). PRD §10: план «Pro €19-49 / Team €99+» (не факт из кода). Механизм: `billing_service.py` (план из Supabase, `BILLING_ENFORCE` по умолчанию false), `stripe_service.py` (checkout/portal/webhook). ⚠️ Pending: создать продукт в Stripe, webhook, миграция stripe_customer_id (все ⏳).

**31. Роадмап** (`docs/ROADMAP-FINALE.md`): P0 (шаблоны промптов, контекст-файлы, темы, watermark+тарифы, пресеты, язык RU+EN — большинство «сделано»); P1 (N11 захват, IR-редактирование, DOCX, workspace/версии/комментарии); P2 (marketplace, batch, выбор модели).
**ЦА** (`PRD.md §3`): «SaaS, agencies, AI studios, consultants, creators» — профиль B2B/B2B2C, но явной пометки «B2B/B2C» нет (`уточнить`). Метрики успеха названы (Export count, Activation, Retention, MRR, CAC, LTV — `PRD.md §15`), но **без целевых чисел**.

**32. Главная бизнес-цель переработки — NOT FOUND.** В репо нет формулировки цели текущего аудита/переработки. `Уточнить у владельца.`

---

## L. Ограничения и риски

**33. Что нельзя ломать** (формального «critical path» нет, собрано из gate-критериев):
- `PRD.md §17.9`: должны работать — генерация без иллюстраций (E2E), генерация с иллюстрациями (картинки в PDF без массовых Failed), Auth+История, отсутствие критичных ошибок UI.
- `AGENTS.md` (корень): не включать N11 до готовности пайплайна; **не менять DNS docraft.pro без явного запроса**; до gate не трогать `NEXT_PUBLIC_API_URL`/`ALLOWED_ORIGINS`/Supabase Site URL.
- `ROADMAP-FINALE.md:280`: не параллелить DNS cutover с крупной фичей.

**34. Юр./комплаенс (152-ФЗ, GDPR) — NOT FOUND.** Поиск по «152-ФЗ/GDPR/персональные данные/privacy» = 0 релевантного. Privacy Policy в репо нет. Единственный «compliance» — про WCAG-доступность PDF, не про перс. данные. `Уточнить у владельца.`

**35. Техдолг:**
- Pending manual tasks (`CLAUDE.md`): N11 флаги, E2E N11a, Stripe продукт/webhook, миграция stripe_customer_id — все ⏳.
- Отставание от PRD (`ROADMAP-FINALE.md:101-111`): нет context memory/RAG, collaboration, brand kits; публичный API частичный; «5 тем по PRD → ~2 в UI».
- **TODO/FIXME в коде = 0** (grep по api/web). Техдолг зафиксирован не в коде, а в доках.
- Плюс баги, найденные этим аудитом (не задокументированы командой): шрифты academic-serif/premium не регистрируются (D.12); подпись картинок читает неверный путь токена (D.13).

---

## M. Тесты и качество

**36.**
- **Backend:** 27 тест-файлов, ~277 функций `test_` (`apps/api/tests/`). Конфиг: pytest≥8, pytest-asyncio, pytest-cov. Соответствует «246+» из CLAUDE.md.
- **E2E:** 1 файл `e2e/p1-full-flow.spec.ts`, 7 smoke-тестов (форма/темы, без реальной генерации). Скрипты `test:e2e` (Playwright).
- **CI:** `ai-playbook-ci.yml` — backend pytest + Redis + Codecov. E2E не в CI. Последний запуск success (29.06). ⚠️ Чекаутит внешний репо `ai-playbook-generator`, не submodule — `уточнить, какой репо source of truth`.

---

## Открытые вопросы / NOT FOUND (для владельца)

1. **Темы «Строгая / Акцентная / Ночная обложка»** — таких названий в коде нет. Что имелось в виду? (есть 7 англоязычных тем + cover_style-варианты).
2. **⚠️ БАГ: темы `academic-serif` и `premium`** ссылаются на незарегистрированные шрифты (Georgia/Inter/Monaco) → могут падать или рендериться неверно. Проверить, работают ли эти 2 темы в проде.
3. **`docraft-v2-package/`** — черновик ребрендинга v2, скопирован частично в `public/design/`, но не интегрирован. Доводить или удалить?
4. **`design-tokens.css`** (веб-бренд `--dc-*`) не подключён к реальному UI (работает `globals.css` со стандартными стилями). Актуален ли этот дизайн?
5. **PostHog не подключён** — 5 названных событий не существуют. Планировалась ли аналитика? (есть только в текстовом плане).
6. **Цифры трафика/конверсии** — недоступны из кода (и не собираются, раз PostHog нет).
7. **investor-memo / onboarding-kit** — в enum есть, в UI недоступны. Доводить?
8. **CI чекаутит внешний репо `beaver20007/ai-playbook-generator`**, а не `apps/ai-playbook` внутри docraft. Какой репо — source of truth? Синхронизированы ли они?
9. **RLS в live-Supabase** — в SQL включён, но фактическое состояние проверить в Dashboard.
10. **Черновик `docs/supabase-schema.sql`** (таблицы profiles) — применялся ли когда-либо?
11. **Главная бизнес-цель переработки** — не в коде.
12. **ЦА B2B/B2C** — явной формулировки нет.
13. **Цена Pro** — только в Stripe Dashboard (в коде price_id-ссылка).
14. **Юр./комплаенс (152-ФЗ/GDPR/Privacy Policy)** — в репо отсутствует.
15. **Версия ReportLab** — транзитивная, не зафиксирована явно.

### ⚠️ Срочное (инфраструктура, выявлено при живой проверке)
- **Railway subscription past due** — $32.95 неоплачено (карта insufficient funds). Риск отключения всех сервисов.
- **Stripe и FAL не сконфигурированы в проде** (`stripe_configured:false`, `fal_configured:false`) — биллинг и AI-иллюстрации на проде не работают.
- **Профиль Claude на проде = `development`** (по умолчанию) → генерация идёт на Haiku, не Sonnet. Для «premium» качества нужно выставить `CLAUDE_MODEL_PROFILE=premium`.
