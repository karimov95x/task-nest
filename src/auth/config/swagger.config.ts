import { DocumentBuilder } from '@nestjs/swagger';

export function getSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('TaskNest API')
    .setDescription('API для управления задачами, досками и пользователями')
    .setVersion('1.0.0')
    .addTag('Auth')
    .addTag('Users')
    .addTag('Boards')
    .addTag('Tasks')
    .addBearerAuth()
    .build();
}
