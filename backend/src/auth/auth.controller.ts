import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { ClientId } from './decorators/client-id.decorator';
import { UsersService } from '../users/users.service';
import { WebPushService } from '../realtime/web-push.service';

interface WebPushSubscriptionBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly webPushService: WebPushService,
  ) {}

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Регистрация клиента' })
  @ApiResponse({ status: 201, description: 'Клиент зарегистрирован, возвращает access_token' })
  @ApiResponse({ status: 409, description: 'Телефон уже зарегистрирован' })
  registerClient(@Body() dto: RegisterClientDto) {
    return this.authService.registerClient(dto);
  }

  @Post('login')
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Логин клиента' })
  @ApiResponse({ status: 200, description: 'Успешный логин, возвращает access_token' })
  @ApiResponse({ status: 401, description: 'Неверный телефон или пароль' })
  loginClient(@Body() dto: LoginDto) {
    return this.authService.loginClient(dto);
  }

  @Patch('push-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Сохранить Expo push-token клиента' })
  @ApiResponse({ status: 204, description: 'Токен сохранён' })
  async savePushToken(@ClientId() clientId: string, @Body() body: { token: string }) {
    if (body?.token) await this.usersService.savePushToken(clientId, body.token);
  }

  /** Returns the VAPID public key — must be called by the frontend before subscribing */
  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Получить VAPID public key для Web Push' })
  getVapidPublicKey() {
    return { publicKey: this.webPushService.getVapidPublicKey() ?? null };
  }

  /** Save or refresh a Web Push subscription for a logged-in client */
  @Post('web-push-subscription')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Сохранить Web Push подписку клиента' })
  async saveWebPushSubscription(
    @ClientId() clientId: string,
    @Body() body: WebPushSubscriptionBody,
    @Headers('user-agent') userAgent?: string,
  ) {
    await this.webPushService.saveSubscription({
      subscriberType: 'client',
      subscriberId: clientId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent,
    });
  }

  /** Remove a Web Push subscription (called when the browser unsubscribes) */
  @Delete('web-push-subscription')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить Web Push подписку клиента' })
  async deleteWebPushSubscription(@Body() body: { endpoint: string }) {
    if (body?.endpoint) await this.webPushService.removeSubscription(body.endpoint);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  /**
   * POST /auth/admin/login
   * Validates ADMIN_USERNAME + ADMIN_PASSWORD from env,
   * returns a short-lived JWT with role "admin".
   */
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Логин администратора' })
  @ApiResponse({ status: 200, description: 'Возвращает admin JWT' })
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.username, dto.password);
  }

  @Patch('admin/users/:id/block')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Заблокировать / разблокировать клиента' })
  blockUser(@Param('id') id: string, @Body() body: { isBlocked: boolean }) {
    return this.usersService.blockUser(id, body.isBlocked ?? true);
  }

  @Get('admin/users')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список клиентов (admin)' })
  findAllUsersAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isBlocked') isBlocked?: string,
  ) {
    const parsedIsBlocked =
      isBlocked == null
        ? undefined
        : isBlocked === 'true'
          ? true
          : isBlocked === 'false'
            ? false
            : undefined;

    return this.usersService.findAllAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      parsedIsBlocked,
    );
  }
}
