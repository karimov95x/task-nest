import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequest {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@mail.com',
  })
  @IsEmail({}, { message: 'Неправильный формат email' })
  @IsNotEmpty({ message: 'Email не должен быть пустым' })
  @IsString({ message: 'Email должен быть строкой' })
  email: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'User',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Имя не должно быть пустым' })
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Имя должно быть не менее 2 символов ' })
  @MaxLength(100, { message: 'Имя не должно превышать 100 символов' })
  name: string;

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
