# UX self-review — обязательная процедура перед показом brand-v2

**Правило:** перед показом Beaver'у ЛЮБОГО экрана или потока brand-v2 прогнать пять
промтов ниже **строго по порядку 01 → 05**, каждый отдельным шагом. Claude здесь — «второе
мнение» самому себе: критика готового решения, а не генерация визуала.

**Результат прогона прикладывается к отчёту о готовности экрана.** Промты не заменяют
суждение: финальное решение по каждой найденной проблеме за Оркестратором/Beaver.
Промты формализуют проверку перед словом «готово»; они дополняют, а не отменяют правило
«самому смотреть отрендеренный результат до выдачи и доводить до 100 из 100».

Источник набора: карусель @animaagrawal.design (7 слайдов).

## Порядок применения

| # | Название | Когда |
|---|---|---|
| 01 | What's Missing? | перед переходом от research к дизайну |
| 02 | Devil's Advocate | вызов собственному решению |
| 03 | Edge-Case Finder | сценарии за пределами happy path |
| 04 | UX Writing Assistant | ревью текстов интерфейса |
| 05 | Prioritisation Assistant | приоритизация найденных проблем (после 01–04) |

## 01. What's Missing?

```
Review these research findings and identify:
→ Questions we still haven't answered
→ Assumptions without enough evidence
→ User groups we may have overlooked
→ Areas that need more research
```

## 02. Devil's Advocate

```
Act as a senior UX designer and challenge this solution. Find:
→ Assumptions I'm making
→ Potential friction points
→ Scenarios where it might fail
→ Alternative approaches worth exploring
```

## 03. Edge-Case Finder

```
Review this user flow beyond the happy path. What happens with:
→ Bad internet
→ Missing information
→ Abandoned tasks
→ Returning users
→ Unexpected user behaviour?
```

## 04. UX Writing Assistant

```
Review this interface copy.
→ Make it clearer and shorter
→ Remove jargon
→ Reduce ambiguity
→ Improve button labels
→ Flag inconsistent terminology
```

## 05. Prioritisation Assistant

Вход: объединённый список проблем из шагов 01–04.

```
Prioritise these UX issues based on
→ Severity
→ User impact
→ Frequency
→ Business impact
→ Effort
```

Явный дополнительный запрос к этому шагу: **выделить quick wins и указать, что чинить первым.**

## Что прикладывать к отчёту о готовности

Для каждого шага 01–05: сырой ответ или его сжатая выжимка, затем решение по каждой
найденной проблеме (чиним / не чиним + причина). Правки экранов по итогам прогона — отдельная
работа, не часть самого прогона.
