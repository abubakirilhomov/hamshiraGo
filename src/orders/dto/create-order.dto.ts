import { IsString, IsUUID, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderLocationDto {
  @ApiProperty({ example: 41.2995 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 69.2401 })
  @IsNumber()
  longitude!: number;

  @ApiProperty({ example: 'ул. Амира Темура, 107' })
  @IsString()
  house!: string;

  @ApiProperty({ example: '3', required: false })
  @IsString()
  @IsOptional()
  floor?: string;

  @ApiProperty({ example: '12', required: false })
  @IsString()
  @IsOptional()
  apartment?: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  phone!: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'uuid-of-service', description: 'ID услуги из каталога' })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({ example: 50000, required: false, description: 'Скидка в UZS (опционально)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({ type: OrderLocationDto })
  @ValidateNested()
  @Type(() => OrderLocationDto)
  location!: OrderLocationDto;
}
