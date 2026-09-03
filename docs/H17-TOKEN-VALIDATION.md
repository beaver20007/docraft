# H17 — Валидирует ли бэкенд сессионный токен из `authHeaders.ts`

**Статус:** ✅ ЗАКРЫТО фактом (2026-09-03, сессия-4). **Дыры нет, чинить нечего.**
**Происхождение вопроса:** остаток от `web-001` / раздела 13 ORCHESTRATOR.md — при оценке
радиуса `E2E_SKIP_AUTH` (H16) Оркестратор честно пометил: «шлёт токен в backend API —
**если** FastAPI его проверяет, данные защищены независимо от proxy. **Не проверял —
не утверждаю**». Здесь этот пробел закрыт.

---

## Вопрос

Фронт кладёт Supabase-токен в заголовок (`apps/web/lib/generation/authHeaders.ts`):

```ts
const { data: { session } } = await supabase.auth.getSession();
if (session?.access_token) {
  headers.Authorization = `Bearer ${session.access_token}`;
}
```

Проверяет ли его бэкенд по-настоящему — или принимает на веру (декодирует без проверки
подписи, доверяет `sub`)? От этого зависит, защищены ли данные за API, когда сетевой
перехватчик `proxy.ts` пропускает запрос.

## Ответ фактом: да, валидирует — на стороне Supabase

`apps/api/app/services/auth_service.py:44-58` — токен **не декодируется локально**, он
предъявляется эмитенту:

```python
async with httpx.AsyncClient() as client:
    resp = await client.get(
        f"{settings.supabase_url}/auth/v1/user",
        headers={"Authorization": f"Bearer {token}", "apikey": settings.supabase_anon_key},
        timeout=10,
    )

if resp.status_code != 200:
    raise HTTPException(status_code=401, detail="Invalid or expired token", ...)
```

Ключевое: подпись/срок проверяет сам Supabase (`/auth/v1/user` отвечает 200 только на
валидный непросроченный токен). Локального `jwt.decode(..., verify=False)` в коде нет —
подделать `sub` и получить чужой аккаунт нельзя.

## Куда это подключено

| Зависимость | Поведение при плохом токене | Где используется |
|---|---|---|
| `CurrentUser` / `RequiredUser` | **401** | `billing.py:26` checkout, `billing.py:38` portal — денежные пути |
| `OptionalUser` | **`None` → аноним** (free-tier + watermark) | `generate.py:31` генерация, `generate.py:85`, `generate.py:280` IR-edit, `billing.py:19` entitlements |

`get_optional_user` (`auth_service.py:63-77`) при невалидном токене **не поднимает
привилегии** — он ловит исключение и возвращает `None`, то есть запрос обслуживается как
анонимный. Направление отказа безопасное: подделка теряет права, а не получает их.

## Проверка прогоном (не отчётом)

```
python -m pytest tests/test_auth_service.py -v
```

```
tests/test_auth_service.py::test_auth_configured_true PASSED                    [ 10%]
tests/test_auth_service.py::test_auth_configured_false_empty_url PASSED         [ 20%]
tests/test_auth_service.py::test_auth_configured_false_empty_key PASSED         [ 30%]
tests/test_auth_service.py::test_auth_configured_false_non_http_url PASSED      [ 40%]
tests/test_auth_service.py::test_get_optional_user_returns_none_when_no_credentials PASSED  [ 50%]
tests/test_auth_service.py::test_get_optional_user_returns_none_when_not_configured PASSED  [ 60%]
tests/test_auth_service.py::test_get_optional_user_returns_none_on_invalid_token PASSED     [ 70%]
tests/test_auth_service.py::test_get_current_user_raises_401_when_no_credentials PASSED     [ 80%]
tests/test_auth_service.py::test_get_current_user_raises_401_on_bad_token PASSED            [ 90%]
tests/test_auth_service.py::test_get_current_user_returns_user_on_valid_token PASSED        [100%]

============================= 10 passed in 0.98s ==============================
```

Тесты **существовали до этой проверки** (не написаны под ответ) — они прямо покрывают оба
интересующих случая: `test_get_current_user_raises_401_on_bad_token` (401 на плохом токене)
и `test_get_optional_user_returns_none_on_invalid_token` (деградация до анонима, не до
привилегий).

## Оговорки честности

1. **Проверено кодом и юнит-тестами, не живым прод-вызовом с подделанным токеном.**
   Прод-запрос с чужим/битым токеном не отправлялся: генерация на проде стоит денег и
   создаёт job. Механизм однозначен по коду, поэтому эскалации это не требует.
2. **`get_optional_user` глотает любое исключение** (`except Exception: return None`).
   Если Supabase недоступен по сети, валидный пользователь на время сбоя станет анонимом —
   потеряет квоту Pro и получит watermark. Это fail-closed (в сторону меньших прав), не
   дыра, но как продуктовое поведение при аварии Supabase стоит знать.
3. **Анонимная генерация не требует авторизации by design** (`OptionalUser = None`,
   раздел 18 ORCHESTRATOR.md — free-tier путь). Это уже известное владельцу решение, здесь
   не пересматривается. Побочный эффект — стоимость генерации не защищена входом; лимиты
   держит `assert_can_generate(ent)` по free-tier, не аутентификация.

## Вывод

H17 закрывается: **бэкенд валидирует токен у эмитента, подделка прав не даёт.**
Security-эскалации нет, кода не менялось. Пункт 2 раздела 13 ORCHESTRATOR.md («не проверял —
не утверждаю») теперь закрыт фактом.
