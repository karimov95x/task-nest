import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequest {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@mail.com',
  })
  @IsEmail({}, { message: 'Неправильный формат email' })
  @IsNotEmpty({ message: 'Email не должен быть пустым' })
  @IsString({ message: 'Email должен быть строкой' })
  email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: '123456',
    minLength: 6,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Пароль не должен быть пустым' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  @MaxLength(50, { message: 'Пароль не должен превышать 50 символов' })
  password: string;
}
