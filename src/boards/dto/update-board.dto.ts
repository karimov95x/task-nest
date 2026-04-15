import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { BoardPriority } from '@prisma/client';

export class UpdateBoardDto {
  @ApiPropertyOptional({
    description: 'Название доски',
    example: 'Проект A',
  })
  @IsOptional()
  @IsString({ message: 'Название доски должно быть строкой' })
  @MinLength(1, { message: 'Название доски не должно быть пустым' })
  @MaxLength(100, {
    message: 'Название доски не должно превышать 100 символов',
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Приоритет доски',
    enum: BoardPriority,
  })
  @IsOptional()
  @IsEnum(BoardPriority, { message: 'Приоритет должен быть high, medium или low' })
  priority?: BoardPriority;
}
