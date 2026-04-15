# TaskNest API - Тестирование Auth модуля

Запуск проекта

1. Установка зависимости:

```bash
npm install
```

2. Настройка переменных окружения:

```bash
cp .env.example .env
# Отредактируйте .env с вашими настройками
```

3. Применение миграции Prisma:

```bash
npx prisma migrate dev
```

4. Запуск сервера:

```bash
npm run start:dev
```

Сервер запустится на http://localhost:3000

## Тестирование через Postman

### 1. Регистрация пользователя

**POST** `/auth/register`

Body (JSON):

```json
{
  "email": "student@example.com",
  "name": "Student",
  "password": "654321"
}
```

Ожидаемый ответ: `200 OK`

```json
{
  "accessToken": "<jwt_token>"
}
```

---

### 2. Вход в систему (Login)

**POST** `/auth/login`

Body (JSON):

```json
{
  "email": "student@example.com",
  "password": "654321"
}
```

Ожидаемый ответ: `200 OK`

```json
{
  "accessToken": "<jwt_token>"
}
```

---

### 3. Проверка защищенного маршрута

**GET** `/auth/me`

Headers:

```
Authorization: Bearer <jwt_token>
```

Ожидаемый ответ: `200 OK`

```json
{
  "id": "user_id"
}
```

---

### 4. Тест на неверные данные

**POST** `/auth/login`

Body (JSON):

```json
{
  "email": "student@example.com",
  "password": "WrongPassword"
}
```

Ожидаемый ответ: `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Неверный пароль"
}
```

---

### 5. Тест без токена

**GET** `/auth/me`

Без заголовка Authorization

Ожидаемый ответ: `401 Unauthorized`


## Структура проекта

- `src/auth/` - Модуль авторизации
  - `auth.controller.ts` - Контроллер с эндпоинтами
  - `auth.service.ts` - Логика авторизации
  - `guards/auth.guard.ts` - JWT Guard для защиты маршрутов
  - `strategies/jwt.strategy.ts` - Стратегия валидации JWT
  - `dto/` - DTO для валидации данных
  - `decorators/` - Декораторы для авторизации

- `src/users/` - Модуль пользователей
  - `users.service.ts` - Сервис работы с пользователями

## Используемые технологии

- NestJS - Backend framework
- Prisma ORM - Database ORM
- PostgreSQL - Database
- JWT - Авторизация
- Argon2 - Хеширование паролей
- Passport - Аутентификация
- Swagger - API документация
