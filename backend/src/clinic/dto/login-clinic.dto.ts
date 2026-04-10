import { IsString, Matches, MinLength } from 'class-validator';

export class LoginClinicDto {
  @Matches(/^\+998\d{9}$/, { message: 'PHONE_FORMAT_INVALID' })
  phone!: string;

  @IsString()
  @MinLength(6, { message: 'PASSWORD_MIN_LENGTH' })
  password!: string;
}
