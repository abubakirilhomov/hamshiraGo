import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('clinic_appointments')
export class ClinicAppointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid', nullable: true })
  roomId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  doctorId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  patientName!: string;

  @Column({ type: 'varchar', length: 30 })
  patientPhone!: string;

  @Column({ type: 'uuid', nullable: true })
  patientId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  serviceId!: string | null;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: 5 })
  time!: string;

  @Column({ type: 'varchar', length: 20, default: 'SCHEDULED' })
  status!: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

  @Column({ type: 'varchar', length: 20, default: 'MANUAL' })
  source!: 'MANUAL' | 'SALOMAT_LEAD' | 'ONLINE';

  @Column({ type: 'varchar', length: 20, nullable: true })
  paymentType!: 'CASH' | 'TERMINAL' | 'ONLINE' | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'text', nullable: true })
  cancelReason!: string | null;

  @Column({ type: 'uuid', nullable: true })
  leadId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
