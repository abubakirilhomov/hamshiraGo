import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { Consultation } from './entities/consultation.entity';
import { PushNotificationsService } from '../realtime/push-notifications.service';
import { WebPushService } from '../realtime/web-push.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly livekitUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private roomService: RoomServiceClient | null = null;

  constructor(
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
    private readonly config: ConfigService,
    private readonly pushService: PushNotificationsService,
    private readonly webPushService: WebPushService,
    private readonly usersService: UsersService,
  ) {
    this.livekitUrl = this.config.get<string>('LIVEKIT_API_URL', '');
    this.apiKey = this.config.get<string>('LIVEKIT_API_KEY', '');
    this.apiSecret = this.config.get<string>('LIVEKIT_API_SECRET', '');

    if (this.livekitUrl && this.apiKey && this.apiSecret) {
      this.roomService = new RoomServiceClient(
        this.livekitUrl.replace('wss://', 'https://'),
        this.apiKey,
        this.apiSecret,
      );
    }
  }

  /** Check if LiveKit is configured */
  private ensureConfigured(): void {
    if (!this.apiKey || !this.apiSecret || !this.livekitUrl) {
      throw new BadRequestException('VIDEO_CONSULTATIONS_NOT_CONFIGURED');
    }
  }

  /** Client initiates a video call */
  async initiateCall(
    consultationId: string,
    userId: string,
  ): Promise<{ token: string; serverUrl: string; roomName: string }> {
    this.ensureConfigured();

    const consultation = await this.consultationRepo.findOne({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException('CONSULTATION_NOT_FOUND');
    if (consultation.clientId !== userId) {
      throw new ForbiddenException('NOT_YOUR_CONSULTATION');
    }
    if (consultation.status !== 'ACTIVE' && consultation.status !== 'PENDING') {
      throw new BadRequestException('CONSULTATION_NOT_ACTIVE');
    }
    if (consultation.videoStatus === 'ACTIVE' || consultation.videoStatus === 'CALLING') {
      // Already in a call — return join token
      return this.generateJoinToken(consultation, userId, 'client');
    }

    // Create room
    const roomName = `consultation-${consultationId}`;

    if (this.roomService) {
      try {
        await this.roomService.createRoom({ name: roomName, emptyTimeout: 300, maxParticipants: 2 });
      } catch (err) {
        this.logger.warn(`Room creation (may already exist): ${err}`);
      }
    }

    // Update consultation
    consultation.videoRoomName = roomName;
    consultation.videoStatus = 'CALLING';
    if (consultation.status === 'PENDING') {
      consultation.status = 'ACTIVE';
    }
    await this.consultationRepo.save(consultation);

    // Push doctor (fire-and-forget)
    this.notifyDoctorIncomingCall(consultation).catch((err) =>
      this.logger.warn(`Doctor call push failed: ${err}`),
    );

    return this.generateJoinToken(consultation, userId, 'client');
  }

  /** Join an existing call (client or doctor) */
  async joinCall(
    consultationId: string,
    userId: string,
    role: 'client' | 'doctor',
  ): Promise<{ token: string; serverUrl: string; roomName: string }> {
    this.ensureConfigured();

    const consultation = await this.consultationRepo.findOne({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException('CONSULTATION_NOT_FOUND');

    // Verify access
    if (role === 'client' && consultation.clientId !== userId) {
      throw new ForbiddenException('NOT_YOUR_CONSULTATION');
    }
    // For doctor role — userId check against doctor ID is more complex
    // In MVP, we trust JWT role and check consultation exists

    if (!consultation.videoRoomName) {
      throw new BadRequestException('NO_ACTIVE_CALL');
    }

    // If doctor joins, update status to ACTIVE
    if (role === 'doctor' && consultation.videoStatus === 'CALLING') {
      consultation.videoStatus = 'ACTIVE';
      await this.consultationRepo.save(consultation);
    }

    return this.generateJoinToken(consultation, userId, role);
  }

  /** End a video call */
  async endCall(consultationId: string, userId: string): Promise<void> {
    const consultation = await this.consultationRepo.findOne({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException('CONSULTATION_NOT_FOUND');

    if (consultation.videoRoomName && this.roomService) {
      try {
        await this.roomService.deleteRoom(consultation.videoRoomName);
      } catch (err) {
        this.logger.warn(`Room deletion failed: ${err}`);
      }
    }

    consultation.videoStatus = 'ENDED';
    await this.consultationRepo.save(consultation);
  }

  /** Get call status */
  async getCallStatus(
    consultationId: string,
  ): Promise<{ videoStatus: string | null; roomName: string | null; serverUrl: string }> {
    const consultation = await this.consultationRepo.findOne({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException('CONSULTATION_NOT_FOUND');

    return {
      videoStatus: consultation.videoStatus,
      roomName: consultation.videoRoomName,
      serverUrl: this.livekitUrl,
    };
  }

  /** Generate a LiveKit access token */
  private async generateJoinToken(
    consultation: Consultation,
    userId: string,
    role: string,
  ): Promise<{ token: string; serverUrl: string; roomName: string }> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: `${role}-${userId}`,
      name: role === 'client' ? 'Клиент' : 'Врач',
    });

    token.addGrant({
      room: consultation.videoRoomName!,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return {
      token: await token.toJwt(),
      serverUrl: this.livekitUrl,
      roomName: consultation.videoRoomName!,
    };
  }

  /** Push notification to doctor about incoming call */
  private async notifyDoctorIncomingCall(consultation: Consultation): Promise<void> {
    // Doctor doesn't have push token in our system (doctors are external).
    // For MVP: notify admin or use Telegram if doctor has chat ID.
    // We notify the CLIENT about status changes via existing push.
    // Doctor notification will be handled by admin panel / web-doctor panel.
    this.logger.log(
      `Incoming call for consultation ${consultation.id}, doctor ${consultation.doctorId}`,
    );
  }
}
