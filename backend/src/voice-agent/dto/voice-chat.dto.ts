import { IsOptional, IsString, IsIn, IsUUID } from 'class-validator';

export class VoiceChatDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsIn(['ru', 'uz'])
  lang?: string;
}

export class VoiceSynthesizeDto {
  @IsString()
  text!: string;

  @IsOptional()
  @IsIn(['ru', 'uz'])
  lang?: string;
}
