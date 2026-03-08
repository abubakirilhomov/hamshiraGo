import { IsBoolean } from 'class-validator';

export class PatchSettingsDto {
  @IsBoolean()
  isPaidMode!: boolean;
}
