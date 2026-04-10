import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePrescriptionDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
