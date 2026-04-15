import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsUUID,
} from 'class-validator';

enum TaskStatus {
  todo = 'todo',
  in_progress = 'in_progress',
  done = 'done',
}

export class CreateTaskDto {
  @ApiProperty({
    description: 'Название задачи',
    example: 'Оптимизировать код',
  })
  @IsNotEmpty({ message: 'Название задачи не должно быть пустым' })
  @IsString({ message: 'Название задачи должно быть строкой' })
  @MinLength(1, { message: 'Название задачи не должно быть пустым' })
  @MaxLength(200, {
    message: 'Название задачи не должно превышать 200 символов',
  })
  title: string;

  @ApiProperty({
    description: 'Описание задачи',
    example: 'Оптимизировать код для повышения производительности',
  })
  @IsOptional()
  @IsString({ message: 'Описание задачи должно быть строкой' })
  @MaxLength(1000, {
    message: 'Описание задачи не должно превышать 1000 символов',
  })
  description?: string;

  @ApiProperty({
    description: 'Статус задачи',
    example: 'todo',
    enum: TaskStatus,
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Неправильный статус' })
  status?: TaskStatus = TaskStatus.todo;

  @ApiProperty({
    description: 'ID доски, к которой относится задача',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'ID доски не должен быть пустым' })
  @IsUUID('4', { message: 'ID доски должен быть валидным UUID' })
  boardId: string;
}
