import { IsIn, IsString, MaxLength } from 'class-validator';

export class PushCampaignDto {
  @IsString()
  @IsIn(['all', 'new_7d', 'inactive_30d', 'tier_gold'])
  segment!: string;

  @IsString()
  @MaxLength(100)
  title!: string;

  @IsString()
  @MaxLength(500)
  body!: string;
}
