import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Role } from 'src/auth/enums/role.enum';
import { Authorized } from 'src/auth/decorators/authorized.decorator';

@ApiTags('Boards')
@Controller('boards')
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @ApiOperation({ summary: 'Создать новую доску' })
  @ApiResponse({ status: 201, description: 'Доска успешно создана' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @Post()
  create(
    @Body() createBoardDto: CreateBoardDto,
    @Authorized('id') userId: string,
  ) {
    return this.boardsService.create(createBoardDto, userId);
  }

  @ApiOperation({ summary: 'Получить все доски' })
  @ApiResponse({ status: 200, description: 'Список досок успешно получен' })
  @ApiQuery({
    name: 'includeTasks',
    required: false,
    description: 'Включать ли задачи в ответ',
  })
  @Get()
  findAll(
    @Authorized('id') currentUserId: string,
    @Authorized('role') currentUserRole: Role,
  ) {
    return this.boardsService.findAll(currentUserId, currentUserRole);
  }

  @ApiOperation({ summary: 'Получить доску по ID' })
  @ApiResponse({ status: 200, description: 'Доска успешно получена' })
  @ApiResponse({ status: 404, description: 'Доска не найдена' })
  @ApiParam({ name: 'id', type: String, description: 'ID доски (UUID)' })
  @Get(':id')
  findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.boardsService.findById(id);
  }

  @ApiOperation({ summary: 'Обновить доску по ID' })
  @ApiResponse({ status: 200, description: 'Доска успешно обновлена' })
  @ApiResponse({ status: 404, description: 'Доска не найдена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiParam({ name: 'id', type: String, description: 'ID доски (UUID)' })
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBoardDto,
    @Authorized('id') userId: string,
    @Authorized('role') userRole: Role,
  ) {
    return this.boardsService.update(id, dto, userId, userRole);
  }

  @ApiOperation({ summary: 'Удалить доску по ID' })
  @ApiResponse({ status: 200, description: 'Доска успешно удалена' })
  @ApiResponse({ status: 404, description: 'Доска не найдена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiParam({ name: 'id', type: String, description: 'ID доски (UUID)' })
  @Delete(':id')
  delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Authorized('id') userId: string,
    @Authorized('role') userRole: Role,
  ) {
    return this.boardsService.delete(id, userId, userRole);
  }
}
