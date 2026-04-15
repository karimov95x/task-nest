import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../guards/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

export function Authorization() {
  return applyDecorators(UseGuards(JwtGuard), ApiBearerAuth());
}
