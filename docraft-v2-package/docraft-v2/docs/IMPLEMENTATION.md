# DOCRAFT.pro — Руководство по внедрению v2
## Версия B для A/B-тестирования

---

## Структура пакета

```
docraft-v2/
├── tokens/
│   ├── design-tokens.css      ← CSS-переменные всего бренда
│   └── tailwind.config.js     ← Tailwind-расширение
├── components/
│   ├── logo-full.svg          ← Лого с текстом (navbar, хедер)
│   ├── logo-mark.svg          ← Иконка (favicon, avatar)
│   ├── logo-mark-inverse.svg  ← Иконка белая (тёмный фон)
│   └── components.css         ← Все UI-компоненты
├── themes/
│   └── pdf-themes.css         ← 3 темы для PDF-вывода
├── pages/
│   └── index.html             ← Готовая страница версии B
├── ab-test/
│   └── ab-config.js           ← Трекер + middleware + события
└── docs/
    ├── IMPLEMENTATION.md      ← этот файл
    ├── COMPONENTS.md          ← описание всех компонентов
    └── AB-RESULTS-TEMPLATE.md ← шаблон анализа результатов
```

---

## Быстрый старт (Next.js)

### 1. Копировать файлы в проект

```bash
# Из корня проекта
cp -r docraft-v2/tokens ./public/design/
cp -r docraft-v2/components ./public/design/
cp docraft-v2/pages/index.html ./src/app/v2/page.html
```

### 2. Подключить CSS-токены в globals.css

```css
/* app/globals.css */
@import '../public/design/tokens/design-tokens.css';
@import '../public/design/components/components.css';

/* Шрифты */
@import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
```

### 3. Добавить middleware для роутинга варианта B

```typescript
// middleware.ts (в корне проекта)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE = 'ab_design_v2_docraft_brand';

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname !== '/') return NextResponse.next();

  let variant = req.cookies.get(COOKIE)?.value;
  if (!variant) variant = Math.random() < 0.5 ? 'A' : 'B';

  const res = variant === 'B'
    ? NextResponse.rewrite(new URL('/v2', req.url))
    : NextResponse.next();

  res.cookies.set(COOKIE, variant, { maxAge: 2592000, sameSite: 'lax' });
  res.headers.set('x-ab-variant', variant);
  return res;
}

export const config = { matcher: ['/'] };
```

### 4. Создать маршрут /v2

```bash
# App Router
mkdir -p src/app/v2
cp docraft-v2/pages/index.html src/app/v2/page.tsx
```

Или как React-компонент (рекомендовано):

```tsx
// src/app/v2/page.tsx
import DocraftV2Page from '@/components/docraft-v2/MainPage';
export default function V2Page() {
  return <DocraftV2Page />;
}
```

---

## Интеграция трекинга

### PostHog (рекомендовано)

```typescript
// lib/ab-tracker.ts
import DocraftABTracker, { trackEvents } from '../docraft-v2/ab-test/ab-config';

let tracker: DocraftABTracker | null = null;

export function getTracker() {
  if (typeof window === 'undefined') return null;
  if (!tracker) tracker = new DocraftABTracker();
  return tracker;
}

// В компоненте страницы:
const tracker = getTracker();
tracker?.track('page_view');

// При клике генерации:
trackEvents.generateClicked(tracker, {
  template: selectedTemplate,
  theme: selectedTheme,
  language: selectedLang,
  ai_illustrations: aiEnabled,
});
```

### Собственный API endpoint

```typescript
// app/api/ab-track/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const payload = await req.json();
  // Записать в базу / отправить в аналитику
  await db.abEvents.create({ data: payload });
  return NextResponse.json({ ok: true });
}
```

---

## Замена тем оформления в PDF-генераторе

Добавить переменную темы в вызов PDF-генератора:

```python
# Python / ReportLab
THEME_COLORS = {
    'docraft-light': {
        'bg':           '#F8F8FC',
        'surface':      '#FFFFFF',
        'cover_bg':     '#1A1A2E',
        'accent':       '#6B5CE7',
        'accent_2':     '#00BFA5',
        'accent_3':     '#F5A623',
        'h1':           '#1A1A2E',
        'h3':           '#6B5CE7',
        'body':         '#2A2A3E',
        'muted':        '#888899',
        'table_header': '#1A1A2E',
        'table_htext':  '#FFFFFF',
    },
    'docraft-dark': {
        'bg':           '#10101E',
        'surface':      '#1A1A2E',
        'cover_bg':     '#0D0D1A',
        'accent':       '#6B5CE7',
        'accent_2':     '#00BFA5',
        'accent_3':     '#F5A623',
        'h1':           '#EEEEF8',
        'h3':           '#6B5CE7',
        'body':         '#AAAACC',
        'muted':        '#666688',
        'table_header': '#252543',
        'table_htext':  '#EEEEF8',
    },
    'docraft-violet': {
        'bg':           '#F0EDFF',
        'surface':      '#FFFFFF',
        'cover_bg':     '#6B5CE7',
        'accent':       '#6B5CE7',
        'accent_2':     '#00BFA5',
        'accent_3':     '#F5A623',
        'h1':           '#1A1A2E',
        'h3':           '#6B5CE7',
        'body':         '#2A2A3E',
        'muted':        '#7777AA',
        'table_header': '#6B5CE7',
        'table_htext':  '#FFFFFF',
    },
}

def get_theme(theme_id: str) -> dict:
    return THEME_COLORS.get(theme_id, THEME_COLORS['docraft-light'])
```

---

## Критерии завершения A/B-теста

| Критерий              | Значение                        |
|-----------------------|---------------------------------|
| Минимум участников    | 500 на вариант (1000 суммарно)  |
| Уровень значимости    | p < 0.05                        |
| Статистическая мощность | 80%                           |
| MDE                   | 5% разница в конверсии          |
| Ожидаемая длительность | 2 недели                       |

### Остановить тест досрочно если:
- Конверсия B хуже A на > 15% (остановка по потере)
- Накоплено 2000+ пользователей в каждом варианте

### Победитель если:
- p-value < 0.05 по первичной метрике `generate_click_rate`
- Нет значимых потерь по вторичным метрикам

---

## Контакты

Проект: AI Playbook Generator  
Дизайн-система: DOCRAFT.pro v2  
Лого-вариант: #20 (D-форма + циановый бейдж)  
Файлы брендбука: `/docraft-v2/components/logo-*.svg`
