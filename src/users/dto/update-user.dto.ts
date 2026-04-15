import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Джон',
  })
  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(1, { message: 'Имя не должно быть пустым' })
  @MaxLength(100, { message: 'Имя не должно превышать 100 символов' })
  name?: string;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Неправильный формат email' })
  email?: string;

  @ApiProperty({
    description: 'Роль пользователя',
    enum: ['USER', 'ADMIN'],
    required: false,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Роль должна быть USER или ADMIN' })
  role?: Role;
}
