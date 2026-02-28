# Scenario Editor — Setup Guide

Standalone JSON editor extracted from History's Edge project.

## ✅ Project Status

**Проект успешно создан!** Все компоненты скопированы и адаптированы для standalone использования.

## 📁 Структура проекта

```
d:\VibeCode\scenario-editor/
├── app/
│   ├── page.tsx                    # Главная страница
│   ├── scenarios/page.tsx          # Список сценариев
│   ├── editor/[fileId]/
│   │   ├── page.tsx                # Страница редактора
│   │   └── editor.module.css
│   ├── api/scenarios/
│   │   ├── route.ts                # GET, POST /api/scenarios
│   │   ├── [fileId]/route.ts       # GET, PUT, DELETE
│   │   └── validate/route.ts       # POST /api/scenarios/validate
│   └── globals.css
├── components/editor/
│   ├── json-editor.tsx             # CodeMirror редактор
│   ├── json-editor.module.css
│   ├── scenario-preview.tsx        # Live preview панель
│   ├── scenario-preview.module.css
│   ├── validation-panel.tsx        # Панель валидации
│   └── validation-panel.module.css
├── lib/
│   ├── validator.ts                # JSON Schema валидатор (AJV)
│   ├── scenario-loader.ts          # Загрузка сценариев с диска
│   └── scenario-writer.ts          # Сохранение/создание/удаление
├── types/
│   └── scenario.ts                 # TypeScript типы
├── scenarios/                      # 📂 JSON файлы сценариев
│   └── caesar.json                 # Пример (скопирован из Games)
├── package.json                    # Зависимости (CodeMirror + AJV)
├── tsconfig.json
└── README.md
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd d:\VibeCode\scenario-editor
npm install
```

### 2. Запуск dev сервера

```bash
npm run dev
```

Откройте http://localhost:3001

### 3. Редактирование сценария

- Перейдите на http://localhost:3001/scenarios
- Выберите `caesar` (пример)
- Или создайте новый сценарий

## 📦 Установленные зависимости

### CodeMirror 6 (редактор)
```json
"@codemirror/autocomplete": "^6.23.2",
"@codemirror/commands": "^6.8.4",
"@codemirror/lang-json": "^6.0.1",
"@codemirror/language": "^6.10.8",
"@codemirror/lint": "^6.9.4",
"@codemirror/search": "^6.6.1",
"@codemirror/state": "^6.4.1",
"@codemirror/theme-one-dark": "^6.1.2",
"@codemirror/view": "^6.38.3"
```

### Валидация
```json
"ajv": "^8.18.0"
```

## 🔧 Функционал

### ✅ Что включено

- **JSON Editor**: CodeMirror 6 с подсветкой синтаксиса, line numbers, bracket matching
- **Live Preview**: Реал-тайм визуализация структуры сценария
- **Validation**:
  - JSON Schema validation (AJV)
  - ID reference checking (sourceRef, nextTurnId, endingId, etc.)
  - Turn routing validation (граф достижимости)
  - Warnings (рекомендации по дизайну)
- **File Management**: Create, Edit, Save, Delete сценариев
- **Click-to-scroll**: Клик по элементу в preview → скролл к JSON коду

### ❌ Что убрано (из History's Edge)

- Game engine (`processTurn`, `checkTriggers`, `evaluateEnding`)
- Real history path simulation (`validateRealHistoryPath`)
- Admin authentication & sessions
- Database (SQLite, Drizzle ORM)
- Graph viewer (визуализация графа решений)

## 📝 API Endpoints

### `GET /api/scenarios`
Список всех сценариев с метаданными.

### `GET /api/scenarios/:fileId`
Получить raw JSON сценария.

### `POST /api/scenarios`
Создать новый сценарий.

**Request:**
```json
{
  "fileId": "my-scenario",
  "data": { "meta": {...}, "turns": [...], ... }
}
```

### `PUT /api/scenarios/:fileId`
Обновить существующий сценарий (с валидацией).

### `DELETE /api/scenarios/:fileId`
Удалить сценарий.

### `POST /api/scenarios/validate`
Валидация без сохранения.

**Request:**
```json
{
  "data": { "meta": {...}, ... }
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    { "path": "turns[2].choices", "message": "..." }
  ]
}
```

## 🎯 Использование

### Добавить новый сценарий

1. Создайте JSON файл в `scenarios/my-scenario.json`
2. Или используйте кнопку "Create New" в UI
3. Редактируйте на http://localhost:3001/editor/my-scenario

### Валидация

1. Нажмите **Validate** в toolbar
2. Ошибки показываются в правой панели
3. Клик по ошибке → скролл к коду

### Сохранение

1. Редактируйте JSON
2. Статус: "Modified" → желтый индикатор
3. Нажмите **Save**
4. Статус: "Saved" → зеленый индикатор

## 🔨 Build для продакшена

```bash
npm run build
npm start
```

## 🐳 Docker (опционально)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t scenario-editor .
docker run -p 3000:3000 -v ./scenarios:/app/scenarios scenario-editor
```

## 🔍 Отличия от History's Edge

| Feature | History's Edge | Scenario Editor |
|---------|----------------|-----------------|
| JSON Schema validation | ✅ | ✅ |
| ID reference checking | ✅ | ✅ |
| Turn routing validation | ✅ | ✅ |
| Game engine simulation | ✅ | ❌ |
| Real history path check | ✅ | ❌ |
| Admin auth | ✅ | ❌ |
| Database | ✅ | ❌ |
| Graph viewer | ✅ | ❌ |

## 📚 Дальнейшее развитие

Этот проект **НЕ синхронизируется** с основным History's Edge. Вы можете:

- Добавлять новые фичи независимо
- Кастомизировать валидацию
- Использовать для других JSON-схем (не только scenarios)

Если нужна полная валидация с game engine — используйте основной проект.

## ❓ Troubleshooting

### Ошибка "Module not found: @/..."

Проверьте `tsconfig.json`:
```json
"paths": {
  "@/*": ["./*"]
}
```

### Сценарии не загружаются

Убедитесь что:
1. Папка `scenarios/` существует
2. JSON файлы валидны
3. Dev сервер перезапущен (`npm run dev`)

### CodeMirror не загружается

Проверьте что все пакеты установлены:
```bash
npm install
```

## 📞 Support

Вопросы по основному проекту: https://github.com/GalinaErshova/HistorysEdge

---

**Проект готов к использованию!** 🎉
