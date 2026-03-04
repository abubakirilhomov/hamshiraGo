import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export type PaymentProvider = 'payme' | 'click';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'failed';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  orderId!: string;

  @Column({ type: 'varchar', length: 10 })
  provider!: PaymentProvider;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: PaymentStatus;

  /** Amount in UZS (whole sum) */
  @Column({ type: 'int' })
  amount!: number;

  /** Provider's own transaction ID */
  @Column({ type: 'varchar', length: 255, nullable: true })
  providerTransactionId!: string | null;

  /** Payme state: 1=created, 2=completed, -1=cancelled */
  @Column({ type: 'int', nullable: true })
  providerState!: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  performTime!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelTime!: Date | null;

  /** Payme cancellation reason code */
  @Column({ type: 'int', nullable: true })
  reason!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;
}
