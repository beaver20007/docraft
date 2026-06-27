# DOCRAFT.pro v2 — Справочник компонентов

## Использование

Подключить в HTML:
```html
<link rel="stylesheet" href="/design/tokens/design-tokens.css" />
<link rel="stylesheet" href="/design/components/components.css" />
```

---

## Navbar

```html
<nav class="dc-navbar">
  <a href="/" class="dc-navbar__logo">
    <img src="/design/components/logo-mark-inverse.svg" width="32" height="32" alt="DOCRAFT" />
    <div>
      <div class="dc-navbar__brand">DOCRAFT<span class="dc-navbar__brand--accent">.pro</span></div>
      <div class="dc-navbar__tagline">AI-POWERED DOCUMENTS</div>
    </div>
  </a>
  <div class="dc-navbar__actions">
    <a href="/auth" class="dc-btn dc-btn--nav">Войти</a>
    <a href="/admin" class="dc-btn dc-btn--violet">Admin →</a>
  </div>
</nav>
```

---

## Кнопки

```html
<!-- Основная (тёмная) -->
<button class="dc-btn dc-btn--primary">Действие</button>

<!-- Виолетовая -->
<button class="dc-btn dc-btn--violet">Акцентная</button>

<!-- Ghost -->
<button class="dc-btn dc-btn--ghost">Второстепенная</button>

<!-- Nav (для тёмного navbar) -->
<button class="dc-btn dc-btn--nav">Войти</button>

<!-- Большая CTA на всю ширину -->
<button class="dc-btn dc-btn--primary dc-btn--lg">Сгенерировать</button>
```

---

## Карточки

```html
<!-- Стандартная (белая) -->
<div class="dc-card">Контент</div>

<!-- Плоская (на фоне bg) -->
<div class="dc-card dc-card--flat">Контент</div>

<!-- Виолетовая (акцентная) -->
<div class="dc-card dc-card--violet">Контент</div>
```

---

## Секционный заголовок

```html
<p class="dc-section-label">Тема документа</p>
```

---

## Поля ввода

```html
<input type="text" class="dc-input" placeholder="Введите тему…" />
<textarea class="dc-textarea" rows="3" placeholder="Опишите подробнее…"></textarea>
```

---

## Сегментированный контроль

```html
<div class="dc-seg" data-seg="tone">
  <button class="dc-seg__btn is-active" data-val="practical">Практичный</button>
  <button class="dc-seg__btn" data-val="formal">Формальный</button>
  <button class="dc-seg__btn" data-val="friendly">Дружелюбный</button>
</div>
```

JS-активация (уже в index.html, для переиспользования):
```js
document.querySelectorAll('.dc-seg').forEach(seg => {
  seg.querySelectorAll('.dc-seg__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      seg.querySelectorAll('.dc-seg__btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });
});
```

---

## Карточка шаблона

```html
<div class="dc-tpl is-active" data-tpl="playbook">
  <i class="ti ti-book dc-tpl__icon" style="color:#6B5CE7;"></i>
  <div class="dc-tpl__name">Playbook</div>
  <div class="dc-tpl__desc">Операционные руководства</div>
  <span class="dc-tpl__badge">Популярный</span>
</div>
```

---

## Карточка темы оформления

```html
<div class="dc-theme is-active" data-theme-id="docraft-light">
  <div class="dc-theme__preview dc-theme__preview--light">
    <!-- SVG превью -->
  </div>
  <div class="dc-theme__check">✓</div>
  <div class="dc-theme__name">DOCRAFT Light</div>
  <div class="dc-theme__desc">Светлый фирменный</div>
</div>
```

Варианты превью: `dc-theme__preview--light`, `--dark`, `--violet`

---

## Чипы-примеры

```html
<div class="dc-grid-auto">
  <span class="dc-chip">Удалённая разработка</span>
  <span class="dc-chip">Customer Success</span>
</div>
```

---

## Зона загрузки файла

```html
<div class="dc-upload" id="upload-zone">
  <div class="dc-upload__icon"><i class="ti ti-upload"></i></div>
  <div class="dc-upload__text">
    <strong>Перетащи файл</strong> или нажми для выбора
  </div>
  <div class="dc-upload__text">PDF, Word, Excel · до 50 МБ</div>
</div>
```

---

## AI-строка с тогглом

```html
<div class="dc-ai-row">
  <div class="dc-ai-row__left">
    <div class="dc-ai-row__icon">
      <i class="ti ti-sparkles" style="color:white; font-size:14px;"></i>
    </div>
    <div>
      <div class="dc-ai-row__title">AI-иллюстрации</div>
      <div class="dc-ai-row__sub">GPT Image 2 · проверка промптов</div>
    </div>
  </div>
  <label class="dc-toggle">
    <input type="checkbox" checked />
    <span class="dc-toggle__track"></span>
  </label>
</div>
```

---

## Прогресс-бар

```html
<div class="dc-progress">
  <div class="dc-progress__bar" style="width:35%;"></div>
</div>
```

---

## Бейджи

```html
<!-- Виолетовый с точкой (статус активности) -->
<span class="dc-badge dc-badge--violet dc-badge--dot">
  PLAYBOOK GENERATOR · GPT-4o
</span>

<!-- Циановый -->
<span class="dc-badge dc-badge--cyan">AI Ready</span>
```

---

## Hero-секция

```html
<section class="dc-hero">
  <div style="max-width:720px; margin:0 auto;">
    <span class="dc-badge dc-badge--violet dc-badge--dot" style="margin-bottom:16px;">
      AI DOCUMENTS
    </span>
    <h1 class="dc-hero__title">
      Заголовок страницы<br>
      <span class="dc-hero__title--accent">с акцентом</span>
    </h1>
    <p class="dc-hero__sub">Подзаголовок с описанием</p>
  </div>
</section>
```

---

## Подсказка / Hint

```html
<div class="dc-hint">
  Цель: 3–4 модуля · ~6–10 стр.
</div>
```

---

## Сетки

```html
<div class="dc-grid-2">  <!-- 2 колонки --></div>
<div class="dc-grid-3">  <!-- 3 колонки --></div>
<div class="dc-grid-auto"><!-- flex-wrap для чипов --></div>
```

---

## CSS-переменные — быстрая шпаргалка

| Переменная         | Значение    | Применение             |
|--------------------|-------------|------------------------|
| `--dc-dark`        | `#1A1A2E`   | Navbar, CTA, заголовки |
| `--dc-violet`      | `#6B5CE7`   | Основной акцент        |
| `--dc-cyan`        | `#00BFA5`   | AI-ready, бейдж лого   |
| `--dc-orange`      | `#F5A623`   | Предупреждения, CTAs   |
| `--dc-bg`          | `#F8F8FC`   | Фон страницы           |
| `--dc-surface`     | `#FFFFFF`   | Фон карточек           |
| `--dc-text`        | `#1A1A2E`   | Основной текст         |
| `--dc-text-3`      | `#888899`   | Placeholder, muted     |
| `--dc-border`      | `rgba…0.10` | Слабые бордеры         |
