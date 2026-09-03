# H1 — Stripe в проде: чек-лист для владельца

**Дата:** 2026-09-03 (сессия-4, ночной прогон)
**Статус:** ⏳ **подготовка, ничего не выполнено.** В Stripe Dashboard Оркестратором
**не создано и не изменено ничего** — по протоколу платёжный шлюз вне его полномочий,
и брифом это отдельно запрещено.

Всё ниже выведено **из кода**, а не из общих представлений о Stripe: имена переменных,
режим оплаты и список событий вебхука взяты из реализации, ссылки на строки приложены.

---

## Порядок действий (зависимости важны)

### Шаг 0 (ПРЕДВАРИТЕЛЬНО) — применить миграцию H2

Биллинг пишет `stripe_customer_id` в `user_profiles`. Пока колонки нет, вебхук будет
падать на записи. Миграция уже написана:
`apps/ai-playbook/supabase/migrations/20260612_stripe_customer_id.sql`

Подробности и почему Оркестратор её не применил — см. H2/H22 в `docs/ORCHESTRATOR.md`.

---

### Шаг 1 — создать продукт и цену в Stripe Dashboard

**Куда:** Stripe Dashboard → **Product catalog** → **Add product**

| Поле | Значение | Откуда требование |
|---|---|---|
| Name | `Docraft Pro` | H1 в ORCHESTRATOR.md |
| Pricing model | **Recurring** (подписка) | код жёстко шлёт `"mode": "subscription"` — `stripe_service.py:90` |
| Billing period | месяц (Pro monthly) | комментарий в `config.py:75`: «Stripe Price ID for Pro monthly subscription» |
| Currency / сумма | **решение владельца** — в коде цены нет и быть не должно | H7, вопрос 13 |

**Что забрать:** после создания — **Price ID** (вид `price_…`, не `prod_…`).
Код подставляет его в `line_items` напрямую: `stripe_service.py:91`
`"line_items": [{"price": settings.stripe_pro_price_id, "quantity": 1}]`.

> ⚠️ Частая ошибка: скопировать Product ID (`prod_…`). Нужен именно **Price ID** (`price_…`).

---

### Шаг 2 — зарегистрировать вебхук

**Куда:** Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**

**Endpoint URL** (домен взят из Railway, `railway status --json`, сервис api):

```
https://ai-playbook-generator-production.up.railway.app/billing/webhook
```

**События подписки — ровно эти четыре**, остальные код игнорирует
(`stripe_service.py:133-142`):

| Событие | Что делает код |
|---|---|
| `checkout.session.completed` | привязывает оплату к пользователю по `metadata.user_id` |
| `customer.subscription.created` | ставит план Pro |
| `customer.subscription.updated` | обновляет план |
| `customer.subscription.deleted` | снимает Pro |

**Что забрать:** **Signing secret** эндпоинта (вид `whsec_…`) — код проверяет подпись,
без него вебхук будет отклоняться.

---

### Шаг 3 — выставить переменные окружения в Railway

**Куда:** Railway → проект `docraft` → **оба** сервиса, тянущих код `ai-playbook-generator`:
- `ai-playbook-generator` (api) — обязательно, здесь живут `/billing/*`;
- `confident-vibrancy` (worker) — для единообразия конфигурации.

Имена переменных — точно как в коде (`config.py:72-77`):

| Переменная | Значение | Обязательна |
|---|---|---|
| `STRIPE_SECRET_KEY` | секретный ключ аккаунта (`sk_live_…`) | да |
| `STRIPE_PRO_PRICE_ID` | Price ID из шага 1 (`price_…`) | да |
| `STRIPE_WEBHOOK_SECRET` | signing secret из шага 2 (`whsec_…`) | да |
| `STRIPE_SUCCESS_URL` | куда вернуть после оплаты, например `https://ai-playbook-generator.vercel.app/?upgraded=1` | да |
| `STRIPE_CANCEL_URL` | куда вернуть при отмене, например `https://ai-playbook-generator.vercel.app/` | да |

Примеры URL в `config.py:76-77` указывают на `app.docraft.pro` — но домен `docraft.pro`
намеренно **не подключён** (раздел 8 ORCHESTRATOR.md, pre-launch). До подключения домена
используйте живой Vercel-адрес, иначе после оплаты пользователя выкинет в никуда.

> Выставление переменных в Railway — **действие владельца**. Технически это может сделать
> агент, но значения являются секретами: Оркестратор их не запрашивает, не принимает в чат
> и не хранит.

---

### Шаг 4 — проверка фактом (после шагов 1-3)

Порядок проверки, каждый пункт даёт наблюдаемый признак:

1. **Конфигурация подхватилась:** `GET /health` на api-сервисе → в ответе
   `stripe_configured` должен стать `true` (сейчас `false`, раздел 8 ORCHESTRATOR.md).
2. **Checkout создаётся:** авторизованный `POST /billing/checkout` → возвращает `{url}`
   на `checkout.stripe.com`. Требует валидной сессии — маршрут защищён `RequiredUser`
   (`billing.py:26`), анонимно не проверить.
3. **Вебхук доходит:** Stripe Dashboard → Webhooks → эндпоинт → вкладка событий:
   после тестовой оплаты должен быть ответ **200**, не 400 (400 = не сошлась подпись,
   значит `STRIPE_WEBHOOK_SECRET` не тот).
4. **План записался:** в Supabase у пользователя в `user_profiles` появились
   `stripe_customer_id` и план Pro. Без шага 0 этот пункт провалится.

---

## Чего Оркестратор НЕ делал (явно)

- не заходил в Stripe Dashboard;
- не создавал продукт, цену, вебхук;
- не выставлял переменные в Railway (Railway использовался только на чтение —
  `railway status --json`, чтобы взять домен api-сервиса);
- не запрашивал и не хранил ни одного секрета.

Проверяется по git: в истории ветки ноль изменений кода биллинга и ноль конфигураций.
