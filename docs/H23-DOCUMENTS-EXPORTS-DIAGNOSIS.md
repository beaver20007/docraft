# H23 — диагностика: `documents`/`exports` не в проде

**Дата:** 2026-09-05 (сессия-5)
**Статус:** ⏳ **диагностика завершена, применение — за владельцем.** Ничего к прод-БД
не применял (см. H22 — доступа нет, и это правило, а не техническое ограничение).

---

## Приёмка-фактом

### 1. Точные места в коде

**Чтение (квота Free):**
```
apps/api/app/services/billing_service.py:124
    f"{_rest_base()}/exports"   -- PostgREST-запрос к таблице "exports"
    params: user_id=eq.<uuid>, status=eq.completed, created_at=gte.<месяц>, select=id
```

**Запись (в момент завершения генерации):**
```
apps/api/app/services/supabase_service.py:37    POST {rest_base}/documents  (save_document)
apps/api/app/services/supabase_service.py:76    POST {rest_base}/exports    (save_export)
apps/api/app/services/supabase_service.py:107   GET  {rest_base}/exports    (get_user_exports, не вызывается ни из одного роута — мёртвый путь на сегодня)
```

**Вызывается из воркера** (не мёртвый код — это активный путь на каждой генерации):
```
apps/api/app/tasks/generate_task.py:214-215   save_document(...)
apps/api/app/tasks/generate_task.py:337-344   save_export(..., status="completed", ...)
```

`status="completed"` пишется буквально той же строкой, которую фильтрует
`count_exports_this_month` (`status=eq.completed`) — контракт между писателем и читателем
совпадает дословно, не по предположению.

**Важная деталь:** `save_export` вызывается только `if user_id:` (`generate_task.py:335`) —
анонимные генерации (free-tier без входа, H17/раздел 18) в `exports` не попадают вовсе.
Это согласуется с архитектурой: квота считается только для аутентифицированных пользователей.

### 2. Готовой отдельной миграции — **нет**. Но SQL уже написан и подтверждён кодом

```
apps/ai-playbook/supabase/migrations/
├── 20250604_user_profiles.sql       -- только user_profiles (применена, H2)
└── 20260612_stripe_customer_id.sql  -- только колонка (применена, H2)
```

Отдельного `NNNNNN_documents_exports.sql` в `migrations/` **нет**.

Но это **не** случай «работа забыта и нужно писать с нуля» (вариант 3 брифа). Определения
`documents`/`exports` уже существуют дословно в `apps/ai-playbook/supabase/schema.sql`
(3955 байт, комментарий в шапке: `-- Run this in Supabase SQL Editor`) — файл, отдельный
от неверного черновика `apps/ai-playbook/docs/supabase-schema.sql` (3701 байт, тот самый,
что был по ошибке применён к проду и создал `profiles` вместо `user_profiles`, см. H2).

**Проверено построчно: колонки в `schema.sql` совпадают с тем, что шлёт код, без единого
расхождения:**

| Таблица | Колонки в `schema.sql` | Колонки, которые пишет код |
|---|---|---|
| `documents` | `id, user_id, title, prompt, document_type, document_ir, created_at, updated_at` | `save_document`: `id, user_id, title, prompt, document_type, document_ir` — подмножество, остальное — дефолты |
| `exports` | `id, document_id, user_id, theme_id, status, page_count, model, input_tokens, output_tokens, created_at` | `save_export`: те же 9 полей один в один |

FK `exports.document_id → documents(id)` также используется кодом: `get_user_exports`
запрашивает вложенный ресурс `documents(title,prompt)` через этот же PostgREST-синтаксис
embed — то есть связь в схеме и связь, которую ожидает код, — одна и та же.

**Вывод по пункту 2: не «забытая работа» и не «переименовать код» — это «SQL существует,
но никогда не был выделен в отдельную миграцию и не применён».**

### 3. Прод-БД — **не проверено мной, доступа нет**

Как и в H22: `supabase projects list` → `Access token not provided` (перепроверено в этой
сессии заново, на случай что что-то изменилось — не изменилось). `pg_dump`/`psql` на машине
по-прежнему отсутствуют. Я не заявляю о состоянии прод-БД то, что не проверил сам.

