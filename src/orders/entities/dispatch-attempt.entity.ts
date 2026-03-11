import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { Medic } from '../../medics/entities/medic.entity';

export enum DispatchResult {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  TIMEOUT = 'TIMEOUT',
}

@Entity('dispatch_attempts')
export class DispatchAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  orderId!: string;

  @Index()
  @Column({ type: 'uuid' })
  medicId!: string;

  @CreateDateColumn()
  sentAt!: Date;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({
    type: 'enum',
    enum: DispatchResult,
    default: DispatchResult.PENDING,
  })
  result!: DispatchResult;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @ManyToOne(() => Medic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicId' })
  medic!: Medic;
}
