import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { RegisterRequest } from './dto/register.dto';
import { LoginRequest } from './dto/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash, verify } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isDev } from 'src/utils/is-dev-utils';
import type { Response, Request, CookieOptions } from 'express';
import { JwtPayload } from './interfaces/jwt.interface';
import type { SignOptions } from 'jsonwebtoken';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly JWT_SECRET: string;
  private readonly JWT_ACCESS_TOKEN_TTL: string;
  private readonly JWT_REFRESH_TOKEN_TTL: string;
  private readonly COOKIE_DOMAIN?: string;
  private readonly ADMIN_EMAIL?: string;
  private readonly ADMIN_PASSWORD?: string;
  private readonly ADMIN_NAME?: string;

  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_SECRET = this.configService.getOrThrow<string>('JWT_SECRET');
    this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_TTL',
    );
    this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<string>(
      'JWT_REFRESH_TOKEN_TTL',
    );
    this.COOKIE_DOMAIN = this.configService
      .get<string>('COOKIE_DOMAIN')
      ?.trim();
    this.ADMIN_EMAIL = this.configService.get<string>('ADMIN_EMAIL')?.trim();
    this.ADMIN_PASSWORD = this.configService
      .get<string>('ADMIN_PASSWORD')
      ?.trim();
    this.ADMIN_NAME = this.configService.get<string>('ADMIN_NAME')?.trim();
  }

  async onModuleInit() {
    await this.ensureAdminAccount();
  }

  async register(res: Response, dto: RegisterRequest) {
    const { email, name, password } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const adminCount = await this.prisma.user.count({
      where: { role: 'ADMIN' },
    });
    const shouldBecomeAdmin = this.shouldAssignAdminRole(email, adminCount);

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await hash(password),
        ...(shouldBecomeAdmin ? { role: 'ADMIN' } : {}),
      },
      select: { id: true, role: true },
    });

    if (shouldBecomeAdmin) {
      this.logger.log(`Assigned ADMIN role to ${email}.`);
    }

    return this.auth(res, user);
  }

  async login(res: Response, dto: LoginRequest) {
    const { email, password } = dto;
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isValidPassword = await verify(user.passwordHash, password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    return this.auth(res, { id: user.id, role: user.role });
  }

  async refresh(res: Response, req: Request) {
    const refreshToken: unknown = req.cookies['refreshToken'];
    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new UnauthorizedException('Отсутствует refresh token');
    }

    const payload = await this.verifyRefreshToken(refreshToken);

    if (payload) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, role: true },
      });

      if (!user) {
        throw new UnauthorizedException('Пользователь не авторизован');
      }
      return this.auth(res, user);
    }
  }

  logout(res: Response) {
    res.clearCookie('refreshToken', this.getRefreshCookieOptions());
    res.clearCookie('accessToken', this.getRefreshCookieOptions());
    return { message: 'Успешный выход из системы' };
  }

  private auth(res: Response, user: JwtPayload) {
    const { accessToken, refreshToken } = this.generateTokens(user);
    this.setCookie(
      res,
      'refreshToken',
      refreshToken,
      new Date(60 * 60 * 24 * 1000 + Date.now()),
    );
    this.setCookie(
      res,
      'accessToken',
      accessToken,
      new Date(60 * 60 * 24 * 1000 + Date.now()),
    );
    return { accessToken };
  }

  validateUser(payload: JwtPayload): JwtPayload {
    if (!payload?.id || !payload?.role) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }
    return {
      id: payload.id,
      role: payload.role,
    };
  }

  private generateTokens(user: JwtPayload) {
    const payload: JwtPayload = {
      id: user.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_REFRESH_TOKEN_TTL as SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    const payload: unknown = await this.jwtService.verifyAsync(token);

    if (!this.isJwtPayload(payload)) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    return this.validateUser(payload);
  }

  private isJwtPayload(payload: unknown): payload is JwtPayload {
    if (typeof payload !== 'object' || payload === null) {
      return false;
    }

    const candidate = payload as Record<string, unknown>;

    return (
      typeof candidate.id === 'string' && typeof candidate.role === 'string'
    );
  }

  private setCookie(res: Response, name: string, token: string, expires: Date) {
    const cookieOptions = this.getRefreshCookieOptions();

    res.cookie(name, token, {
      ...cookieOptions,
      expires,
    });
  }

  private getRefreshCookieOptions(): CookieOptions {
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: !isDev(this.configService),
      sameSite: !isDev(this.configService) ? 'none' : 'lax',
      path: '/',
    };

    if (this.COOKIE_DOMAIN) {
      cookieOptions.domain = this.COOKIE_DOMAIN;
    }

    return cookieOptions;
  }

  private shouldAssignAdminRole(email: string, adminCount: number): boolean {
    if (this.ADMIN_EMAIL) {
      return email.toLowerCase() === this.ADMIN_EMAIL.toLowerCase();
    }

    return adminCount === 0;
  }

  private async ensureAdminAccount() {
    if (!this.ADMIN_EMAIL || !this.ADMIN_PASSWORD) {
      return;
    }

    const normalizedEmail = this.ADMIN_EMAIL.toLowerCase();
    const passwordHash = await hash(this.ADMIN_PASSWORD);
    const adminName = this.ADMIN_NAME || 'Administrator';
    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, role: true },
    });

    if (!existingAdmin) {
      await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: adminName,
          passwordHash,
          role: 'ADMIN',
        },
      });
      this.logger.log(
        `Created configured admin account for ${normalizedEmail}.`,
      );
      return;
    }

    await this.prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        name: adminName,
        passwordHash,
        role: 'ADMIN',
      },
    });

    if (existingAdmin.role !== 'ADMIN') {
      this.logger.log(
        `Promoted configured admin account ${normalizedEmail} to ADMIN.`,
      );
    }
  }
}
