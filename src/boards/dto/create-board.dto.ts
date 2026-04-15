import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { BoardPriority } from '@prisma/client';

export class CreateBoardDto {
  @ApiProperty({
    description: 'Название доски',
    example: 'Обучение Full Stack Development',
  })
  @IsNotEmpty({ message: 'Название доски не должно быть пустым' })
  @IsString({ message: 'Название доски должно быть строкой' })
  @MinLength(1, { message: 'Название доски не должно быть пустым' })
  @MaxLength(100, {
    message: 'Название доски не должно превышать 100 символов',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Приоритет доски',
    enum: BoardPriority,
    default: BoardPriority.medium,
  })
  @IsOptional()
  @IsEnum(BoardPriority, { message: 'Приоритет должен быть high, medium или low' })
  priority?: BoardPriority;
}
