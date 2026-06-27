/**
 * DOCRAFT.pro — A/B Test Configuration
 * Версия B: DOCRAFT Brand Design
 * Версия A: текущий дизайн (контроль)
 *
 * Интеграция: Vercel Edge Config / PostHog / самописный роутер
 */

// ─────────────────────────────────────────────────────────────
// КОНФИГУРАЦИЯ ЭКСПЕРИМЕНТА
// ─────────────────────────────────────────────────────────────

export const AB_EXPERIMENT = {
  id:          'design_v2_docraft_brand',
  name:        'DOCRAFT Brand Design v2',
  description: 'Сравнение текущего дизайна (A) с брендовым редизайном DOCRAFT (B)',
  startDate:   '2025-Q2',
  hypothesis:  'Брендовый дизайн с чёткой идентификацией повысит конверсию в генерацию документов',

  variants: {
    control: {
      id:     'A',
      name:   'Current Design',
      weight: 0.5,       // 50% трафика
      path:   '/',       // текущий index страницы
    },
    treatment: {
      id:     'B',
      name:   'DOCRAFT Brand v2',
      weight: 0.5,       // 50% трафика
      path:   '/v2',     // новая страница
    },
  },

  /** Первичная метрика */
  primaryMetric: {
    name:        'generate_click_rate',
    description: 'Доля пользователей, нажавших «Сгенерировать документ»',
    goal:        'increase',
    minDetectableEffect: 0.05,   // MDE 5%
  },

  /** Вторичные метрики */
  secondaryMetrics: [
    { name: 'template_selection_rate',   description: 'Переключение шаблона (не default)' },
    { name: 'theme_selection_rate',      description: 'Выбор темы оформления' },
    { name: 'file_upload_rate',          description: 'Загрузка контекстного файла' },
    { name: 'ai_illustrations_toggle',   description: 'AI-иллюстрации включены при генерации' },
    { name: 'time_to_generate',          description: 'Время от захода до клика генерации (сек)' },
    { name: 'return_visit_rate',         description: 'Повторный визит в течение 7 дней' },
  ],

  sampleSize: {
    perVariant:       500,       // минимум пользователей на вариант
    significance:     0.95,      // p < 0.05
    power:            0.80,
    estimatedDuration: '2 недели при текущем трафике',
  },
};

// ─────────────────────────────────────────────────────────────
// КЛИЕНТСКИЙ ТРЕКЕР (vanilla JS / Next.js compatible)
// ─────────────────────────────────────────────────────────────

class DocraftABTracker {
  constructor() {
    this.experimentId = AB_EXPERIMENT.id;
    this.variant = this._assignVariant();
    this._init();
  }

  /** Назначить вариант детерминировано по userId / sessionId */
  _assignVariant() {
    const stored = localStorage.getItem(`ab_${this.experimentId}`);
    if (stored) return stored;

    const userId = this._getUserId();
    const hash   = this._hash(this.experimentId + userId);
    const variant = hash % 2 === 0 ? 'A' : 'B';

    localStorage.setItem(`ab_${this.experimentId}`, variant);
    return variant;
  }

  _getUserId() {
    let uid = localStorage.getItem('dc_uid');
    if (!uid) {
      uid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('dc_uid', uid);
    }
    return uid;
  }

  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  _init() {
    /* Назначить data-атрибут на body для CSS-таргетинга */
    document.documentElement.dataset.abVariant = this.variant;

    /* Перенаправить версию B на /v2 если нужно */
    if (this.variant === 'B' && window.location.pathname === '/') {
      history.replaceState(null, '', '/v2' + window.location.search);
    }

    this.track('experiment_assigned', { variant: this.variant });
  }

  /** Отправить событие */
  track(event, props = {}) {
    const payload = {
      experiment: this.experimentId,
      variant:    this.variant,
      event,
      timestamp:  new Date().toISOString(),
      url:        window.location.href,
      userId:     this._getUserId(),
      ...props,
    };

    /* PostHog */
    if (window.posthog) {
      window.posthog.capture(event, payload);
    }

    /* Vercel Analytics */
    if (window.va) {
      window.va('event', { name: event, data: payload });
    }

    /* Fallback: собственный endpoint */
    navigator.sendBeacon('/api/ab-track', JSON.stringify(payload));

    if (process.env.NODE_ENV !== 'production') {
      console.log('[AB]', event, payload);
    }
  }

  /** Утилиты для страниц */
  isVariantB() { return this.variant === 'B'; }
  getVariant()  { return this.variant; }
}

// ─────────────────────────────────────────────────────────────
// СОБЫТИЯ ДЛЯ ОТСЛЕЖИВАНИЯ (вызывать из index.html)
// ─────────────────────────────────────────────────────────────

export const trackEvents = {
  /** Страница загружена */
  pageView: (tracker) =>
    tracker.track('page_view'),

  /** Пользователь ввёл тему */
  topicEntered: (tracker, chars) =>
    tracker.track('topic_entered', { char_count: chars }),

  /** Выбор шаблона */
  templateSelected: (tracker, tplId) =>
    tracker.track('template_selected', { template: tplId }),

  /** Изменение параметров */
  paramChanged: (tracker, param, val) =>
    tracker.track('param_changed', { param, value: val }),

  /** Выбор темы оформления */
  themeSelected: (tracker, themeId) =>
    tracker.track('theme_selected', { theme: themeId }),

  /** Загрузка файла */
  fileUploaded: (tracker, fileType, fileSizeKB) =>
    tracker.track('file_uploaded', { file_type: fileType, size_kb: fileSizeKB }),

  /** Клик «Сгенерировать» */
  generateClicked: (tracker, params) =>
    tracker.track('generate_clicked', params),

  /** Документ сгенерирован */
  documentGenerated: (tracker, durationMs) =>
    tracker.track('document_generated', { duration_ms: durationMs }),

  /** Скачивание PDF */
  pdfDownloaded: (tracker) =>
    tracker.track('pdf_downloaded'),
};

// ─────────────────────────────────────────────────────────────
// VERCEL EDGE MIDDLEWARE (для серверного роутинга варианта B)
// Файл: /middleware.ts
// ─────────────────────────────────────────────────────────────

export const MIDDLEWARE_SNIPPET = `
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EXPERIMENT_ID = '${AB_EXPERIMENT.id}';
const COOKIE_NAME   = \`ab_\${EXPERIMENT_ID}\`;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Только главная страница
  if (pathname !== '/') return NextResponse.next();

  let variant = req.cookies.get(COOKIE_NAME)?.value;

  if (!variant) {
    variant = Math.random() < 0.5 ? 'A' : 'B';
  }

  const res = variant === 'B'
    ? NextResponse.rewrite(new URL('/v2', req.url))
    : NextResponse.next();

  res.cookies.set(COOKIE_NAME, variant, {
    maxAge: 60 * 60 * 24 * 30,  // 30 дней
    sameSite: 'lax',
    httpOnly: false,
  });

  res.headers.set('x-ab-variant', variant);
  return res;
}

export const config = { matcher: ['/'] };
`;

export default DocraftABTracker;
