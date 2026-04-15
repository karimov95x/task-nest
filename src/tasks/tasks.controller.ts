import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Patch,
  ParseEnumPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Authorized } from 'src/auth/decorators/authorized.decorator';
import { Role } from 'src/auth/enums/role.enum';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @ApiOperation({ summary: 'Создать новую задачу' })
  @ApiResponse({ status: 201, description: 'Задача успешно создана' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @Authorized('id') userId: string,
  ) {
    return this.tasksService.create(createTaskDto, userId);
  }

  @ApiOperation({ summary: 'Получить все задачи' })
  @ApiResponse({ status: 200, description: 'Список задач успешно получен' })
  @ApiQuery({
    name: 'boardId',
    required: false,
    type: String,
    description: 'ID доски (UUID)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TaskStatus,
    description: 'Статус задачи',
  })
  @Get()
  findAll(
    @Authorized('id') currentUserId: string,
    @Authorized('role') currentUserRole: Role,
    @Query('boardId') boardId?: string,
    @Query('status', new ParseEnumPipe(TaskStatus, { optional: true }))
    status?: TaskStatus,
  ) {
    if (boardId) {
      return this.tasksService.findByBoardId(
        boardId,
        currentUserId,
        currentUserRole,
      );
    }
    if (status) {
      return this.tasksService.findByStatus(
        status,
        currentUserId,
        currentUserRole,
      );
    }
    return this.tasksService.findAll(currentUserId, currentUserRole);
  }

  @ApiOperation({ summary: 'Получить задачу по ID' })
  @ApiResponse({ status: 200, description: 'Задача успешно получена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @ApiParam({ name: 'id', type: String, description: 'ID задачи (UUID)' })
  @Get(':id')
  findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tasksService.findById(id);
  }

  @ApiOperation({ summary: 'Обновить задачу по ID' })
  @ApiResponse({ status: 200, description: 'Задача успешно обновлена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @ApiParam({ name: 'id', type: String, description: 'ID задачи (UUID)' })
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTaskDto,
    @Authorized('id') userId: string,
    @Authorized('role') userRole: Role,
  ) {
    return this.tasksService.update(id, dto, userId, userRole);
  }

  @ApiOperation({ summary: 'Удалить задачу по ID' })
  @ApiResponse({ status: 200, description: 'Задача успешно удалена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @ApiParam({ name: 'id', type: String, description: 'ID задачи (UUID)' })
  @Delete(':id')
  delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Authorized('id') userId: string,
    @Authorized('role') userRole: Role,
  ) {
    return this.tasksService.delete(id, userId, userRole);
  }
}
