# Cursor Run Mode — DOCRAFT workspace

## Почему UI-allowlist «не срабатывает»

1. **Цепочки команд** — агент часто шлёт `cd C:\Projects\docraft; git status`, а в списке есть только `git diff` / `git log`, без `cd` и без общего префикса `git`.
2. **`permissions.json` заменяет UI** — если файл `~/.cursor/permissions.json` существует, массив `terminalAllowlist` из IDE **не дополняется**, а **полностью подменяется** файлом. Нужен полный список в JSON.
3. **Совпадение по префиксу** — в allowlist должна быть **первая команда** строки (или префикс всей строки). Пример: запись `git` покрывает `git status`, `git -C "..." pull`.

## Файлы (настроено)

| Файл | Назначение |
|------|------------|
| `%USERPROFILE%\.cursor\permissions.json` | Глобальный allowlist: git, python, scripts, clone-all, MCP `*:*` |
| `.cursor/permissions.json` (этот репо) | Подсказки `autoRun` для DOCRAFT; доп. terminal-префиксы |

Cursor **следит за файлами** — перезапуск не обязателен.

## Рекомендуемый Run Mode в IDE

**Settings → Run Mode → Allowlist** (как на скрине) или **Allowlist (with Sandbox)** для лишней изоляции.

- **Browser Protection** — по желанию (OFF = браузер MCP без отдельного запроса, если в `mcpAllowlist`).
- **File-Deletion Protection** — **ON** (оставить).

`autoRun` в `.cursor/permissions.json` учитывается в режиме **Auto-review**; в чистом **Allowlist** решают только `terminalAllowlist` / `mcpAllowlist`.

## Если карточка Run всё ещё появляется (важно)

На карточке Cursor показывает: `Not in allowlist: cd, git status, .\scripts\clone-all.ps1`.

**Сделайте один раз вручную (самый надёжный способ):**

1. На карточке Run откройте выпадающий список **Allowlist** (слева от кнопки Run).
2. Добавьте в allowlist: **`cd`**, **`git status`**, **`git`**, **`.\scripts\clone-all.ps1`** (или «Add all» / «Always allow»).
3. В **Settings → Run Mode → Command Allowlist** нажмите **Add Suggestions** (все строки с `+`).
4. **Developer: Reload Window** (`Ctrl+Shift+P` → Reload Window).

`permissions.json` подхватывается не на всех сборках сразу; UI-allowlist при этом **всегда** работает.

**Агент:** для allowlist лучше **отдельные** вызовы Shell, без `cd …; git …` в одной строке.

## Быстрая проверка

Попросите агента: «`git status` в docraft» и отдельно «`clone-all.ps1 -SkipExisting`» — без карточки Approve.

## Что намеренно не в allowlist

- Деструктивные команды (`push --force`, `reset --hard`, массовое удаление) — через **block_instructions** / ручное подтверждение.
- `git commit` / `git push` — только по явной просьбе пользователя (см. AGENTS.md).

## Обновление

После нового скрипта в дочернем репо добавьте префикс в `~/.cursor/permissions.json`, например:

```json
".\\scripts\\new-tool.ps1"
```
