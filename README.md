<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

### Railway

API подготовлен для Railway как Docker-based deployment.

Что добавлено:

- `Dockerfile` с multi-stage сборкой
- `docker-entrypoint.sh` для контролируемого запуска Prisma migrations
- `railway.json` с healthcheck и явным Docker builder
- scripts `migrate:deploy` и `start:migrate`

Настройки проекта в Railway:

1. Root Directory: `tasknest-api`
2. Railway подхватит `railway.json` и `Dockerfile`
3. В сервисе задайте production env-переменные

Обязательные env-переменные:

```bash
DATABASE_URL=
JWT_SECRET=
JWT_ACCESS_TOKEN_TTL=1d
JWT_REFRESH_TOKEN_TTL=7d
FRONTEND_URL=https://your-tasknest-front.vercel.app
NODE_ENV=production
```

Опционально для автосоздания админ-аккаунта на deploy:

```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me-now
ADMIN_NAME=Administrator
```

Опциональные env-переменные:

```bash
CORS_ALLOWED_ORIGINS=
COOKIE_DOMAIN=
DATABASE_SSL=false
RUN_MIGRATIONS_ON_STARTUP=
PORT=3000
```

Рекомендации для Railway:

- Если используете Railway Postgres с SSL, включите `DATABASE_SSL=true`
- В production на Railway миграции теперь запускаются автоматически по умолчанию
- Если хотите отключить авто-миграции, задайте `RUN_MIGRATIONS_ON_STARTUP=false`
- Если хотите принудительно включить их вне production, задайте `RUN_MIGRATIONS_ON_STARTUP=true`
- Если заданы `ADMIN_EMAIL` и `ADMIN_PASSWORD`, backend на старте создаст или обновит этот аккаунт с ролью `ADMIN`
- Если админ не задан через env, первый зарегистрированный пользователь автоматически станет `ADMIN`
- Для preview или нескольких frontend доменов перечисляйте их через запятую в `CORS_ALLOWED_ORIGINS`

### Prisma migrations in production

Этот сервис в production по умолчанию выполняет `prisma migrate deploy` перед стартом приложения.

- Обычный production старт: `npm run start:prod`
- Осознанный старт с миграциями: `npm run start:migrate`
- Docker entrypoint выполнит миграции автоматически при `NODE_ENV=production`, если `RUN_MIGRATIONS_ON_STARTUP` не задан
- Чтобы явно отключить миграции на старте, задайте `RUN_MIGRATIONS_ON_STARTUP=false`

Если Prisma сообщает о failed migration, сначала разрешите её состояние, затем повторите deploy:

```bash
npx prisma migrate resolve --rolled-back <migration_name>
npm run migrate:deploy
```

### Vercel

API подготовлен для деплоя в Vercel как отдельный проект с корнем `tasknest-api`.

Что уже настроено:

- `api/index.ts` поднимает Nest как serverless function
- `vercel.json` отправляет все маршруты в Nest handler
- CORS берётся из `FRONTEND_URL` и `CORS_ALLOWED_ORIGINS`
- `COOKIE_DOMAIN` опционален, поэтому для Vercel можно не задавать его вовсе

Настройки проекта в Vercel:

1. Root Directory: `tasknest-api`
2. Build Command: оставить стандартный
3. Output Directory: не указывать
4. Install Command: оставить стандартный

Обязательные env-переменные:

```bash
DATABASE_URL=
JWT_SECRET=
JWT_ACCESS_TOKEN_TTL=1d
JWT_REFRESH_TOKEN_TTL=7d
FRONTEND_URL=https://your-tasknest-front.vercel.app
NODE_ENV=production
```

Опциональные env-переменные:

```bash
CORS_ALLOWED_ORIGINS=https://your-tasknest-front-git-*.vercel.app
COOKIE_DOMAIN=
PORT=3000
```

Примечания:

- если нужен доступ и с preview frontend deployment, добавьте шаблон в `CORS_ALLOWED_ORIGINS`
- для Vercel обычно не нужно задавать `COOKIE_DOMAIN`; host-only cookies на домене API работают корректнее
- Prisma migrations запускайте отдельно перед production использованием базы

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
