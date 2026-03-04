import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order-status.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.ON_THE_WAY })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
