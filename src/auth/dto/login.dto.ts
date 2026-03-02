import { IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'Phone must be in format +998XXXXXXXXX' })
  phone: string;

  @IsString()
  @MinLength(1)
  password: string;
}
