import { IsString, MinLength, Matches } from 'class-validator';

export class LoginMedicDto {
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'Phone must be in format +998XXXXXXXXX' })
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