**Нужно от владельца перед применением** — та же команда, что нашла `profiles` вместо
`user_profiles`:
```sql
select table_name from information_schema.tables where table_schema = 'public';
```
Если в списке уже есть `documents`/`exports` под этими именами — **не применять**, а
показать мне схему найденных таблиц (я сверю колонки, как делал по `profiles`). Если их
нет вовсе (наиболее вероятный сценарий, раз для них никогда не было incremental-миграции) —
применять SQL из раздела «Что применять» ниже.

### 4. Вывод

**Не вариант 1** (готовая миграция, бери и применяй как файл) — файла с именем миграции
нет. **Не вариант 3 в чистом виде** (миграции нет вовсе, нужно решение, что там должно
быть) — структура уже полностью определена и на 100% подтверждена совпадением с кодом,
гадать не нужно. Это промежуточный, третий случай: **SQL существует и верифицирован, но
никогда не был оформлен как применяемая миграция.**

---

## Что применять (после проверки прод-БД по пункту 3, если таблиц там нет)

Ниже — **дословный** блок `documents`+`exports` из `apps/ai-playbook/supabase/schema.sql`
(строки 6-70), **без изменений**. Секция `user_profiles` из конца того же файла (строки
72-89) **намеренно не включена** — она уже применена миграцией `20250604_user_profiles.sql`,
и повторный прогон `create policy` (в отличие от `create table if not exists`) **упадёт с
ошибкой «policy already exists»**, потому что `CREATE POLICY` не поддерживает `IF NOT
EXISTS`. Не запускайте `schema.sql` целиком — только блок ниже.

```sql
-- ── Documents ────────────────────────────────────────────────
create table if not exists documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null default 'Untitled',
  prompt        text not null default '',
  document_type text not null default 'playbook',
  document_ir   jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table documents enable row level security;

create policy "Users can view their own documents"
  on documents for select using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on documents for insert with check (auth.uid() = user_id);

create policy "Service role bypasses RLS"
  on documents for all using (true) with check (true);


-- ── Exports ──────────────────────────────────────────────────
create table if not exists exports (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid references documents(id) on delete set null,
  user_id        uuid not null references auth.users(id) on delete cascade,
  theme_id       text not null default 'minimal-light',
  status         text not null default 'pending',
  page_count     integer,
  model          text,
  input_tokens   integer,
  output_tokens  integer,
  created_at     timestamptz not null default now()
);

alter table exports enable row level security;

create policy "Users can view their own exports"
  on exports for select using (auth.uid() = user_id);

create policy "Users can insert their own exports"
  on exports for insert with check (auth.uid() = user_id);

create policy "Service role bypasses RLS on exports"
  on exports for all using (true) with check (true);


-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_documents_user_id on documents(user_id);
create index if not exists idx_exports_user_id   on exports(user_id);
create index if not exists idx_exports_doc_id    on exports(document_id);


-- ── Privileges (required for API Worker + logged-in History) ─
grant all on table public.documents to service_role;
grant all on table public.exports to service_role;

grant select, insert, update on table public.documents to authenticated;
grant select, insert, update on table public.exports to authenticated;
```

### Что проверить «до» (шаг 1c выше, обязательно первым)

```sql
select table_name from information_schema.tables where table_schema = 'public';
```
Ожидание: `documents` и `exports` в списке отсутствуют (наравне с уже подтверждённым
`user_profiles`, который там есть).

### Что проверить «после»

```sql
select count(*) from documents;   -- ожидание: 0 (таблица только создана)
select count(*) from exports;     -- ожидание: 0
select column_name, data_type from information_schema.columns
  where table_name = 'documents' order by ordinal_position;
select column_name, data_type from information_schema.columns
  where table_name = 'exports' order by ordinal_position;
```
Ожидание по колонкам — ровно список из таблицы сопоставления в пункте 2 выше.

### Снапшот

Как и в H22 — Supabase free-tier автобэкапов не делает. Если решите применять,
предварительно экспортируйте текущее состояние (в данном случае это `CREATE TABLE`,
а не `ALTER` существующей таблицы с данными — риск ниже, чем был у H2, но привычка
снимать снапшот перед любой записью в прод-схему не меняется).

---

## Что это значит для H1 (Stripe) — не меняется относительно раздела 18

После применения этого блока `count_exports_this_month` начнёт видеть реальные строки,
`can_generate` начнёт реально ограничивать Free-план — квота заработает. До этого момента
включать Stripe по-прежнему не имеет смысла (Pro не отличается от Free по объёму).
