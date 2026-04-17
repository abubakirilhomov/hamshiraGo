import { IsIn } from 'class-validator';

export class UpdateLeadStatusDto {
  @IsIn(['NEW', 'CONTACTED', 'BOOKED', 'VISITED', 'MISSED'])
  status!: 'NEW' | 'CONTACTED' | 'BOOKED' | 'VISITED' | 'MISSED';
}
