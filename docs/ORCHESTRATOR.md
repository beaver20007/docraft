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

| # | Репо | PR | Аудит базы (правило 2) | Статус |
|---|---|---|---|---|
| 1 | ai-playbook | [#6](https://github.com/beaver20007/ai-playbook-generator/pull/6) `fix/render-fonts-themes` — **pdf-001** | merge-base `34b58a2` = `origin/main`; 1 свой коммит `dde26bd`; 3 файла; чужих нет; границы ТЗ соблюдены | **ПРОВЕРЕН, ГОТОВ К МЕРЖУ** — ждёт отмашки владельца |
| 2 | ai-playbook | [#7](https://github.com/beaver20007/ai-playbook-generator/pull/7) `feat/ir-numeric-validator` — **quality-001** (DRAFT) | merge-base `34b58a2` = `origin/main`; 2 своих коммита `5634c1c`, `045e239`; 3 файла; чужих нет; границы ТЗ соблюдены | **ПРОВЕРЕН, ГОТОВ К МЕРЖУ** — ждёт отмашки владельца |
| — | ai-playbook | ~~#1 `cursor/dev-environment-setup-475d`~~ | 1 свой коммит `de75733`, 1 файл `AGENTS.md` (в `main` нет → конфликта не было бы), чужих нет; ветка отстала на **102 коммита** | ✅ **ЗАКРЫТ 2026-07-21** как устаревший (H9), с причиной в комментарии. Обратимо: `gh pr reopen 1` |

### Независимая перепроверка отчётов воркеров (правило 3 — отчёт без вывода команд не факт)

**pdf-001.** Прогнал собственный скрипт по 21 паре «тема × шрифт» (resolve_font + проба глифа U+0410
в реальном cmap) на обоих состояниях кода: на `main` — **5 незарегистрированных** шрифтов
(`Georgia`, `Georgia-Bold`, `Inter`, `Inter-Bold`, `Monaco`), на ветке — **0**, все с кириллицей.
Тесты прогнал сам: `66 passed`. Дефект воспроизведён своими руками, фикс его закрывает.
Механизм бага важен: `StoryBuilder` глотал исключение ReportLab в warning → темы `academic-serif`
и `premium` отдавали **пустой PDF на 0 страниц (1004 байта) без ошибки**, а не падали.
Смена `FONT_MONO = "Courier" → "Mono"` инертна — потребителей константы в коде ноль (grep).

**quality-001.** Импорты валидатора — **только stdlib** (`json`, `re`, `sys`, `dataclasses`,
`decimal`, `typing`); ни `anthropic`, ни сети, единственный `open()` — в CLI-обёртке `__main__`.
Тесты прогнал сам: `59 passed` по новым, `336 passed` по всему пакету — регрессий нет.
Детерминированность проверена независимо: два прогона по трём реальным фикстурам —
вывод **байт-в-байт идентичен**. Ложных срабатываний на реальных фикстурах — **ноль**
(`errors=0 warnings=0 infos=0` на всех трёх). Непустоту ловли закрепляет регрессионный тест
`test_real_fixture_with_injected_defects_is_caught` (входит в 59).

## 2. Деплой-очередь

Пусто. Деплой исполняет владелец вручную (Railway + Vercel).
**Правило 14:** Railway тарифицирует рантайм контейнера — упавшие билды платные. Деплои — пачками, не вхолостую.

## 3. Треки (задачи воркерам)

| Трек | Submodule | Статус | Зависимость |
|---|---|---|---|
| `pdf-001` — регистрация шрифтов тем `academic-serif` / `premium` + кириллица | **ai-playbook** (`packages/render-engine`) | ✅ **СДЕЛАН, PR #6 проверен** — ждёт мержа | нет |
| `quality-001` — механический валидатор IR (консистентность цифр) | **ai-playbook** (`apps/api`) | ✅ **СДЕЛАН, PR #7 проверен** — ждёт мержа | нет |
| `pdf-002` — серый цвет подписи к картинке (`color.text_secondary` → `color.text.secondary`) | **ai-playbook** (`packages/render-engine`) | QUEUED — запуск сразу после мержа #6 | после `pdf-001` |
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
| H5 | ~~Мусорная ветка `<name-of-remote-branch>` на origin~~ | ✅ **ЗАКРЫТО 2026-07-21** — см. журнал |
| H6 | **Цели проекта** — допущения приняты (launch-ready; 1 реальный тип + дешёвый слой шаблонов; ЦА B2B/малый бизнес; docraft-v2-package каннибализировать). Подтвердить/поправить — от этого зависит глубина `engine-001` | продуктовое решение |
| H7 | **15 открытых вопросов аудита** — `docs/DISCOVERY-REPORT-2026-07.md`, раздел «Открытые вопросы / NOT FOUND» | |
| H8 | **CI source of truth** — `ai-playbook-ci.yml` чекаутит внешний `beaver20007/ai-playbook-generator`, а не submodule. Какой репо главный? | архитектурное решение |
| H9 | ~~`ai-playbook#1` — закрыть или освежить?~~ | ✅ **ЗАКРЫТО 2026-07-21** — PR закрыт как устаревший |
| H10 | ~~3 влитые ветки на origin суперрепо~~ | ✅ **ЗАКРЫТО 2026-07-21** — удалены |
| H11 | **Мерж `ai-playbook#6` и `#7`** — оба проверены Оркестратором независимо (см. раздел 1). Нужна отмашка на мерж | подтверждение владельца перед мержем |
| H12 | **Шрифт `Inter` для темы `premium`** — физически не установлен ни на хосте, ни в Docker-образе. Тема платного тира де-факто рендерится DejaVu Sans / Arial: технически валидно, визуально это не Inter. Положить `Inter*.ttf` в репо/образ (тогда хватит `RENDER_ENGINE_FONT_DIRS`) или принять подмену? | продуктовое решение по платному тиру |
| H13 | **Подключение валидатора `quality-001` к пайплайну** — в PR #7 намеренно не подключён. Где вызывать (перед рендером / в `generate_task`), блокировать ли на `severity=error` или писать метрикой в meta, и ставить ли gate в CI | продуктовое + прод-риск |

**Закрыто, не переэскалировать:** Railway-инвойс $32.95 **оплачен**; `CLAUDE_MODEL_PROFILE=premium`
выставлен (прод на **Sonnet**, не Haiku) — оба пункта из хендоффа устарели.

## 5. Карантин

| Что | Причина |
|---|---|
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

**+11 (найдено и устранено 2026-07-21):** `git fetch --all`/`git pull` в суперрепо падали на ветке
с невалидным для Windows именем `<name-of-remote-branch>` (`cannot lock ref … Invalid argument`),
приходилось фетчить точечно (`git fetch origin main`). Ветка удалена — обход больше не нужен.
**Урок на будущее:** плейсхолдер в `git push origin <name-of-remote-branch>` создаёт реальную
ветку с битым именем; на Windows это ломает fetch всему репозиторию, а не только автору.

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
| 2026-07-21 | **Закрыт `ai-playbook#1`** (H9) как устаревший: 7 недель, отставание на 102 коммита, актуальный гайд дешевле переписать. Причина записана в комментарии к PR. Обратимо: `gh pr reopen 1`, ветка на remote цела | владелец |
| 2026-07-21 | **Удалены 3 влитые ветки суперрепо** (H10): `chore/handoff-and-discovery` `697e0ca`, `fix/ci-submodules` `12cd61e`, `fix/gitmodules-desktop` `11db3c8` — у всех `git rev-list --count origin/main..origin/<b>` = 0, перепроверено непосредственно перед удалением. На origin осталась одна ветка `main`. Откат: `git push origin <sha>:refs/heads/<имя>` | владелец |
| 2026-07-21 | **Удалена ветка `<name-of-remote-branch>` с origin суперрепо.** Разрешение владельца получено. Проверено до удаления: `715e3200` — предок `main`, `git log origin/main..715e3200` пуст (уникальных коммитов 0). После: `git fetch --all --prune` и `git pull` проходят целиком, exit 0. Откат при нужде: `git push origin 715e3200a3c58230ffd967b374cd976c54e13349:refs/heads/'<name-of-remote-branch>'` | владелец + проверка командами |
