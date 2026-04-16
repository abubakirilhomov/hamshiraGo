import { Throttle } from '@nestjs/throttler';
import {
  BadRequestException,
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
  ServiceUnavailableException,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { DoctorsService } from './doctors.service';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { LoginDoctorDto } from './dto/login-doctor.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { VerifyDoctorDto } from './dto/verify-doctor.dto';
import { DoctorAuthGuard } from '../auth/guards/doctor-auth.guard';
import { DoctorId } from '../auth/decorators/doctor-id.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CloudinaryService } from '../common/cloudinary.service';
import { IpThrottlerGuard } from '../common/guards/ip-throttler.guard';
import { PushTokenDto } from '../common/dto/push-token.dto';
import { WebPushSubscriptionDto } from '../common/dto/web-push-subscription.dto';
import { WebPushService } from '../realtime/web-push.service';
import { CreateSlotsDto } from './dto/create-slots.dto';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly webPushService: WebPushService,
  ) {}

  // ── Auth ──────────────────────────────────────────────────────────────────

  @Post('register')
  @UseGuards(IpThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Register a doctor' })
  register(@Body() dto: RegisterDoctorDto) {
    return this.doctorsService.register(dto);
  }

  @Post('login')
  @UseGuards(IpThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Doctor login' })
  login(@Body() dto: LoginDoctorDto) {
    return this.doctorsService.login(dto);
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(DoctorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current doctor profile' })
  getProfile(@DoctorId() doctorId: string) {
    return this.doctorsService.getProfile(doctorId);
  }

  @Patch('profile')
  @UseGuards(DoctorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update doctor profile' })
  updateProfile(@DoctorId() doctorId: string, @Body() dto: UpdateDoctorProfileDto) {
    return this.doctorsService.updateProfile(doctorId, dto);
  }

  // ── Push token ────────────────────────────────────────────────────────────

  @Patch('push-token')
  @UseGuards(DoctorAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  async savePushToken(@DoctorId() doctorId: string, @Body() body: PushTokenDto) {
    if (body?.token) await this.doctorsService.savePushToken(doctorId, body.token);
  }

  // ── Web Push ──────────────────────────────────────────────────────────────

  @Post('web-push-subscription')
  @UseGuards(DoctorAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save doctor web push subscription' })
  async saveWebPushSubscription(
    @DoctorId() doctorId: string,
    @Body() body: WebPushSubscriptionDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    await this.webPushService.saveSubscription({
      subscriberType: 'doctor',
      subscriberId: doctorId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent,
    });
  }

  @Delete('web-push-subscription')
  @UseGuards(DoctorAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove doctor web push subscription' })
  async deleteWebPushSubscription(@Body() body: { endpoint: string }) {
    if (body?.endpoint) await this.webPushService.removeSubscription(body.endpoint);
  }

  // ── Telegram chat_id ──────────────────────────────────────────────────────

  @Patch('telegram-chat-id')
  @UseGuards(DoctorAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  async saveTelegramChatId(@DoctorId() doctorId: string, @Body() body: { chatId: string | null }) {
    const chatId = body?.chatId === null ? null : body?.chatId ? String(body.chatId) : null;
    if (chatId === undefined) throw new BadRequestException('CHATID_REQUIRED');
    await this.doctorsService.saveTelegramChatId(doctorId, chatId);
  }

  // ── Slots (doctor's own) ──────────────────────────────────────────────────

  @Post('me/slots')
  @UseGuards(DoctorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create time slots for the day' })
  createSlots(@DoctorId() doctorId: string, @Body() dto: CreateSlotsDto) {
    return this.doctorsService.createSlots(doctorId, dto);
  }

  @Get('me/slots')
  @UseGuards(DoctorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own slots (all, including booked)' })
  getMySlots(@DoctorId() doctorId: string, @Query('date') date?: string) {
    return this.doctorsService.getDoctorSlots(doctorId, date);
  }

  @Delete('me/slots/:slotId')
  @UseGuards(DoctorAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an unbooked slot' })
  deleteSlot(@DoctorId() doctorId: string, @Param('slotId') slotId: string) {
    return this.doctorsService.deleteSlot(doctorId, slotId);
  }

  // ── Documents upload (Cloudinary) ─────────────────────────────────────────

  @Post('documents')
  @UseGuards(DoctorAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload verification documents' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'facePhoto', maxCount: 1 },
        { name: 'licensePhoto', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
          const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
          if (!allowed.includes(extname(file.originalname).toLowerCase())) {
            return cb(new BadRequestException('Only jpg/jpeg/png/webp files are allowed'), false);
          }
          cb(null, true);
        },
      },
    ),
  )
  async uploadDocuments(
    @DoctorId() doctorId: string,
    @UploadedFiles() files: { facePhoto?: Express.Multer.File[]; licensePhoto?: Express.Multer.File[] },
  ) {
    if (!this.cloudinaryService.isConfigured()) {
      throw new ServiceUnavailableException('FILE_STORAGE_NOT_CONFIGURED');
    }

    const [faceUrl, licenseUrl] = await Promise.all([
      files.facePhoto?.[0]
        ? this.cloudinaryService.uploadBuffer(
            files.facePhoto[0].buffer,
            'hamshirago/doctor-docs',
            `face-${doctorId}`,
          )
        : Promise.resolve(null),
      files.licensePhoto?.[0]
        ? this.cloudinaryService.uploadBuffer(
            files.licensePhoto[0].buffer,
            'hamshirago/doctor-docs',
            `license-${doctorId}`,
          )
        : Promise.resolve(null),
    ]);

    await this.doctorsService.saveDocumentUrls(doctorId, faceUrl, licenseUrl);
  }

  // ── Profile photo ─────────────────────────────────────────────────────────

  @Post('profile-photo')
  @UseGuards(DoctorAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload doctor profile photo' })
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
  async uploadProfilePhoto(
    @DoctorId() doctorId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('NO_FILE_PROVIDED');
    if (!this.cloudinaryService.isConfigured()) {
      throw new ServiceUnavailableException('FILE_STORAGE_NOT_CONFIGURED');
    }
    const url = await this.cloudinaryService.uploadBuffer(
      file.buffer,
      'hamshirago/doctor-profiles',
      `profile-${doctorId}`,
    );
    await this.doctorsService.saveProfilePhotoUrl(doctorId, url);
  }

  // ── Admin endpoints ───────────────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List all doctors (admin)' })
  getAllDoctorsAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('verificationStatus') verificationStatus?: string,
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

    return this.doctorsService.findAllAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      verificationStatus,
      parsedIsBlocked,
    );
  }

  @Get('admin/pending')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List doctors with pending verification (admin)' })
  getPendingVerifications() {
    return this.doctorsService.getPendingVerifications();
  }

  @Patch('admin/:id/verify')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Approve or reject doctor verification (admin)' })
  verifyDoctor(@Param('id') id: string, @Body() dto: VerifyDoctorDto) {
    return this.doctorsService.verifyDoctor(id, dto);
  }

  @Patch('admin/:id/block')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Block or unblock doctor (admin)' })
  blockDoctor(@Param('id') id: string, @Body() body: { isBlocked: boolean }) {
    return this.doctorsService.blockDoctor(id, body.isBlocked ?? true);
  }

  // ── Public: available slots for a doctor ─────────────────────────────────

  @Get(':id/slots')
  @ApiOperation({ summary: 'Get available slots for a doctor (public)' })
  getAvailableSlots(
    @Param('id') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.doctorsService.getAvailableSlots(doctorId, date);
  }
}
