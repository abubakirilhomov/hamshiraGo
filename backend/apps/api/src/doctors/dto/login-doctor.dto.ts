import { IsString, Matches } from 'class-validator';

export class LoginDoctorDto {
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'PHONE_FORMAT_INVALID' })
  phone!: string;

  @IsString()
  password!: string;
}
