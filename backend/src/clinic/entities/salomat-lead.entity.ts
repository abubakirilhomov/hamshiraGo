import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('salomat_leads')
export class SalomatLead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  clinicId!: string; // Company ID

  @Column({ type: 'varchar', length: 255 })
  patientName!: string;

  @Column({ type: 'varchar', length: 30 })
  patientPhone!: string;

  @Column({ type: 'uuid', nullable: true })
  patientId!: string | null; // User ID if registered

  @Column({ type: 'text', nullable: true })
  aiSummary!: string | null; // Salomat conversation summary

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialization!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'NEW' })
  status!: 'NEW' | 'CONTACTED' | 'BOOKED' | 'VISITED' | 'MISSED';

  @Column({ type: 'uuid', nullable: true })
  appointmentId!: string | null; // linked appointment

  @Column({ type: 'int', nullable: true })
  commissionAmount!: number | null; // UZS

  @Column({ type: 'boolean', default: false })
  commissionPaid!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
