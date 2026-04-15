import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private buildAccessWhere(userId: string, userRole: Role) {
    return userRole === Role.ADMIN ? {} : { userId };
  }

  async create(data: CreateTaskDto, userId: string) {
    return this.prisma.task.create({
      data: {
        ...data,
        userId,
      },
      include: { board: true, user: true },
    });
  }

  async findAll(userId: string, userRole: Role) {
    return this.prisma.task.findMany({
      where: this.buildAccessWhere(userId, userRole),
      include: { board: true, user: true },
    });
  }

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { board: true, user: true },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async findByBoardId(boardId: string, userId: string, userRole: Role) {
    return this.prisma.task.findMany({
      where: {
        boardId,
        ...this.buildAccessWhere(userId, userRole),
      },
      include: { board: true, user: true },
    });
  }

  async findByStatus(status: TaskStatus, userId: string, userRole: Role) {
    return this.prisma.task.findMany({
      where: {
        status,
        ...this.buildAccessWhere(userId, userRole),
      },
      include: { board: true, user: true },
    });
  }

  async update(
    id: string,
    data: UpdateTaskDto,
    userId: string,
    userRole: Role,
  ) {
    await this.ensureOwnershipOrAdmin(id, userId, userRole);
    return this.prisma.task.update({
      where: { id },
      data,
      include: { board: true, user: true },
    });
  }

  async delete(id: string, userId: string, userRole: Role) {
    await this.ensureOwnershipOrAdmin(id, userId, userRole);
    return this.prisma.task.delete({
      where: { id },
      include: { board: true, user: true },
    });
  }

  private async ensureOwnershipOrAdmin(
    taskId: string,
    userId: string,
    userRole: Role,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, userId: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Недостаточно прав для изменения этой задачи',
      );
    }
  }
}
