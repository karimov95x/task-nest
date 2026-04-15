import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hash } from 'argon2';
import { Prisma, Role } from '@prisma/client';

const taskSummarySelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
} satisfies Prisma.TaskSelect;

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  tasks: {
    select: taskSummarySelect,
    orderBy: { createdAt: 'desc' },
  },
  boards: {
    select: {
      id: true,
      title: true,
      priority: true,
      createdAt: true,
      tasks: {
        select: taskSummarySelect,
      },
    },
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const { password, ...rest } = data;
    return this.prisma.user.create({
      data: {
        ...rest,
        passwordHash: await hash(password),
      },
      select: safeUserSelect,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: safeUserSelect,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: safeUserSelect,
    });
  }

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });

    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async update(
    id: string,
    data: UpdateUserDto,
    currentUserId: string,
    currentUserRole: Role,
  ) {
    await this.findById(id);

    const isAdmin = currentUserRole === Role.ADMIN;
    const isSelf = currentUserId === id;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException(
        'Недостаточно прав для изменения этого пользователя',
      );
    }

    if (!isAdmin && data.role !== undefined) {
      throw new ForbiddenException('Только администратор может менять роль');
    }

    if (data.role === Role.USER && (await this.isLastAdmin(id))) {
      throw new ForbiddenException('Нельзя понизить последнего администратора');
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });
  }

  async delete(id: string, currentUserId: string) {
    await this.findById(id);

    if (id === currentUserId) {
      throw new ForbiddenException(
        'Администратор не может удалить собственный аккаунт',
      );
    }

    if (await this.isLastAdmin(id)) {
      throw new ForbiddenException('Нельзя удалить последнего администратора');
    }

    return this.prisma.user.delete({
      where: { id },
      select: safeUserSelect,
    });
  }

  private async isLastAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== Role.ADMIN) {
      return false;
    }

    const adminCount = await this.prisma.user.count({
      where: { role: Role.ADMIN },
    });

    return adminCount <= 1;
  }
}
