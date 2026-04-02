import { IsOptional, IsBoolean, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderLocationDto } from '../../orders/dto/create-order.dto';

export class ConfirmPrescriptionDto {
  @ValidateNested()
  @Type(() => OrderLocationDto)
  location!: OrderLocationDto;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;
}
