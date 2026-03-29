import { IsBoolean } from 'class-validator';

export class BlockUserDto {
  @IsBoolean()
  isBlocked!: boolean;
}
