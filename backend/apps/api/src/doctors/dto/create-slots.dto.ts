import { IsDateString, IsInt, IsString, Max, Min } from 'class-validator';

export class CreateSlotsDto {
  @IsDateString()
  date!: string; // "2026-04-15"

  @IsString()
  startTime!: string; // "09:00"

  @IsString()
  endTime!: string; // "17:00"

  @IsInt()
  @Min(15)
  @Max(120)
  intervalMinutes!: number; // 30 = creates 30-min slots
}
