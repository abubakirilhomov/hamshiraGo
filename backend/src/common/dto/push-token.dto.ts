import { IsString, MaxLength } from 'class-validator';

export class PushTokenDto {
  @IsString()
  @MaxLength(500)
  token!: string;
}
