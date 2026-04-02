import { IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitNpsDto {
  @IsInt()
  @Min(0)
  @Max(10)
  score!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
