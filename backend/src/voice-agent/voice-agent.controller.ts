import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { VoiceAgentService } from './voice-agent.service';
import { VoiceChatDto, VoiceSynthesizeDto } from './dto/voice-chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';

/**
 * Optional JWT guard — does not throw if no token present.
 * Allows anonymous access while still extracting clientId when available.
 */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
class OptionalJwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<T>(err: Error | null, user: T): T {
    // If no token or invalid token, just return null — no error
    return user || (null as T);
  }
}

/**
 * Extract clientId from JWT if available, return null otherwise.
 */
import { createParamDecorator } from '@nestjs/common';

const OptionalClientId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<{ user?: { id: string } }>();
    return request.user?.id ?? null;
  },
);

@ApiTags('voice-agent')
@Controller('voice-agent')
export class VoiceAgentController {
  constructor(private readonly voiceAgentService: VoiceAgentService) {}

  // ── STT ──────────────────────────────────────────────────────────────────

  @Post('transcribe')
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Transcribe audio to text (Groq Whisper)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['.webm', '.m4a', '.wav', '.mp4', '.ogg', '.mp3'];
        if (!allowed.includes(extname(file.originalname).toLowerCase())) {
          return cb(
            new BadRequestException('Only webm, m4a, wav, mp4, ogg, mp3 files allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Query('lang') lang?: string,
  ) {
    if (!file) throw new BadRequestException('NO_FILE_PROVIDED');
    return this.voiceAgentService.transcribe(
      file.buffer,
      lang === 'uz' ? 'uz' : 'ru',
      file.originalname,
    );
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  @Post('chat')
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Send message to voice AI agent' })
  async chat(
    @Body() dto: VoiceChatDto,
    @OptionalClientId() clientId: string | null,
  ) {
    return this.voiceAgentService.chat(
      dto.sessionId ?? null,
      dto.message,
      dto.lang ?? 'ru',
      clientId,
    );
  }

  // ── TTS ──────────────────────────────────────────────────────────────────

  @Post('synthesize')
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Text-to-speech (OpenAI TTS-1)' })
  async synthesize(
    @Body() dto: VoiceSynthesizeDto,
    @Res() res: Response,
  ) {
    const audio = await this.voiceAgentService.synthesize(
      dto.text,
      dto.lang ?? 'ru',
    );

    if (!audio) {
      res.status(503).json({ error: 'VOICE_TTS_NOT_CONFIGURED' });
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audio.length);
    res.send(audio);
  }

  // ── Session ──────────────────────────────────────────────────────────────

  @Get('session/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get voice session by ID' })
  async getSession(@Param('id') id: string) {
    const session = await this.voiceAgentService.getSession(id);
    if (!session) throw new BadRequestException('VOICE_SESSION_NOT_FOUND');
    return session;
  }

  @Delete('session/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete voice session' })
  async deleteSession(@Param('id') id: string) {
    await this.voiceAgentService.deleteSession(id);
  }

  // ── Booking ──────────────────────────────────────────────────────────────

  @Post('session/:id/book-nurse')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get nurse booking data from completed session' })
  async bookNurse(
    @Param('id') id: string,
    @ClientId() clientId: string,
  ) {
    return this.voiceAgentService.bookNurse(id, clientId);
  }

  @Post('session/:id/book-doctor')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get doctor booking data from completed session' })
  async bookDoctor(
    @Param('id') id: string,
    @ClientId() clientId: string,
  ) {
    return this.voiceAgentService.bookDoctor(id, clientId);
  }

  // ── Admin endpoints ─────────────────────────────────────────────────────

  @Get('admin/sessions')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list voice sessions (paginated)' })
  async adminListSessions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('recommendation') recommendation?: string,
  ) {
    return this.voiceAgentService.findAllSessions(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      { status, recommendation },
    );
  }

  @Get('admin/sessions/stats')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: voice session KPI stats' })
  async adminStats() {
    return this.voiceAgentService.getStats();
  }

  @Get('admin/sessions/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: get full voice session detail' })
  async adminGetSession(@Param('id') id: string) {
    const session = await this.voiceAgentService.getSession(id);
    if (!session) throw new BadRequestException('VOICE_SESSION_NOT_FOUND');
    return session;
  }
}
