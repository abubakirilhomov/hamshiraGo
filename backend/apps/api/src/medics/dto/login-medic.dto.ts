import { IsString, MinLength, Matches } from 'class-validator';

export class LoginMedicDto {
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'PHONE_FORMAT_INVALID' })
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
