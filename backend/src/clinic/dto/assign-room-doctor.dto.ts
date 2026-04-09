import { IsUUID, IsInt, Min, Max, Matches } from 'class-validator';

export class AssignRoomDoctorDto {
  @IsUUID()
  doctorId!: string;

  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime!: string;

  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:MM format' })
  endTime!: string;
}
