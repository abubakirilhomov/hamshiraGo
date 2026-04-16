import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('payment_ledger')
export class PaymentLedger {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  orderId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  consultationId!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  medicId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  doctorId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  companyId!: string | null;

  @Column({ type: 'int' })
  amount!: number; // UZS

  @Column({ type: 'varchar', length: 20 })
  type!: 'EARNING' | 'COMMISSION' | 'REFUND' | 'LEAD_COMMISSION';

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
