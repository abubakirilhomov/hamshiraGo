import { IsUUID } from 'class-validator';

export class PurchaseSubscriptionDto {
  @IsUUID()
  tierId!: string;
}
