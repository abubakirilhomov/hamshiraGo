import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'strongpassword' })
  @IsString()
  @MinLength(1)
  password!: string;
}
