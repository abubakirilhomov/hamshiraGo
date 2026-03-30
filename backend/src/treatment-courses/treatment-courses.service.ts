import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { TreatmentCourse } from './entities/treatment-course.entity';
import { CreateTreatmentCourseDto } from './dto/create-treatment-course.dto';
import { UpdateTreatmentCourseDto } from './dto/update-treatment-course.dto';
import { PushNotificationsService } from '../realtime/push-notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TreatmentCoursesService {
  private readonly logger = new Logger(TreatmentCoursesService.name);

  constructor(
    @InjectRepository(TreatmentCourse)
    private courseRepo: Repository<TreatmentCourse>,
    private pushService: PushNotificationsService,
    private usersService: UsersService,
  ) {}

  async create(clientId: string, dto: CreateTreatmentCourseDto): Promise<TreatmentCourse> {
    const course = this.courseRepo.create({
      clientId,
      title: dto.title,
      serviceId: dto.serviceId,
      totalProcedures: dto.totalProcedures,
      intervalDays: dto.intervalDays,
      nextDate: dto.nextDate ? new Date(dto.nextDate) : null,
      status: 'ACTIVE',
    });
    return this.courseRepo.save(course);
  }

  async findByClient(clientId: string): Promise<TreatmentCourse[]> {
    return this.courseRepo.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, clientId: string, dto: UpdateTreatmentCourseDto): Promise<TreatmentCourse> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Treatment course not found');
    if (course.clientId !== clientId) throw new ForbiddenException('Not your course');

    if (dto.markComplete) {
      course.completedProcedures += 1;

      // Recalculate nextDate
      if (course.nextDate) {
        const next = new Date(course.nextDate);
        next.setDate(next.getDate() + course.intervalDays);
        course.nextDate = next;
      } else {
        const next = new Date();
        next.setDate(next.getDate() + course.intervalDays);
        course.nextDate = next;
      }

      // Reset reminder flag since nextDate advanced
      course.reminderSentToday = false;

      // Auto-complete course if all procedures done
      if (course.completedProcedures >= course.totalProcedures) {
        course.status = 'COMPLETED';
        course.nextDate = null;
      }
    }

    if (dto.title !== undefined) course.title = dto.title;
    if (dto.totalProcedures !== undefined) course.totalProcedures = dto.totalProcedures;
    if (dto.intervalDays !== undefined) course.intervalDays = dto.intervalDays;
    if (dto.nextDate !== undefined) {
      course.nextDate = new Date(dto.nextDate);
      course.reminderSentToday = false;
    }
    if (dto.status !== undefined) course.status = dto.status;

    return this.courseRepo.save(course);
  }

  async delete(id: string, clientId: string): Promise<void> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Treatment course not found');
    if (course.clientId !== clientId) throw new ForbiddenException('Not your course');
    await this.courseRepo.remove(course);
  }

  /** Cron: runs every hour — sends push reminders for courses due within 2 hours */
  @Cron('0 * * * *')
  async sendReminders(): Promise<void> {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const dueCourses = await this.courseRepo.find({
      where: {
        status: 'ACTIVE',
        reminderSentToday: false,
        nextDate: LessThanOrEqual(twoHoursLater),
      },
    });

    if (!dueCourses.length) return;

    this.logger.log(`Sending reminders for ${dueCourses.length} treatment course(s)`);

    for (const course of dueCourses) {
      try {
        const pushToken = await this.usersService.getPushToken(course.clientId);
        if (pushToken) {
          await this.pushService.send([pushToken], {
            title: '💊 Напоминание о процедуре',
            body: `Через 2 часа: ${course.title}`,
            sound: 'default',
            data: { courseId: course.id },
            channelId: 'order_updates',
            priority: 'high',
          });
        }
        // Mark reminder sent so we don't re-send until nextDate advances
        await this.courseRepo.update(course.id, { reminderSentToday: true });
      } catch (err) {
        this.logger.error(`Failed to send reminder for course ${course.id}: ${err}`);
      }
    }
  }
}
