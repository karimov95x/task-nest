import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Role } from 'src/auth/enums/role.enum';
import { Prisma } from '@prisma/client';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  private buildAccessWhere(
    userId: string,
    userRole: Role,
  ): Prisma.BoardWhereInput {
    return userRole === Role.ADMIN ? {} : { userId };
  }

  async create(data: CreateBoardDto, userId: string) {
    return this.prisma.board.create({
      data: {
        ...data,
        userId,
      },
      include: { tasks: true },
    });
  }

  async findAll(userId: string, userRole: Role) {
    const isAdmin = userRole === Role.ADMIN;
    return this.prisma.board.findMany({
      where: this.buildAccessWhere(userId, userRole),
      include: {
        tasks: true,
        ...(isAdmin && {
          user: { select: { id: true, name: true, email: true } },
        }),
      },
    });
  }

  async findById(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: { tasks: true },
    });
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    return board;
  }

  async update(
    id: string,
    data: UpdateBoardDto,
    userId: string,
    userRole: Role,
  ) {
    await this.ensureOwnershipOrAdmin(id, userId, userRole);
    return this.prisma.board.update({
      where: { id },
      data,
      include: { tasks: true },
    });
  }

  async delete(id: string, userId: string, userRole: Role) {
    await this.ensureOwnershipOrAdmin(id, userId, userRole);
    return this.prisma.board.delete({
      where: { id },
      include: { tasks: true },
    });
  }

  private async ensureOwnershipOrAdmin(
    boardId: string,
    userId: string,
    userRole: Role,
  ) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, userId: true },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    if (board.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Недостаточно прав для изменения этой доски',
      );
    }
  }
}
