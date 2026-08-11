# DoCraft — дизайн-токены

Зафиксировано, чтобы дизайн не дрейфовал между сессиями. Два источника токенов
в проекте, **не сведены друг с другом** — использовать по назначению, не путать.

| | Система A — веб-бренд (`brand-v2`) | Система B — PDF-тема `premium` |
|---|---|---|
| Где живёт | `docraft-v2-package/docraft-v2/tokens/` (суперрепо, карантин) | `apps/ai-playbook/themes/premium/theme.json` (сабмодуль, прод) |
| Статус | Черновик ребрендинга сайта docraft.pro; **решение владельца: каннибализировать токены, не интегрировать целиком** (журнал ORCHESTRATOR) | Живая прод-тема рендер-движка, подтверждена генерацией на проде 2026-08-10 |
| Применяется к | Будущий веб/маркетинг (сайт, возможно Next.js UI) | Генерируемые PDF-документы (`stats_grid`, `table_renderer`, обложка и т.д.) |
| Основной акцент | Фиолетовый `#6B5CE7` | Зависит от палитры (`primary` темы, по умолчанию `#00A651`, оверлеится 7 палитрами) |

**Ноль автоматической синхронизации между A и B.** Правка одной не затрагивает другую.
Если в будущем их решат объединить — это отдельное архитектурное решение, не подразумевать неявно.

---

## Система A — веб-бренд (`brand-v2`)

Источник: [`docraft-v2-package/docraft-v2/tokens/design-tokens.css`](docraft-v2-package/docraft-v2/tokens/design-tokens.css)
+ [`tailwind.config.js`](docraft-v2-package/docraft-v2/tokens/tailwind.config.js) (тот же набор, зеркалом в Tailwind).
Комментарий в файле: «Версия B для A/B-тестирования, основа — логотип вариант #20».

### Палитра

| Токен | Значение | Назначение |
|---|---|---|
| `--dc-dark` | `#1A1A2E` | Основной тёмный |
| `--dc-dark-2` | `#252543` | Тёмный поверхностный |
| `--dc-dark-3` | `#2E2E52` | Тёмный бордер/hover |
| `--dc-violet` | `#6B5CE7` | **Основной акцент** |
| `--dc-violet-2` / `-3` | `#534AB7` / `#3C3489` | Hover / active |
| `--dc-violet-50` / `-100` | `#EEEDFE` / `#CECBF6` | Светлый фон / бордер акцента |
| `--dc-cyan` | `#00BFA5` | Вторичный акцент («AI-ready») |
| `--dc-cyan-2` / `-50` | `#0F6E56` / `#E1F5EE` | Hover / светлый фон |
| `--dc-orange` | `#F5A623` | Третичный акцент (CTA) |
| `--dc-orange-2` / `-50` | `#D08010` / `#FFF8EE` | Hover / светлый фон |

**Нейтралы:** фон `#F8F8FC`, поверхность `#FFFFFF`/`#F3F2F9`, текст `#1A1A2E`/`#4A4A6A`/`#888899`,
текст на тёмном `#FFFFFF`. Бордеры — `rgba(26,26,46, 0.10 / 0.18 / 0.30)`.

**Семантика:** success `#00BFA5`, warning `#F5A623`, error `#E24B4A`, info `#6B5CE7`.

**Тёмная тема** (`[data-theme="dark"]`): фон `#10101E`, поверхность `#1A1A2E`/`#252543`,
текст `#EEEEF8`/`#AAAACC`/`#666688`, бордеры `rgba(238,238,248, 0.08/0.14/0.22)`.

### Типографика

| Роль | Шрифты (fallback-цепочка) |
|---|---|
| Display (заголовки) | `Epilogue`, `Sora`, system-ui, sans-serif |
| Body (текст) | `DM Sans`, `Inter`, system-ui, sans-serif |
| Mono | `JetBrains Mono`, `Fira Code`, monospace |

Шкала кегля: `xs 10 / sm 12 / base 14 / md 16 / lg 20 / xl 24 / 2xl 30 / 3xl 38` (px).
Начертания: `normal 400 / medium 500 / semi 600 / bold 700 / black 800`.
Line-height: `tight 1.2 / normal 1.5 / loose 1.7`.

