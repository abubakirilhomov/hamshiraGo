import { IsString, MinLength, IsOptional, IsInt, Min, Max, Matches } from 'class-validator';

export class RegisterMedicDto {
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'Phone must be in format +998XXXXXXXXX' })
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears?: number;
}
