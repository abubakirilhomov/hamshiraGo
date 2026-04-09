import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  floor?: string;
}
