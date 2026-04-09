import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('salomat_audit_logs')
export class SalomatAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  clientId!: string | null;

  @Column({ type: 'varchar', length: 50 })
  action!: string;
  // Actions: RED_FLAG, DOCTOR_REFERRAL, NURSE_REFERRAL, CONSULTATION_BOOKED,
  // SAFEGUARD_TRIGGERED, RATE_LIMIT_HIT

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialization!: string | null;

  @Column({ type: 'text', nullable: true })
  details!: string | null;

  @Column({ type: 'int', nullable: true })
  triageLevel!: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}
