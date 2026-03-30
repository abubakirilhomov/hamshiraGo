import { IsString, MinLength, Matches, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterClientDto {
  @ApiProperty({ example: '+998901234567', description: 'Телефон в формате +998XXXXXXXXX' })
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'Phone must be in format +998XXXXXXXXX' })
  phone!: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @ApiProperty({ example: 'Алишер', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'AB12CD34', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  referredByCode?: string;
}
