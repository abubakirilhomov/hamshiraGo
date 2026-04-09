import {
  IsString,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateCompanyServiceDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsIn(['CONSULTATION', 'LAB', 'DIAGNOSTIC', 'PROCEDURE'])
  category!: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}
