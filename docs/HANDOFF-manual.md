# HANDOFF — ручная сессия → Оркестратор

**Дата закрытия сессии:** 2026-07-19
**Тип сессии:** ручная (интерактивная, с владельцем), не headless
**Статус:** вся кодовая работа влита в main соответствующих репозиториев; открытых незамерженных PR по этой сессии нет.

---

## 1. Что делалось и зачем

Три независимые линии работы:

### Линия A — PDF Hub: реальное сжатие PDF
**Зачем:** инструмент «Сжать PDF» на проде показывал «Экономия: 0%» на любых файлах. Причина — использовался `pdf-lib` `useObjectStreams`, который жмёт только структуру PDF-объектов и ничего не даёт на скан-документах, где 99% веса — растровые изображения.
**Что сделано:** добавлен серверный эндпоинт, пересжимающий встроенные изображения (PyMuPDF + Pillow), и UI с 5 дискретными пресетами качества, показывающий фактический итоговый размер из ответа сервера (не оценку).

### Линия B — удаление легаси-дизайна `/v2`
**Зачем:** владелец видел на проде «не тот» дизайн главной страницы. Расследование показало: в `apps/web/proxy.ts` жил A/B-тест `ab_design_v2_docraft_brand`, который случайным образом (или по 30-дневной cookie) рероутил ~50% посетителей на `/v2` — отвергнутый вариант дизайна.
**Что сделано:** удалён `/v2` и вся A/B-логика; `/` — единственная главная для всех; добавлен постоянный редирект `/v2 → /` для старых закладок.

### Линия C — «Скан → редактируемый DOCX/PPTX» (OCR на проде)
**Зачем:** на сайте не было опции конвертировать PDF без текстового слоя (сканы, фото документов) в редактируемый Word/PowerPoint. Бэкенд для этого уже был написан (`magical-pdf/extract`, Docling+EasyOCR), но никогда не был развёрнут как публичный сервис — работал только как локальный компаньон Tauri-приложения на `127.0.0.1:8766`.
**Что сделано:** сервис развёрнут на Railway, добавлена страница `/pdf/convert` с поллингом job-API, карточка в PDF Hub, в Dockerfile добавлен LibreOffice (быстрый путь для PDF с текстовым слоем).

### Дополнительно — Discovery-аудит
По отдельному запросу владельца проведён полный аудит проекта (5 параллельных агентов-исследователей + живая проверка Railway/Vercel). Результат — `docs/DISCOVERY-REPORT-2026-07.md`.

---

## 2. Что сделано и где лежит

### Репозиторий `beaver20007/ai-playbook-generator` (submodule `apps/ai-playbook`)

