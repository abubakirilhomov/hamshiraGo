import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { RateOrderDto } from './dto/rate-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MedicAuthGuard } from '../auth/guards/medic-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';
import { MedicId } from '../auth/decorators/medic-id.decorator';
import { OrderStatus } from './entities/order-status.enum';
import { CloudinaryService } from '../common/cloudinary.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ── Client endpoints ──────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Создать заказ (клиент)' })
  @ApiResponse({ status: 201, description: 'Заказ создан' })
  create(@ClientId() clientId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(clientId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'История заказов клиента' })
  findByClient(
    @ClientId() clientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findByClient(
      clientId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Статистика заказов клиента' })
  getStats(@ClientId() clientId: string) {
    return this.ordersService.getClientStats(clientId);
  }

  @Get(':id([0-9a-fA-F-]{36})')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Получить заказ по ID' })
  findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string; role: 'client' | 'medic' | 'admin' } },
  ) {
    return this.ordersService.findOneForActor(id, req.user.id, req.user.role);
  }

  /** Client cancels their own order (only CREATED or ASSIGNED) */
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Клиент отменяет заказ' })
  cancelOrder(
    @Param('id') id: string,
    @ClientId() clientId: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(id, clientId, dto.reason);
  }

  /** Reorder — create a new order from a previous one */
  @Post(':id/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Повторный заказ (копия предыдущего)' })
  reorder(
    @Param('id') id: string,
    @ClientId() clientId: string,
  ) {
    return this.ordersService.reorder(id, clientId);
  }

  /** Send a chat message in an order (client) */
  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Отправить сообщение в чат заказа (клиент)' })
  sendMessage(
    @Param('id') id: string,
    @ClientId() clientId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.ordersService.sendMessage(id, clientId, 'client', dto.content);
  }

  /** Get chat messages for an order */
  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Получить сообщения чата заказа' })
  getMessages(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string; role: string } },
  ) {
    return this.ordersService.getMessages(id, req.user.id, req.user.role);
  }

  /** Client rates the medic after order is DONE */
  @Post(':id/rate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  rateOrder(
    @Param('id') id: string,
    @ClientId() clientId: string,
    @Body() dto: RateOrderDto,
  ) {
    return this.ordersService.rateOrder(id, clientId, dto);
  }

  @Patch(':id([0-9a-fA-F-]{36})/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @ClientId() clientId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatusByClient(id, clientId, dto);
  }

  // ── Medic endpoints ───────────────────────────────────────────────────────

  /** List of CREATED orders available for medics to pick up (filtered by 10km radius) */
  @Get('medic/available')
  @UseGuards(MedicAuthGuard)
  findAvailable(@MedicId() medicId: string) {
    return this.ordersService.findAvailable(medicId);
  }

  /** Medic's own order history */
  @Get('medic/my')
  @UseGuards(MedicAuthGuard)
  findMyOrders(
    @MedicId() medicId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findByMedic(
      medicId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /** Accept an available order (requires active dispatch invite) */
  @Post(':id/accept')
  @UseGuards(MedicAuthGuard)
  @HttpCode(HttpStatus.OK)
  acceptOrder(@Param('id') id: string, @MedicId() medicId: string) {
    return this.ordersService.acceptOrder(id, medicId);
  }

  /** Decline a dispatch invite → dispatch advances to the next medic */
  @Post(':id/decline')
  @UseGuards(MedicAuthGuard)
  @HttpCode(HttpStatus.OK)
  declineOrder(@Param('id') id: string, @MedicId() medicId: string) {
    return this.ordersService.declineOrder(id, medicId);
  }

  /** Send a chat message in an order (medic) */
  @Post(':id/medic-messages')
  @UseGuards(MedicAuthGuard)
  @ApiOperation({ summary: 'Отправить сообщение в чат заказа (медик)' })
  sendMedicMessage(
    @Param('id') id: string,
    @MedicId() medicId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.ordersService.sendMessage(id, medicId, 'medic', dto.content);
  }

  /** Update order status (ON_THE_WAY, ARRIVED, SERVICE_STARTED, DONE) */
  @Patch(':id/medic-status')
  @UseGuards(MedicAuthGuard)
  updateMedicStatus(
    @Param('id') id: string,
    @MedicId() medicId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatusByMedic(id, medicId, dto.status as OrderStatus);
  }

  /** Upload before/after photo for an order (medic only) */
  @Post(':id/photo')
  @UseGuards(MedicAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Загрузить фото до/после процедуры (медик)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        if (!allowed.includes(extname(file.originalname).toLowerCase())) {
          return cb(new BadRequestException('Only jpg/jpeg/png/webp files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadOrderPhoto(
    @Param('id') id: string,
    @MedicId() medicId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
  ) {
    if (!file) throw new BadRequestException('NO_FILE_PROVIDED');
    if (!this.cloudinaryService.isConfigured()) {
      throw new ServiceUnavailableException('FILE_STORAGE_NOT_CONFIGURED');
    }
    if (type !== 'before' && type !== 'after') {
      throw new BadRequestException('TYPE_MUST_BE_BEFORE_OR_AFTER');
    }
    return this.ordersService.uploadOrderPhoto(id, medicId, file, type as 'before' | 'after');
  }

  // ── Admin endpoints ───────────────────────────────────────────────────────

  /**
   * GET /orders/admin/all?page=1&limit=20&status=CREATED
   * Returns all orders with pagination and optional status filter.
   * Requires X-Admin-Secret header.
   */
  @Get('admin/all')
  @UseGuards(AdminGuard)
  findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('isUrgent') isUrgent?: string,
  ) {
    return this.ordersService.findAllAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status as OrderStatus | undefined,
      isUrgent !== undefined ? isUrgent === 'true' : undefined,
    );
  }

  /**
   * PATCH /orders/admin/:id/cancel
   * Force-cancel any order. Requires X-Admin-Secret header.
   */
  @Patch('admin/:id/cancel')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  adminCancelOrder(@Param('id') id: string, @Body() dto: CancelOrderDto) {
    return this.ordersService.adminCancelOrder(id, dto.reason);
  }

  @Delete('admin/:id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async adminSoftDelete(@Param('id') id: string) {
    await this.ordersService.softDelete(id);
  }
}