### Spacing / радиусы / прочее

Spacing (px): `1:4  2:8  3:12  4:16  5:20  6:24  8:32  10:40  12:48  16:64`.
Радиусы (px): `sm:4  md:8  lg:12  xl:16  full:9999`.
Transitions: `150ms ease` (обычный), `250ms ease` (медленный).
Focus-ring: `0 0 0 3px rgba(107,92,231,0.25)` (violet), аналог на cyan.

---

## Система B — PDF-тема `premium` (render-engine, прод)

Источник: [`apps/ai-playbook/themes/premium/theme.json`](apps/ai-playbook/themes/premium/theme.json).
Значения ниже — база темы **до** наложения палитры (см. раздел «Палитры» ниже).

### Цвет (база)

| Токен | Значение |
|---|---|
| `color.page` | `#FFFFFF` |
| `color.text.primary` / `.secondary` / `.muted` | `#1A1A1A` / `#404040` / `#656565` |
| `color.primary` | `#00A651` (зелёный — перекрывается палитрой) |
| `color.accent` | `#0066CC` (перекрывается палитрой) |
| `color.surface.default` / `.raised` / `.overlay` | `#F9F9F9` / `#FFFFFF` / `#F0F0F0` |
| `color.border.default` / `.subtle` | `#E0E0E0` / `#F0F0F0` |
| `color.status.success/warning/critical/info` | `#00C853` / `#FFC107` / `#FF3B30` / `#2196F3` |

### Типографика

Логические имена `typography.font_heading = "Inter-Bold"`, `font_body = "Inter"`,
`font_mono = "Monaco"` — резолвятся движком (`fonts-001`, влито `0bb0991`) в реальные
bundled-файлы: **Inter** (heading/body), **PT Serif** (слот `academic-serif`), **JetBrains
Mono** (слот mono — «Monaco» как логическое имя, физически JetBrains Mono; проприетарных
Arial/Georgia/Monaco/DejaVu в образе нет). Подтверждено на живом прод-PDF 2026-08-10.

Шкала кегля (pt): `h1:32  h2:24  h3:16  body:14  small:12  caption:11`.
Line-height: heading `1.4`, body `1.6`. Letter-spacing: heading `0`, body `0.3`.

⚠️ **`typography.scale.small = 12pt`** — это узел прошлой находки сессии (`render-001`/`render-002`,
2026-08-10): в узких KPI-карточках/таблицах 12pt (реальное значение темы, не баг) переполнял
фикс. ширину и рвал слова посимвольно, пока не были исправлены `stats_grid.py`/`table_renderer.py`
(ужатие кегля по метрике + запрет char-level переноса). При правке ширин компонентов — считать
вместимость **по этой шкале**, не по дефолтам кода.

### Spacing / радиусы

Spacing (px): `xs:8  sm:12  md:20  lg:32  xl:48`. Радиусы (px): `sm:4  md:8  lg:12`.

### Палитры (7 штук, оверлей на базовый `color.primary`/`color.accent`)

Источник: `apps/ai-playbook/apps/api/app/services/premium_palettes.py`.

| ID | primary | accent | Описание |
|---|---|---|---|
| `emerald` | (default) | — | базовая (см. `is_default`) |
| `sapphire` | `#1D4ED8` | `#0EA5E9` | «Глубокий синий. Корпоративная надёжность.» |
| `amethyst` | — | — | «Благородный фиолетовый. Премиальность, креатив.» |
| `graphite`, `bordeaux`, `bronze`, `teal` | — | — | см. файл-источник для точных hex |

Полный список и точные hex — читать файл-источник напрямую (не дублировать здесь построчно,
чтобы не разойтись с кодом); таблица выше — ориентир, не источник истины.

---

## Правило поддержания файла

При правке токена в любой из систем (`design-tokens.css` / `tailwind.config.js` /
`theme.json` / `premium_palettes.py`) — обновить соответствующий раздел здесь в том же PR.
Если это не сделано, файл считается устаревшим для той системы — не доверять слепо,
свериться с исходником перед use.
