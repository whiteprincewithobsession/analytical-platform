# Email API — Marketplace Analytics Platform

Сервис генерации PDF-отчётов из Apache Superset через `superset-pdf-report`.

## Как работает

```
Запрос → Flask → Superset API (chart screenshots) → LaTeX → pdflatex → PDF → email
```

1. Получает chart IDs из дашборда через `/api/v1/dashboard/{id}`
2. Скачивает скриншоты каждого чарта через Superset API (`cache_screenshot`)
3. Генерирует минимальный `.tex` файл (заголовок + картинки на каждой странице)
4. Компилирует через `pdflatex`
5. Отправляет PDF по email (если указан)

## Запуск

```bash
docker compose -f docker-compose.frontend.yml up -d
```

## API

### POST /email-api/export-report

```json
{
  "email": "user@example.com",
  "dashboardTitle": "Sales Overview",
  "dashboardId": "2",
  "chartIds": ["91", "92"]
}
```

### GET /email-api/download-pdf

`?dashboard=Sales&dashboardId=2&chartIds=91,92`

### GET /email-api/health

Health check.

## Конфигурация

| Переменная | Default | Описание |
|------------|---------|----------|
| `SMTP_HOST` | `smtp.mail.ru` | SMTP сервер |
| `SMTP_PORT` | `587` | SMTP порт |
| `SMTP_USER` | `stratum-platform@mail.ru` | Логин |
| `SMTP_PASSWORD` | *(обязательно)* | Пароль |
| `SUPERSET_URL` | `http://superset:8088` | Superset |
| `SUPERSET_USER` | `admin` | Пользователь |
| `SUPERSET_PASSWORD` | `admin` | Пароль |