| PR | Заголовок | Ветка | Статус |
|---|---|---|---|
| [#4](https://github.com/beaver20007/ai-playbook-generator/pull/4) | feat: real PDF compression presets, retire legacy /v2 design | `feat/compress-presets-remove-v2` | **MERGED** 2026-07-06 |
| [#5](https://github.com/beaver20007/ai-playbook-generator/pull/5) | feat: add scan PDF -> editable DOCX/PPTX tool to PDF Hub | `feat/convert-scan-to-docx-pptx` | **MERGED** 2026-07-15 |

Проверка: `cd apps/ai-playbook && gh pr list --state merged --limit 5`
Текущий main: `34b58a2` (содержит оба PR).

### Репозиторий `beaver20007/magical-pdf` (submodule `apps/magical-pdf`)

| PR | Заголовок | Ветка | Статус |
|---|---|---|---|
| [#2](https://github.com/beaver20007/magical-pdf/pull/2) | ci: add LibreOffice to extract Dockerfile | `feat/extract-libreoffice-railway-deploy` | **MERGED** 2026-07-15 |

Проверка: `cd apps/magical-pdf && gh pr list --state merged --limit 5`
Текущий main: `5f32a2d`.

### Репозиторий `beaver20007/docraft` (корень)

Ранее в этой же сессии (до текущего блока работ) были влиты PR #1, #2, #3 — починка `.gitmodules` и CI (`ai-playbook-ci.yml`), после чего CI стал зелёным.
Текущая сессия добавляет: обновление указателей submodule, `.claude/launch.json` (конфиг запуска API), `docs/DISCOVERY-REPORT-2026-07.md`, этот файл. См. раздел 6 — открыт PR.

### Инфраструктура (изменения вне git — важно для Оркестратора!)

| Что | Где | Состояние |
|---|---|---|
| Сервис `magical-pdf-extract` | Railway, проект `docraft` | Создан, задеплоен, **Serverless (sleep on idle)**, max restarts = 3 |
| Публичный домен | Railway | `https://magical-pdf-extract-production-5a99.up.railway.app` |
| Root Directory | Railway → magical-pdf-extract → Settings | `/extract` (**критично**, иначе билд падает) |
| `NEXT_PUBLIC_PDF_API_URL` | Vercel → ai-playbook-generator | Пересоздана: указывает на Railway extract-сервис (Production + Preview) |
| Env vars extract-сервиса | Railway | `EXTRACT_PUBLIC_BETA=1`, `OCR_DOCS_MAX_PAGES=15`, `OCR_DOCS_MAX_BYTES=20971520`, `OCR_DOCS_DATA_DIR=/data`, `HF_HOME=/data/huggingface`, `EXTRACT_CORS_ORIGINS` (включает vercel-домен) |

---

## 3. Проверено вживую (не «по коду», а прогоном)

**Сжатие PDF** — на шумном тестовом PDF 2.65 МБ пресеты дают чёткую дифференциацию:
`none 1.69 МБ → medium 829 КБ → high 265 КБ → max 65 КБ`. В UI на проде: «До 2.53 МБ → После 63.4 КБ → Экономия 98%». Невалидный PDF → 422 + понятная ошибка в UI.

**Дизайн `/v2`** — прод: `/` отдаёт 200 с корректным hero, `/v2` → 308 редирект на `/`.

**OCR end-to-end (финальный тест, PASS)** — сгенерирован скан-PDF с **0 символов текстового слоя** (растр), отправлен через job-API на прод:
- POST → `201`, job `fe9c0484-ff1f-4c89-8546-827338239042`
- Обработка → `done` за ~24 сек, `page_count=1`, 3 блока
- Скачан DOCX (38 КБ), извлечён текст: **«Тестовый документ»**, **«Проверка OCR распознавания текста 12345»**, **«Second line: OCR recognition test»** — всё распознано.
- Косметика: EasyOCR иногда читает латинское «OCR» как кириллические О+С в RU-контексте. На читаемость/редактируемость не влияет.

---

## 4. Что НЕ доделано — следующий шаг по каждой линии

| # | Линия | Состояние | Следующий шаг | Кто может сделать |
|---|---|---|---|---|
| 1 | **Railway биллинг** | ⚠️ `subscription past due`, инвойс **$32.95** не оплачен (карта — insufficient funds) | Оплатить / обновить карту. **Риск: отключение всех сервисов проекта** | Только владелец |
| 2 | **Stripe в проде** | `stripe_configured: false` на api и worker | Создать продукт «Docraft Pro» → Price ID → `STRIPE_PRO_PRICE_ID`; webhook `POST /billing/webhook` → `STRIPE_WEBHOOK_SECRET` | Только владелец (Stripe Dashboard) |
| 3 | **Supabase миграция** | `stripe_customer_id` не применена | `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;` в SQL Editor | Только владелец |
| 4 | **FAL_KEY** | `fal_configured: false` → AI-иллюстрации на проде не работают | Получить ключ на fal.ai → выставить `FAL_KEY` на Railway (api + worker) | Владелец даёт ключ, выставить может агент |
| 5 | **Профиль Claude** | По умолчанию `development` → генерация идёт на **Haiku, не Sonnet** | Решить: оставить (дёшево) или `CLAUDE_MODEL_PROFILE=premium` на Railway | Решение владельца |
| 6 | **Баги из аудита** | 🐛 Темы `academic-serif` и `premium` ссылаются на незарегистрированные шрифты (Georgia/Inter/Monaco — в `fonts.py` только Arial) → могут падать или рендериться неверно. 🐛 `image_block.py:79` читает `color.text_secondary`, а в темах путь `color.text.secondary` → подпись картинок всегда дефолтный серый | Воспроизвести обе темы на проде, починить `render_engine/fonts.py` и путь токена | Агент (задача GREEN/YELLOW) |
| 7 | **Volume для extract** | Не создан (CLI Railway падал с panic на `volume add`) | Создать volume на `/data` через дашборд — иначе ML-модели перекачиваются при каждом редеплое | Владелец (UI) или повтор через CLI |
| 8 | **Открытые вопросы аудита** | 15 пунктов + срочный блок | См. `docs/DISCOVERY-REPORT-2026-07.md`, раздел «Открытые вопросы / NOT FOUND» | Ответы владельца |

---

## 5. Конфликт-карта: какие файлы затронуты

**Оркестратору:** это файлы, которые уже изменены и влиты. Параллельные ветки, трогающие их же, получат конфликт.

### `apps/ai-playbook` (submodule) — диапазон `0005c1d..34b58a2`
```
apps/api/app/main.py                              ← +роутер compress
apps/api/app/routes/compress.py                   ← НОВЫЙ
apps/api/app/services/pdf_compress_service.py     ← НОВЫЙ
apps/web/app/pdf/compress/page.tsx                ← переписан (5 пресетов)
apps/web/app/pdf/convert/page.tsx                 ← НОВЫЙ (OCR job-polling)
apps/web/app/pdf/page.tsx                         ← +карточка в PDF Hub
apps/web/app/v2/design.css                        ← УДАЛЁН
apps/web/app/v2/layout.tsx                        ← УДАЛЁН
apps/web/app/v2/page.tsx                          ← УДАЛЁН
apps/web/components/v2/GenerateFormV2.tsx         ← УДАЛЁН
apps/web/lib/generation/constants.ts              ← убрана AB_COOKIE
apps/web/next.config.ts                           ← +редирект /v2 → /
apps/web/proxy.ts                                 ← вырезана вся A/B-логика
```

### `apps/magical-pdf` (submodule) — диапазон `cd2581e..5f32a2d`
```
extract/Dockerfile                                ← +libreoffice-writer, libreoffice-impress
```

### `apps/desktop-instructor`
Не затронут (ветка `master`, чисто).

### Корень `docraft`
```
.claude/launch.json                               ← +конфиг ai-playbook-api, autoPort
docs/DISCOVERY-REPORT-2026-07.md                  ← НОВЫЙ (аудит)
docs/HANDOFF-manual.md                            ← НОВЫЙ (этот файл)
apps/ai-playbook                                  ← указатель submodule → 34b58a2
apps/magical-pdf                                  ← указатель submodule → 5f32a2d
```

---

## 6. Состояние веток на момент передачи

| Репозиторий | Ветка | HEAD | Рабочее дерево |
|---|---|---|---|
| `apps/ai-playbook` | `main` | `34b58a2` | чисто |
| `apps/magical-pdf` | `main` | `5f32a2d` | чисто |
| `apps/desktop-instructor` | `master` | — | чисто |
| корень `docraft` | см. PR ниже | — | закоммичено в ветку |

Фича-ветки (`feat/compress-presets-remove-v2`, `feat/convert-scan-to-docx-pptx`, `feat/extract-libreoffice-railway-deploy`) влиты и больше не нужны — можно удалить.

Команды перепроверки:
```bash
cd /c/Projects/docraft
git submodule foreach 'git branch --show-current && git status --short'
cd apps/ai-playbook && gh pr list --state merged --limit 5
cd ../magical-pdf && gh pr list --state merged --limit 5
```

---

## 7. Решения и подводные камни (важно для Оркестратора)

1. **Прямой push в main заблокирован** auto-mode classifier'ом. Вся работа шла через фича-ветки + PR. Это ожидаемое поведение, не баг — планировать соответственно.

2. **Railway CLI (v5.12.1) НЕ применяет `railway.toml` / `railway.json` при `railway up`.** Билдер определяется только через дашборд или GraphQL API. Два деплоя упали (потрачено ~$6 на неудачные сборки), пока не выставили Root Directory `/extract` вручную в UI. Если Оркестратор будет деплоить новые сервисы через CLI — учитывать: **CLI-загрузка игнорирует конфиг-файлы**.

3. **Railway тарифицирует за время работы контейнера × RAM, а не за объём работы.** Даже упавшие билды стоят денег. Для extract-сервиса включён **Serverless (sleep on idle)** — платим только за реальные запросы. Первый запрос после сна = холодный старт (может занять до 1-3 мин, если модели не в кэше).

4. **RAM для extract нельзя опускать ниже 4GB** — по докам проекта «Less than 2GB often OOMs». При `restartPolicyType: ON_FAILURE` низкая RAM даст цикл OOM-рестартов, который сожжёт больше денег, чем один стабильный контейнер. Поэтому выставлены max restarts = 3.

5. **Vercel: `NEXT_PUBLIC_PDF_API_URL` существовала 19 дней со старым значением** (`127.0.0.1:8766`). Пришлось удалить и пересоздать — простое добавление даёт ошибку `branch_not_found`. Удаление прод-переменных требует явного разрешения владельца (auto-mode блокирует).

6. **Локальные git-ref'ы submodule могут быть устаревшими** после мержа PR на GitHub. Перед выводами делать `git fetch origin main` — иначе `origin/main` показывает состояние до мержа (наступили на это в этой сессии).

7. **CI (`ai-playbook-ci.yml`) чекаутит ВНЕШНИЙ репо `beaver20007/ai-playbook-generator`**, а не submodule внутри docraft. Требует секрет `GH_PAT` (репо приватный). Открытый вопрос: какой из двух — source of truth. См. аудит, п.8 открытых вопросов.

8. **Node/npm в окружении ломались** (`nvm use` без npm) — чинилось `nvm uninstall/install 24.18.0`. Если превью-сервер не стартует с `spawn npx ENOENT` — это оно.

9. **Консоль Windows в cp1251** калечит кириллицу в выводе Python. Для проверки текста писать в UTF-8 файл и читать инструментом, а не `print` в консоль.

10. **A/B-тест `design_v2_docraft_brand` полностью удалён** — если где-то в доках/планах он ещё числится живым, это устарело. PostHog в проекте **не подключён вообще**, событий не собирается (см. аудит, раздел G).

---

## 8. Ссылки

- Полный аудит проекта: `docs/DISCOVERY-REPORT-2026-07.md` (разделы A–M + 15 открытых вопросов)
- Ручные задачи проекта: `apps/ai-playbook/CLAUDE.md` → «Pending manual tasks»
- Правила деплоя extract: `apps/magical-pdf/docs/DEPLOY_EXTRACT.md`
