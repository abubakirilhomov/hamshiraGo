import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMedicProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
