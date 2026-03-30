import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentCourse } from './entities/treatment-course.entity';
import { TreatmentCoursesService } from './treatment-courses.service';
import { TreatmentCoursesController } from './treatment-courses.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TreatmentCourse]),
    RealtimeModule,
    UsersModule,
  ],
  controllers: [TreatmentCoursesController],
  providers: [TreatmentCoursesService],
  exports: [TreatmentCoursesService],
})
export class TreatmentCoursesModule {}
