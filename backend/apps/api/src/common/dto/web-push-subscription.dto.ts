import { IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class WebPushKeysDto {
  @IsString()
  @MaxLength(500)
  p256dh!: string;

  @IsString()
  @MaxLength(500)
  auth!: string;
}

export class WebPushSubscriptionDto {
  @IsString()
  @MaxLength(2000)
  endpoint!: string;

  @ValidateNested()
  @Type(() => WebPushKeysDto)
  keys!: WebPushKeysDto;
}
