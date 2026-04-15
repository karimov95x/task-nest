import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { Role } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const runId = Date.now().toString();
const emailPrefix = `boards-e2e-${runId}`;
const boardTitlePrefix = `Boards E2E ${runId}`;
const taskTitlePrefix = `Tasks E2E ${runId}`;

const userEmail = `${emailPrefix}-user@example.com`;
const adminEmail = `${emailPrefix}-admin@example.com`;
const password = 'test4321';

let counter = 0;

function uniqueBoardTitle(label: string) {
  counter += 1;
  return `${boardTitlePrefix} ${label} ${counter}`;
}

function uniqueTaskTitle(label: string) {
  counter += 1;
  return `${taskTitlePrefix} ${label} ${counter}`;
}

describe('BoardsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;

  async function cleanupTestData() {
    await prisma.task.deleteMany({
      where: { title: { startsWith: taskTitlePrefix } },
    });
    await prisma.board.deleteMany({
      where: { title: { startsWith: boardTitlePrefix } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: emailPrefix } },
    });
  }

  async function createBoardInDb(title: string) {
    return prisma.board.create({
      data: { title },
    });
  }

  async function createTaskInDb(
    title: string,
    boardId: string,
    ownerId: string,
  ) {
    return prisma.task.create({
      data: {
        title,
        boardId,
        userId: ownerId,
      },
    });
  }

  // beforeAll: register → set ADMIN → login → save tokens
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.use(cookieParser());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await cleanupTestData();

    await request(app.getHttpServer()).post('/auth/register').send({
      email: userEmail,
      name: 'Boards E2E User',
      password,
    });

    await request(app.getHttpServer()).post('/auth/register').send({
      email: adminEmail,
      name: 'Boards E2E Admin',
      password,
    });

    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: Role.ADMIN },
    });

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password });
    userToken = userLogin.body.accessToken;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password });
    adminToken = adminLogin.body.accessToken;

    const [userRecord, adminRecord] = await Promise.all([
      prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { email: adminEmail },
        select: { id: true },
      }),
    ]);

    userId = userRecord!.id;
    adminId = adminRecord!.id;
  });

  // afterAll: delete test data → close app
  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  describe('1 — Миграция выполнена', () => {
    it('в БД есть колонка role у таблицы users', async () => {
      // Arrange
      const query = await prisma.$queryRaw<
        Array<{ table_name: string; column_name: string }>
      >`SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('User', 'users')
          AND column_name = 'role'`;

      // Act
      const hasRoleColumn = query.length > 0;

      // Assert
      expect(hasRoleColumn).toBe(true);
    });
  });

  describe('2 — POST /auth/register и POST /auth/login без токена', () => {
    it('POST /auth/register работает без токена и возвращает 201', async () => {
      // Arrange
      const publicRegisterEmail = `${emailPrefix}-public-register@example.com`;

      // Act
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: publicRegisterEmail,
          name: 'Boards Public Register',
          password,
        });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
    });

    it('POST /auth/login работает без токена и возвращает 200', async () => {
      // Arrange
      const payload = { email: userEmail, password };

      // Act
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payload);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });
  });

  describe('3 - GET /boards — без токена', () => {
    it('должен вернуть 401 Unauthorized', async () => {
      // Arrange
      const httpServer = app.getHttpServer();

      // Act
      const res = await request(httpServer).get('/boards');

      // Assert
      expect(res.status).toBe(401);
    });
  });

  describe('4 - GET /boards — с токеном USER', () => {
    it('должен вернуть 200 OK', async () => {
      // Arrange
      await createBoardInDb(uniqueBoardTitle('GET ALL'));

      // Act
      const res = await request(app.getHttpServer())
        .get('/boards')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('5 — POST /boards — USER', () => {
    it('должен вернуть 403 Forbidden', async () => {
      // Arrange
      const payload = { title: uniqueBoardTitle('USER CREATE FORBIDDEN') };

      // Act
      const res = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${userToken}`)
        .send(payload);

      // Assert
      expect(res.status).toBe(403);
    });
  });

  describe('6 — POST /boards — ADMIN', () => {
    it('должен создать доску и вернуть 201 Created', async () => {
      // Arrange
      const title = uniqueBoardTitle('ADMIN CREATE');

      // Act
      const res = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe(title);
    });
  });

  describe('GET /boards/:id', () => {
    it('должен вернуть доску по ID для авторизованного пользователя', async () => {
      // Arrange
      const board = await createBoardInDb(uniqueBoardTitle('GET BY ID'));

      // Act
      const res = await request(app.getHttpServer())
        .get(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(board.id);
      expect(res.body.title).toBe(board.title);
    });
  });

  describe('PATCH /boards/:id', () => {
    it('ADMIN должен обновить доску и вернуть 200 OK', async () => {
      // Arrange
      const board = await createBoardInDb(
        uniqueBoardTitle('PATCH ADMIN SOURCE'),
      );
      const updatedTitle = uniqueBoardTitle('PATCH ADMIN UPDATED');

      // Act
      const res = await request(app.getHttpServer())
        .patch(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: updatedTitle });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(board.id);
      expect(res.body.title).toBe(updatedTitle);
    });
  });

  describe('DELETE /boards/:id', () => {
    it('ADMIN должен удалить доску и вернуть 200 OK', async () => {
      // Arrange
      const board = await createBoardInDb(uniqueBoardTitle('DELETE ADMIN'));

      // Act
      const res = await request(app.getHttpServer())
        .delete(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(board.id);
    });
  });

  describe('7 — POST /tasks', () => {
    it('не принимает userId в теле и берёт пользователя из токена автоматически', async () => {
      // Arrange
      const board = await createBoardInDb(uniqueBoardTitle('TASK CREATE'));

      // Act
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: uniqueTaskTitle('OWNER FROM TOKEN'),
          boardId: board.id,
        });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userId);
      expect(res.body.userId).not.toBe(adminId);
    });
  });

  describe('8 — PATCH /tasks/:id своей задачи', () => {
    it('должен вернуть 200 OK для владельца задачи', async () => {
      // Arrange
      const board = await createBoardInDb(
        uniqueBoardTitle('TASK OWN PATCH BOARD'),
      );
      const task = await createTaskInDb(
        uniqueTaskTitle('TASK OWN PATCH SOURCE'),
        board.id,
        userId,
      );

      // Act
      const res = await request(app.getHttpServer())
        .patch(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: uniqueTaskTitle('TASK OWN PATCH UPDATED') });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(task.id);
    });
  });

  describe('9 — PATCH /tasks/:id чужой задачи (не ADMIN)', () => {
    it('должен вернуть 403 Forbidden', async () => {
      // Arrange
      const board = await createBoardInDb(
        uniqueBoardTitle('TASK FOREIGN PATCH BOARD'),
      );
      const task = await createTaskInDb(
        uniqueTaskTitle('TASK FOREIGN PATCH SOURCE'),
        board.id,
        adminId,
      );

      // Act
      const res = await request(app.getHttpServer())
        .patch(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: uniqueTaskTitle('TASK FOREIGN PATCH DENIED') });

      // Assert
      expect(res.status).toBe(403);
    });
  });

  describe('10 — DELETE /tasks/:id чужой задачи от имени ADMIN', () => {
    it('должен вернуть 200 OK', async () => {
      // Arrange
      const board = await createBoardInDb(
        uniqueBoardTitle('TASK DELETE BOARD'),
      );
      const task = await createTaskInDb(
        uniqueTaskTitle('TASK DELETE SOURCE'),
        board.id,
        userId,
      );

      // Act
      const res = await request(app.getHttpServer())
        .delete(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(task.id);
    });
  });

  describe('GET /users/me', () => {
    it('без токена должен вернуть 401 Unauthorized', async () => {
      // Arrange
      const httpServer = app.getHttpServer();

      // Act
      const res = await request(httpServer).get('/users/me');

      // Assert
      expect(res.status).toBe(401);
    });

    it('с токеном USER должен вернуть 200 OK и поле id', async () => {
      // Arrange
      const httpServer = app.getHttpServer();

      // Act
      const res = await request(httpServer)
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(userId);
    });

    it('не должен возвращать поле password', async () => {
      // Arrange
      const httpServer = app.getHttpServer();

      // Act
      const res = await request(httpServer)
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.password).toBeUndefined();
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('должен возвращать массив tasks пользователя', async () => {
      // Arrange
      const board = await createBoardInDb(uniqueBoardTitle('USERS ME TASKS'));
      const task = await createTaskInDb(
        uniqueTaskTitle('USERS ME TASK ITEM'),
        board.id,
        userId,
      );

      // Act
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tasks)).toBe(true);
      expect(res.body.tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: task.id,
            title: task.title,
          }),
        ]),
      );
    });
  });
});