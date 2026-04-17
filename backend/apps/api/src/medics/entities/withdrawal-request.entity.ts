import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'DECLINED';

@Entity('withdrawal_requests')
export class WithdrawalRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  medicId!: string;

  /** Amount in UZS */
  @Column({ type: 'int' })
  amount!: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: WithdrawalStatus;

  /** Card number for payout (e.g. Uzcard/Humo) */
  @Column({ type: 'varchar', length: 30, nullable: true, default: null })
  cardNumber!: string | null;

  /** Admin note (e.g. decline reason) */
  @Column({ type: 'text', nullable: true, default: null })
  adminNote!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
