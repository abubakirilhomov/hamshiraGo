import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TreatmentCoursesService } from './treatment-courses.service';
import { CreateTreatmentCourseDto } from './dto/create-treatment-course.dto';
import { UpdateTreatmentCourseDto } from './dto/update-treatment-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';

@UseGuards(JwtAuthGuard)
@Controller('treatment-courses')
export class TreatmentCoursesController {
  constructor(private readonly service: TreatmentCoursesService) {}

  @Post()
  create(@ClientId() clientId: string, @Body() dto: CreateTreatmentCourseDto) {
    return this.service.create(clientId, dto);
  }

  @Get('my')
  findMy(@ClientId() clientId: string) {
    return this.service.findByClient(clientId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @ClientId() clientId: string,
    @Body() dto: UpdateTreatmentCourseDto,
  ) {
    return this.service.update(id, clientId, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string, @ClientId() clientId: string) {
    return this.service.delete(id, clientId);
  }
}
